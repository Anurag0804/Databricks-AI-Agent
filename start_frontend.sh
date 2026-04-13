#!/bin/bash
# Start Frontend Server

echo "🎨 Starting Frontend Server..."
echo "================================"
echo ""

FRONTEND_DIR="/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing Node.js dependencies..."
    npm install
fi

echo ""
echo "🚀 Frontend will run on http://localhost:3000"
echo "   Make sure backend is running on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm start
