import asyncio
import pytest
from services.merge_runner import MergeRunner

@pytest.mark.asyncio
async def test_merge_runner_cancel_already_exited():
    runner = MergeRunner()
    # Create a process that finishes immediately
    process = await asyncio.create_subprocess_exec("echo", "hello", stdout=asyncio.subprocess.PIPE)
    runner.active_process = process

    # Let it exit
    await process.wait()

    # Ensure this doesn't raise ProcessLookupError
    await runner.cancel_process()
    assert runner.active_process is None
