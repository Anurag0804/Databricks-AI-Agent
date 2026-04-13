#!/bin/bash
# Quick Start Script for Ghana Healthcare Intelligence Platform

echo "🚀 Ghana Healthcare Intelligence Platform - Quick Start"
echo "=========================================================="
echo ""

BACKEND_DIR="/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/backend"
FRONTEND_DIR="/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/frontend"

# Check if .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "⚠️  Environment file not found!"
    echo ""
    echo "Creating template .env file..."
    cat > "$BACKEND_DIR/.env" << 'ENVEOF'
# Databricks Connection
DATABRICKS_HOST=https://dbc-5222fa5f-b762.cloud.databricks.com
DATABRICKS_TOKEN=your-databricks-token-here
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id

# Optional Configuration
# ENVIRONMENT=development
# DEBUG=true
# LOG_LEVEL=DEBUG
ENVEOF
    
    echo "✅ Created $BACKEND_DIR/.env"
    echo ""
    echo "🔧 Please edit .env and add your credentials:"
    echo "   1. DATABRICKS_TOKEN: Get from User Settings → Developer → Access Tokens"
    echo "   2. DATABRICKS_HTTP_PATH: Get from SQL Warehouses → Connection Details"
    echo ""
    echo "After updating .env, run this script again."
    exit 1
fi

# Check dependencies
echo "📦 Checking dependencies..."
cd "$BACKEND_DIR"

if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📥 Installing Python dependencies..."
    pip install -r requirements.txt
else
    echo "   ✅ Dependencies already installed"
fi
echo ""

# Start backend
echo "🔧 Starting backend server..."
echo "   Backend will run on http://localhost:8000"
echo "   API docs at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$BACKEND_DIR"
python3 main.py
