import sys
import os
from PyInstaller.__main__ import run

if __name__ == '__main__':
    opts = [
        'main.py',
        '--name=main',
        '--onefile', # Package into a single executable
        '--windowed', # Do not open a console window
        '--distpath=dist', # Output directory
        '--workpath=build',
        '--clean',
        '--hidden-import=uvicorn.logging',
        '--hidden-import=uvicorn.loops',
        '--hidden-import=uvicorn.loops.auto',
        '--hidden-import=uvicorn.protocols',
        '--hidden-import=uvicorn.protocols.http',
        '--hidden-import=uvicorn.protocols.http.auto',
        '--hidden-import=uvicorn.protocols.websockets',
        '--hidden-import=uvicorn.protocols.websockets.auto',
        '--hidden-import=uvicorn.lifespan',
        '--hidden-import=uvicorn.lifespan.on',
        '--hidden-import=uvicorn.lifespan.off',
        '--hidden-import=fastapi',
        '--hidden-import=pydantic',
        '--hidden-import=mergekit',
        '--hidden-import=transformers',
        '--hidden-import=torch',
        '--hidden-import=accelerate',
        '--hidden-import=websockets',
        f'--add-data=tools{os.pathsep}tools', # Include tools (llama.cpp, mergekit scripts)
        '--paths=.'
    ]
    run(opts)
