from fastapi import APIRouter, HTTPException, WebSocket, Depends
from api.models import HFConfigReq, MergeConfigReq, QuantizeConfigReq
from services.hf_client import get_model_config
from services.merge_runner import MergeRunner
from core.utils import get_tool_path
import json
import os
import asyncio
from fastapi.responses import JSONResponse
import sys

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
    # Each connection gets its own MergeRunner to track its own subprocess
    local_runner = MergeRunner()
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
            await local_runner.run_command_with_websocket(cmd, websocket, env=env, task_name="Merge")

        elif action == "convert_f16":
             # Llama.cpp convert script
             model_path = request.get("model_path")
             convert_script = get_tool_path("llama.cpp", "convert_hf_to_gguf.py")
             cmd = [sys.executable, convert_script, model_path, "--outtype", "f16"]
             await websocket.send_text(f"Starting conversion to F16: {' '.join(cmd)}")
             await local_runner.run_command_with_websocket(cmd, websocket, task_name="F16 Conversion")

        elif action == "quantize":
             # Llama.cpp quantize binary
             input_model = request.get("input_model") # The f16 model
             output_model = request.get("output_model")
             qtype = request.get("qtype", "q4_k_m")

             # Handle Windows executable extension
             exe_ext = ".exe" if sys.platform == "win32" else ""
             quantize_bin = get_tool_path("llama.cpp", f"llama-quantize{exe_ext}")

             cmd = [quantize_bin, input_model, output_model, qtype]
             await websocket.send_text(f"Starting Quantization: {' '.join(cmd)}")
             await local_runner.run_command_with_websocket(cmd, websocket, task_name="Quantization")

    except Exception as e:
        await websocket.send_text(f"WebSocket Error: {str(e)}")
    finally:
        await websocket.close()
