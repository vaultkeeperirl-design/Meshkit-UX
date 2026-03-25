import yaml
import subprocess
import asyncio
from fastapi import WebSocket
from typing import Dict, Any

class MergeRunner:
    """
    Manages the generation of mergekit YAML configurations and the execution
    of background processes, streaming their output via WebSockets.
    """

    def __init__(self):
        """Initializes the MergeRunner with no active process."""
        self.active_process = None

    async def generate_yaml(self, config_data: Dict[str, Any], output_path: str = "merge_config.yml") -> str:
        """
        Converts a UI JSON configuration into the exact YAML format expected by mergekit.

        Args:
            config_data: A dictionary containing the UI merge parameters (e.g., merge_method, base_model, models, parameters).
            output_path: The file path where the generated YAML should be saved. Defaults to 'merge_config.yml'.

        Returns:
            The file path where the YAML configuration was written.
        """
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

        if config_data.get("base_model"):
            mergekit_config["base_model"] = config_data.get("base_model")

        if "parameters" in config_data and config_data["parameters"]:
            mergekit_config["parameters"] = config_data["parameters"]

        def write_yaml():
            with open(output_path, "w") as f:
                yaml.dump(mergekit_config, f, default_flow_style=False, sort_keys=False)

        await asyncio.to_thread(write_yaml)

        return output_path

    async def run_command_with_websocket(self, cmd: list, websocket: WebSocket, env: dict = None, task_name: str = "Process"):
        """
        Runs a shell command as an asynchronous subprocess and streams its output (stdout and stderr)
        to a connected WebSocket client.

        Args:
            cmd: A list of strings representing the command and its arguments.
            websocket: The active FastAPI WebSocket connection to send output to.
            env: An optional dictionary of environment variables for the subprocess.
            task_name: An optional string to identify the task in completion messages. Defaults to 'Process'.
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
        Terminates the currently active subprocess if one exists.
        Attempts a graceful termination first, falling back to a hard kill if the process
        does not exit within 1 second.
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
