from fastapi import APIRouter, HTTPException, WebSocket, Depends
from api.models import HFConfigReq, MergeConfigReq, QuantizeConfigReq
from services.hf_client import get_model_config
from services.merge_runner import MergeRunner
import json
import os
import asyncio
from fastapi.responses import JSONResponse

router = APIRouter()
runner = MergeRunner()

# Settings file
SETTINGS_FILE = "settings.json"

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    return {"hf_token": ""}

def save_settings(settings):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f)

@router.get("/settings")
def get_settings():
    return load_settings()

@router.post("/settings")
def update_settings(settings: dict):
    save_settings(settings)
    return {"status": "Settings saved"}

@router.post("/hf/config")
async def get_hf_config(req: HFConfigReq):
    settings = load_settings()
    token = req.token or settings.get("hf_token", "")

    config = await get_model_config(req.model_id, token)
    if "error" in config:
        raise HTTPException(status_code=400, detail=config["error"])

    return config

@router.post("/merge/generate-config")
async def generate_merge_config(req: MergeConfigReq):
    yaml_path = await runner.generate_yaml(req.dict(), output_path="merge_config.yml")
    with open(yaml_path, "r") as f:
         yaml_content = f.read()
    return {"yaml_path": yaml_path, "yaml_content": yaml_content}

@router.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    # Wait for the client to tell us what command to run
    try:
        data = await websocket.receive_text()
        request = json.loads(data)
        action = request.get("action")

        settings = load_settings()
        env = os.environ.copy()
        if settings.get("hf_token"):
             env["HF_TOKEN"] = settings.get("hf_token")

        if action == "merge":
            yaml_path = request.get("yaml_path", "merge_config.yml")
            output_path = request.get("output_path", "./merged_model")
            cmd = ["mergekit-yaml", yaml_path, output_path, "--copy-tokenizer"]
            await websocket.send_text(f"Starting merge: {' '.join(cmd)}")

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                env=env
            )

            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                await websocket.send_text(line.decode().rstrip())

            await process.wait()
            await websocket.send_text(f"Merge finished with return code: {process.returncode}")

        elif action == "convert_f16":
             # Llama.cpp convert script
             model_path = request.get("model_path")
             cmd = ["python3", "tools/llama.cpp/convert_hf_to_gguf.py", model_path, "--outtype", "f16"]
             await websocket.send_text(f"Starting conversion to F16: {' '.join(cmd)}")

             process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT
             )
             while True:
                line = await process.stdout.readline()
                if not line:
                    break
                await websocket.send_text(line.decode().rstrip())
             await process.wait()
             await websocket.send_text(f"F16 Conversion finished with return code: {process.returncode}")

        elif action == "quantize":
             # Llama.cpp quantize binary
             input_model = request.get("input_model") # The f16 model
             output_model = request.get("output_model")
             qtype = request.get("qtype", "q4_k_m")

             cmd = ["tools/llama.cpp/llama-quantize", input_model, output_model, qtype]
             await websocket.send_text(f"Starting Quantization: {' '.join(cmd)}")

             process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT
             )
             while True:
                line = await process.stdout.readline()
                if not line:
                    break
                await websocket.send_text(line.decode().rstrip())
             await process.wait()
             await websocket.send_text(f"Quantization finished with return code: {process.returncode}")

    except Exception as e:
        await websocket.send_text(f"WebSocket Error: {str(e)}")
    finally:
        await websocket.close()
