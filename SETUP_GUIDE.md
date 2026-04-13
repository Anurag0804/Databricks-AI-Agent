# Ghana Healthcare Intelligence Platform - Setup Guide

## 🎯 Overview
The Vector Search integration is now complete. The RAG service no longer generates embeddings on-the-fly, eliminating rate limit issues.

## ✅ What Was Fixed
* **config.py**: Added `vector_index_name`, `databricks_serving_endpoint`, and `facilities_table` property
* **requirements.txt**: Already has `databricks-vectorsearch==0.40`
* **vector_search.py**: Uses `VectorSearchClient` to query pre-computed index
* **rag_service.py**: Calls Vector Search service instead of fetching all facilities

## 📁 Project Structure
```
Databricks-AI-Agent/
├── backend/
│   ├── main.py                    # FastAPI application entry point
│   ├── config.py                  # Configuration (UPDATED ✅)
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables (you need to create this)
│   ├── models/
│   │   ├── facilities.py
│   │   └── regional.py
│   ├── routes/
│   │   ├── facilities.py
│   │   ├── regional.py
│   │   └── rag.py                # RAG endpoints
│   └── services/
│       ├── databricks_client.py
│       ├── vector_search.py      # Vector Search client (UPDATED ✅)
│       └── rag_service.py        # RAG pipeline (UPDATED ✅)
└── frontend/
    └── (React app - already created)
```

## 🚀 Setup Instructions

### Step 1: Navigate to Backend Directory
```bash
cd /Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/backend
```

### Step 2: Create Environment File
Create a `.env` file with your Databricks credentials:

```bash
cat > .env << 'EOF'
# Databricks Connection
DATABRICKS_HOST=https://dbc-5222fa5f-b762.cloud.databricks.com
DATABRICKS_TOKEN=your-databricks-token-here
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id

# Optional: Override defaults
# ENVIRONMENT=development
# DEBUG=true
# LOG_LEVEL=DEBUG
EOF
```

**To get your credentials:**
* **DATABRICKS_HOST**: Your workspace URL (already filled in)
* **DATABRICKS_TOKEN**: User Settings → Developer → Access Tokens → Generate New Token
* **DATABRICKS_HTTP_PATH**: SQL Warehouses → Your Warehouse → Connection Details → HTTP Path

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

This installs:
* FastAPI, Uvicorn (web server)
* Pydantic (data validation)
* `databricks-sql-connector` (SQL queries)
* `databricks-vectorsearch` (Vector Search client) ← **Key for rate limit fix**
* OpenAI (LLM client for Databricks endpoints)

### Step 4: Start Backend Server
```bash
python main.py
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 5: Test RAG Endpoint
Open a new terminal and test:

```bash
curl -X POST http://localhost:8000/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What hospitals are in Accra?",
    "top_k": 5
  }'
```

Expected response:
```json
{
  "answer": "Based on the facilities data, here are hospitals in Accra: ...",
  "sources": [
    {
      "name": "Korle Bu Teaching Hospital",
      "location": "Accra, Greater Accra",
      "type": "Teaching Hospital",
      "similarity": 0.87
    }
  ],
  "retrieval_time": 0.45,
  "generation_time": 1.2,
  "num_sources": 5,
  "success": true
}
```

## 🧪 Testing Endpoints

### 1. Health Check
```bash
curl http://localhost:8000/api/v1/health
```

### 2. Get Facilities
```bash
curl http://localhost:8000/api/v1/facilities?limit=10
```

### 3. Regional Summary
```bash
curl http://localhost:8000/api/v1/regional/summary
```

### 4. RAG Query (Natural Language)
```bash
curl -X POST http://localhost:8000/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Which regions have the most government hospitals?"
  }'
```

## 🎨 Frontend Setup

If you haven't already started the frontend:

```bash
cd /Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/frontend
npm install
npm start
```

The frontend will connect to `http://localhost:8000` automatically.

## 🔧 How Vector Search Fixed Rate Limits

### Before (Problematic)
```python
# Old approach - generated embeddings on every query
all_facilities = db.fetch_all("SELECT * FROM facilities")  # 969 rows
embeddings = embedding_model.batch_embed(all_facilities)    # ~99 API calls
# ❌ Rate limit exceeded after retries
```

### After (Fixed)
```python
# New approach - queries pre-computed index
results = vector_search_client.similarity_search(
    query_text="hospitals in Accra",
    num_results=5
)
# ✅ Single API call, no rate limits!
```

## 📊 Vector Search Index Details
* **Index Name**: `virtue_foundation.ghana.facility_embeddings`
* **Endpoint**: `facility_search_endpoint`
* **Source Table**: `virtue_foundation.ghana.facility_documents`
* **Embedding Model**: `databricks-gte-large-en`
* **Status**: ✅ Online (created in notebook 04_Vector_Search_Setup)

## ⚙️ Configuration Details

Key settings in `config.py`:

```python
# Vector Search
vector_index_name = "virtue_foundation.ghana.facility_embeddings"  # Fully qualified
vector_search_endpoint = "facility_search_endpoint"

# LLM
databricks_serving_endpoint = "https://dbc-5222fa5f-b762.cloud.databricks.com/serving-endpoints"
llm_model_name = "databricks-meta-llama-3-3-70b-instruct"

# Data
facilities_table = "virtue_foundation.ghana.facilities_silver"  # Property method
```

## 🐛 Troubleshooting

### Issue: "No module named 'databricks-vectorsearch'"
**Solution**: Run `pip install databricks-vectorsearch==0.40`

### Issue: "Vector search index not found"
**Solution**: Run notebook `04_Vector_Search_Setup` to create the index

### Issue: "Authentication failed"
**Solution**: Check your `.env` file has correct `DATABRICKS_TOKEN`

### Issue: "No results from Vector Search"
**Solution**: Verify index exists:
```python
from databricks.vector_search.client import VectorSearchClient
vsc = VectorSearchClient(workspace_url=..., personal_access_token=...)
index = vsc.get_index(
    endpoint_name="facility_search_endpoint",
    index_name="virtue_foundation.ghana.facility_embeddings"
)
print(index.describe())
```

## 📝 API Documentation

Once the server is running, visit:
* **Swagger UI**: http://localhost:8000/docs
* **ReDoc**: http://localhost:8000/redoc

## 🎉 Success Checklist
- [x] ✅ Config updated with Vector Search settings
- [x] ✅ Vector Search index created (notebook 04)
- [x] ✅ Requirements include databricks-vectorsearch
- [x] ✅ Services use Vector Search (not on-the-fly embeddings)
- [ ] 🔲 Create `.env` with Databricks credentials
- [ ] 🔲 Install dependencies (`pip install -r requirements.txt`)
- [ ] 🔲 Start backend server (`python main.py`)
- [ ] 🔲 Test RAG endpoint (no rate limits!)
- [ ] 🔲 Start frontend (`npm start`)
- [ ] 🔲 Test full application

## 📚 Additional Resources
* [Databricks Vector Search Documentation](https://docs.databricks.com/en/generative-ai/vector-search.html)
* [FastAPI Documentation](https://fastapi.tiangolo.com/)
* [DLT Pipelines (Lakeflow)](https://docs.databricks.com/en/delta-live-tables/index.html)

---

**Questions?** The backend is ready to run. Just create the `.env` file and start the server!
