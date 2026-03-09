#!/bin/bash
set -e

echo "Starting Setup..."

# Backend Setup
echo "Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Clone mergekit and llama.cpp
echo "Cloning required repositories..."
mkdir -p tools
cd tools

# Mergekit is installed via pip (requirements.txt), but we clone for reference/scripts if needed
if [ ! -d "mergekit" ]; then
    git clone https://github.com/arcee-ai/mergekit.git
fi

# llama.cpp
if [ ! -f "llama.cpp/llama-quantize" ]; then
    if [ ! -d "llama.cpp" ] || [ -z "$(ls -A llama.cpp)" ]; then
        rm -rf llama.cpp
        git clone https://github.com/ggerganov/llama.cpp.git
    fi
    cd llama.cpp

    # We will compile it so it is cross platform
    echo "Compiling llama.cpp..."
    cmake -B build && cmake --build build --config Release -j $(nproc)
    cp build/bin/llama-quantize .

    # Install Python dependencies for llama.cpp conversion scripts
    pip install -r requirements.txt
    cd ..
fi

cd ../..

# Frontend Setup
echo "Setting up Frontend..."
cd frontend
if [ ! -f "package.json" ]; then
    npm create vite@latest . -- --template react
    npm install
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    npm install lucide-react axios react-router-dom
fi

echo "Setup Complete! You can now run the application."
echo "To start the backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "To start the frontend: cd frontend && npm run dev"
