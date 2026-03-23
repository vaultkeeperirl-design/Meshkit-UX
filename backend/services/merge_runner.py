import yaml
import subprocess
import asyncio
from fastapi import WebSocket
from typing import Dict, Any

class MergeRunner:
    """
    Service responsible for executing mergekit and llama.cpp operations as subprocesses.

    This class handles generating configuration files, running shell commands
    asynchronously, and streaming their standard output/error to a connected
    WebSocket client in real-time.
    """

    def __init__(self):
        """
        Initializes the MergeRunner instance.
        """
        self.active_process = None

    async def generate_yaml(self, config_data: Dict[str, Any], output_path: str = "merge_config.yml") -> str:
        """
        Converts the UI JSON configuration into the exact YAML format expected by mergekit.

        Args:
            config_data (Dict[str, Any]): The configuration data received from the UI.
            output_path (str, optional): The file path where the YAML will be saved. Defaults to "merge_config.yml".

        Returns:
            str: The output path of the generated YAML file.
        """
        # Convert our UI JSON into the exact format mergekit expects

        # Mapping UI models to mergekit format
        models_formatted = []
        for model in config_data.get("models", []):
            m = {"model": model.get("model_id")}
            if "parameters" in model and model["parameters"]:
                m["parameters"] = model["parameters"]
            models_formatted.append(m)

        mergekit_config = {
            "merge_method": config_data.get("merge_method"),
            "models": models_formatted
        }

        # Some methods need a base_model (like TIES or DARE)
        if config_data.get("base_model"):
            mergekit_config["base_model"] = config_data.get("base_model")

        # Global parameters like weights or slices
        if "parameters" in config_data and config_data["parameters"]:
            mergekit_config["parameters"] = config_data["parameters"]

        # Write to yaml file
        def write_yaml():
            with open(output_path, "w") as f:
                yaml.dump(mergekit_config, f, default_flow_style=False, sort_keys=False)

        await asyncio.to_thread(write_yaml)

        return output_path

    async def run_command_with_websocket(self, cmd: list, websocket: WebSocket, env: dict = None, task_name: str = "Process"):
        """
        Runs a shell command and streams its output (stdout and stderr) to a websocket client.

        Args:
            cmd (list): The command to execute, represented as a list of strings.
            websocket (WebSocket): The active WebSocket connection to stream output to.
            env (dict, optional): Environment variables to pass to the subprocess. Defaults to None.
            task_name (str, optional): A descriptive name for the task being run. Defaults to "Process".

        Raises:
            Exception: Re-raises any exceptions encountered during execution or streaming.
        """
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env
        )
        self.active_process = process

        try:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                try:
                    await websocket.send_text(line.decode().rstrip())
                except Exception:
                    # Client disconnected or error sending
                    await self.cancel_process()
                    break
            await process.wait()
            if getattr(process, "returncode", None) is not None:
                try:
                    await websocket.send_text(f"{task_name} finished with return code: {process.returncode}")
                except Exception:
                    pass
        except Exception as e:
            try:
                await websocket.send_text(f"Error streaming output: {str(e)}")
            except Exception:
                pass
            raise
        finally:
            # We must not clear self.active_process here in finally if the process is still running
            # (e.g., when an exception like disconnect occurs) so cancel_process can kill it later.
            # But if we wait()ed successfully, it means the process ended naturally.
            if getattr(process, "returncode", None) is not None:
                self.active_process = None

    async def cancel_process(self):
        """
        Cancels the currently running active subprocess, if any.

        It first attempts to terminate the process gracefully. If the process
        does not exit within 1 second, it forcibly kills it. Handles exceptions
        gracefully to prevent race conditions during termination.
        """
        if self.active_process:
            try:
                self.active_process.terminate()
            except ProcessLookupError:
                pass
            await asyncio.sleep(1) # wait for termination
            if self.active_process: # if still alive
                 try:
                     self.active_process.kill()
                 except ProcessLookupError:
                     pass
            self.active_process = None
