import yaml
import subprocess
import asyncio
from fastapi import WebSocket
from typing import Dict, Any

class MergeRunner:
    def __init__(self):
        self.active_process = None

    async def generate_yaml(self, config_data: Dict[str, Any], output_path: str = "merge_config.yml") -> str:
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

    async def run_command_with_websocket(self, cmd: list, websocket: WebSocket):
        """Runs a shell command and streams its output (stdout and stderr) to a websocket client."""
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )
        self.active_process = process

        try:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                await websocket.send_text(line.decode().rstrip())
        except Exception as e:
            await websocket.send_text(f"Error streaming output: {str(e)}")
        finally:
            await process.wait()
            await websocket.send_text(f"Process finished with return code: {process.returncode}")
            self.active_process = None

    async def cancel_process(self):
        if self.active_process:
            self.active_process.terminate()
            await asyncio.sleep(1) # wait for termination
            if self.active_process: # if still alive
                 self.active_process.kill()
            self.active_process = None
