#!/bin/bash
set -e

echo "Starting Setup..."

# Backend Setup
echo "Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Build mergekit and llama.cpp
echo "Building required tools..."
cd tools

# llama.cpp
if [ ! -f "llama.cpp/llama-quantize" ]; then
    cd llama.cpp

    # We will compile it so it is cross platform
    echo "Compiling llama.cpp..."
    make -j$(nproc)

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
