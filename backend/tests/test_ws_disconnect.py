import pytest
import json
import asyncio
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect
from main import app
from services.merge_runner import MergeRunner
from unittest.mock import patch, AsyncMock, MagicMock

client = TestClient(app)

@patch("services.merge_runner.asyncio.create_subprocess_exec")
def test_websocket_close_kills_process(mock_exec):
    # Mock process
    # `terminate` and `kill` are regular methods on an asyncio.subprocess.Process, not async methods.
    mock_process = MagicMock()
    # Let readline hang to simulate a long running process
    async def mock_readline():
        await asyncio.sleep(10)
        return b""
    mock_process.stdout.readline = mock_readline
    mock_process.wait = AsyncMock()
    mock_exec.return_value = mock_process

    with client.websocket_connect("/api/ws/logs") as websocket:
        websocket.send_text(json.dumps({
            "action": "merge",
            "yaml_path": "dummy.yml",
            "output_path": "dummy_out"
        }))
        msg = websocket.receive_text()
        assert msg == "Starting merge: mergekit-yaml dummy.yml dummy_out --copy-tokenizer"

        # Set returncode to None to simulate the process is still running
        mock_process.returncode = None

        # Then close websocket, this should trigger Exception in the endpoint
        websocket.close()

    # Endpoint `finally:` block will be executed
    # We want to check if `cancel_process` was called or if the process was terminated
    assert mock_process.terminate.called or mock_process.kill.called
