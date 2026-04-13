#!/bin/bash
# Test script for Ghana Healthcare Intelligence Platform

echo "🔍 Testing Backend Configuration..."
echo "=================================="
echo ""

cd /Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/backend

# Test 1: Check if all required files exist
echo "📂 Checking files..."
files=(
    "config.py"
    "main.py"
    "requirements.txt"
    "services/vector_search.py"
    "services/rag_service.py"
    "services/databricks_client.py"
    "routes/rag.py"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done
echo ""

# Test 2: Check Python imports
echo "🐍 Testing Python imports..."
python3 << 'PYEOF'
import sys
sys.path.insert(0, '/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/backend')

try:
    from config import settings
    print("  ✅ config.settings imported")
    
    # Check required settings
    required_attrs = [
        'vector_index_name',
        'vector_search_endpoint',
        'databricks_serving_endpoint',
        'facilities_table'
    ]
    
    for attr in required_attrs:
        if hasattr(settings, attr):
            value = getattr(settings, attr)
            print(f"  ✅ settings.{attr}: {value if not callable(value) else value()}")
        else:
            print(f"  ❌ settings.{attr} (missing)")
    
except Exception as e:
    print(f"  ❌ Import error: {e}")
    import traceback
    traceback.print_exc()
PYEOF

echo ""
echo "✅ Configuration test complete!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Install/update dependencies:"
echo "   cd /Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/backend"
echo "   pip install -r requirements.txt"
echo ""
echo "2. Create/update .env file with your credentials:"
echo "   DATABRICKS_HOST=https://dbc-5222fa5f-b762.cloud.databricks.com"
echo "   DATABRICKS_TOKEN=<your-token>"
echo "   DATABRICKS_HTTP_PATH=<your-warehouse-http-path>"
echo ""
echo "3. Start the backend server:"
echo "   python main.py"
echo ""
echo "4. The RAG endpoint will use Vector Search (no rate limits!):"
echo "   POST http://localhost:8000/api/v1/rag/query"
echo "   Body: {"question": "What hospitals are in Accra?"}"
echo ""
