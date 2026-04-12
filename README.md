# Virtue Foundation Ghana — Healthcare Intelligence Platform
### Databricks × Accenture Hackathon | IDP Agent for Healthcare Intelligence

## 🎯 Project Overview

An Intelligent Document Parsing (IDP) agentic system for analyzing ~978 healthcare facilities and NGOs across Ghana. The platform combines LLM-powered document enrichment, geospatial analysis, and natural language querying to identify healthcare gaps and medical deserts.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                          │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (Vercel)  │  Databricks Genie (Text2SQL)     │
└────────────────┬─────────────┴──────────────────┬───────────────┘
                 │                                 │
                 v                                 v
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Render)                      │
│  • Facilities API  • Desert Detection  • Anomaly Flags           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│                  DATABRICKS PLATFORM LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  Unity Catalog: virtue_foundation.ghana.*                        │
│  • facilities_bronze (raw CSV)                                   │
│  • facilities_silver (cleaned + enriched)                        │
│  • regional_summary (Gold aggregations)                          │
│  • desert_assessments (ML-scored regions)                        │
│  • facilities_anomalies (quality flags)                          │
├─────────────────────────────────────────────────────────────────┤
│  AGENTS (LangGraph + Databricks Model Serving)                   │
│  • IDP Enrichment Agent → Extract procedure/equipment/capability │
│  • Medical Desert Agent → Score regional healthcare gaps         │
│  • Anomaly Detection Agent → Flag data quality issues            │
│  • RAG Query Agent → Answer NL questions with citations          │
├─────────────────────────────────────────────────────────────────┤
│  Vector Search Index: facility_embeddings (gte-large-en)         │
│  MLflow: Experiment tracking + Model Registry                    │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Dataset Schema (41 Columns)

**Structured Fields:**
* `name`, `pk_unique_id`, `unique_id`
* `facilityTypeId` (hospital/clinic/pharmacy/dentist/doctor)
* `operatorTypeId` (public/private)
* `address_*` (line1-3, city, stateOrRegion, country)
* `numberDoctors`, `capacity`, `yearEstablished`
* Contact: `phone_numbers`, `email`, `websites`, `officialWebsite`
* Social: `facebookLink`, `twitterLink`, `linkedinLink`, `instagramLink`

**Semi-Structured (JSON Arrays):**
* `specialties`, `procedure`, `equipment`, `capability`
* `affiliationTypeIds`, `countries`

**Free-Text Fields (IDP Targets):**
* `description`, `missionStatement`, `organizationDescription`

## 📂 Project Structure

```
Databricks-AI-Agent/
├── README.md                           # This file
├── data/                               # 📍 UPLOAD CSV HERE
│   └── Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv
├── databricks_notebooks/               # Databricks notebooks
│   ├── 01_bronze_ingestion.py
│   ├── 02_silver_transformation_dlt.py
│   ├── 03_gold_regional_summary.py
│   └── 04_vector_search_setup.py
├── agents/                             # LangGraph agent implementations
│   ├── idp_enrichment_agent.py
│   ├── medical_desert_agent.py
│   ├── anomaly_detection_agent.py
│   └── rag_query_agent.py
├── backend/                            # FastAPI backend (Render)
│   ├── main.py
│   ├── requirements.txt
│   ├── render.yaml
│   ├── routers/
│   │   ├── facilities.py
│   │   ├── genie.py
│   │   ├── desert.py
│   │   └── anomalies.py
│   └── services/
│       ├── databricks_client.py
│       └── rag_client.py
├── frontend/                           # Next.js frontend (Vercel)
│   ├── package.json
│   ├── next.config.js
│   ├── app/
│   │   ├── page.tsx                   # Dashboard
│   │   ├── map/page.tsx               # Mapbox map
│   │   ├── facilities/page.tsx
│   │   ├── ask/page.tsx               # RAG chat
│   │   └── deserts/page.tsx
│   └── components/
│       ├── MedicalDesertMap.tsx
│       ├── FacilityCard.tsx
│       └── ChatInterface.tsx
├── mlflow_utils/                       # MLflow tracking utilities
│   └── mlflow_utils.py
└── docs/                               # Documentation
    ├── GENIE_QUERIES.md               # 20 sample Genie queries
    ├── DEPLOYMENT.md                  # Deployment checklist
    └── DEMO_SCRIPT.md                 # 5-minute demo flow
```

## 🚀 Quick Start

### 1. Upload Dataset

**📍 UPLOAD LOCATION:**
```
/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/data/
```

Upload your CSV file: `Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv`

Alternatively, use Databricks Volumes (recommended for production):
```python
# Create a Volume mount
%sql
CREATE VOLUME IF NOT EXISTS virtue_foundation.ghana.raw_data;

# Copy file to Volume
dbutils.fs.cp(
    "file:/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/data/Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv",
    "/Volumes/virtue_foundation/ghana/raw_data/Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv"
)
```

### 2. Set Up Unity Catalog

```sql
-- Create catalog and schema
CREATE CATALOG IF NOT EXISTS virtue_foundation;
CREATE SCHEMA IF NOT EXISTS virtue_foundation.ghana;
USE CATALOG virtue_foundation;
USE SCHEMA ghana;
```

### 3. Run Data Pipelines (in order)

1. **Bronze Ingestion:** `databricks_notebooks/01_bronze_ingestion.py`
2. **Silver DLT Pipeline:** `databricks_notebooks/02_silver_transformation_dlt.py`
3. **Gold Aggregations:** `databricks_notebooks/03_gold_regional_summary.py`
4. **Vector Search Setup:** `databricks_notebooks/04_vector_search_setup.py`

### 4. Deploy Agents

Run each agent notebook:
* `agents/idp_enrichment_agent.py` — Enriches missing fields
* `agents/medical_desert_agent.py` — Scores regions
* `agents/anomaly_detection_agent.py` — Flags data quality issues
* `agents/rag_query_agent.py` — Registers RAG model in MLflow

### 5. Configure Genie Space

1. Go to Databricks Genie
2. Create new Space: "Virtue Foundation Ghana — Healthcare Intelligence"
3. Add tables:
   * `virtue_foundation.ghana.facilities_silver`
   * `virtue_foundation.ghana.regional_summary`
   * `virtue_foundation.ghana.desert_assessments`
4. Import sample queries from `docs/GENIE_QUERIES.md`

### 6. Deploy Backend (Render)

```bash
cd backend
# Set environment variables in Render dashboard:
# DATABRICKS_HOST, DATABRICKS_TOKEN, DATABRICKS_WAREHOUSE_ID
git push render main
```

### 7. Deploy Frontend (Vercel)

```bash
cd frontend
npm install
# Set NEXT_PUBLIC_API_URL in Vercel dashboard
vercel --prod
```

## 🔑 Environment Variables

### Databricks
```bash
DATABRICKS_HOST=https://your-workspace.databricks.com
DATABRICKS_TOKEN=dapi...
DATABRICKS_WAREHOUSE_ID=abc123def456
```

### Backend (Render)
```bash
DATABRICKS_HOST=...
DATABRICKS_TOKEN=...
DATABRICKS_WAREHOUSE_ID=...
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-app.onrender.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
```

## 📊 Key Metrics & Insights

### Medical Desert Detection Criteria
A region is flagged as a medical desert if:
* Total facilities < 3, OR
* Zero hospitals AND < 2 clinics, OR
* Zero doctors AND zero bed capacity

### Anomaly Detection Rules
1. High capacity (>50 beds) but no doctors
2. Hospital with no procedures/capabilities listed
3. Surgery capability but no surgeon specialty
4. Duplicate name + city combinations
5. Implausible values (capacity > 2000 or < 0)
6. Missing all contact information
7. Missing location data

## 🎬 Demo Flow (5 Minutes)

1. **Map View** → Show Ghana regions colored by desert severity
2. **Click Desert Region** → Explain missing services
3. **Ask Interface** → "Which regions have no hospitals?"
4. **Genie Query** → Run medical desert scoring query
5. **MLflow Trace** → Show enrichment agent execution
6. **Anomalies Table** → Display flagged suspicious records
7. **Impact Statement** → "Reduces insight time from weeks to seconds"

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Data Storage | Delta Lake + Unity Catalog |
| Pipelines | Lakeflow Spark Declarative Pipelines |
| Agent Framework | LangGraph / LlamaIndex |
| LLM | Databricks Model Serving (DBRX/Claude/GPT-4o) |
| Text2SQL | Databricks Genie |
| Vector Search | Databricks Vector Search (gte-large-en) |
| Experiment Tracking | MLflow |
| Backend API | FastAPI (Python) |
| Frontend | Next.js 14 + Tailwind CSS |
| Maps | Mapbox GL JS |
| Deployment | Render (backend) + Vercel (frontend) |

## 📈 MLflow Experiments

All agent runs are tracked in MLflow:
* `virtue_foundation_enrichment` — IDP field extraction metrics
* `virtue_foundation_desert_detection` — Regional scores
* `virtue_foundation_anomaly_detection` — Quality flags count
* `virtue_foundation_rag` — RAG query performance

## 🧪 Testing the System

### Test Bronze Ingestion
```python
spark.table("virtue_foundation.ghana.facilities_bronze").count()
# Expected: ~978 rows
```

### Test Silver Transformation
```python
df = spark.table("virtue_foundation.ghana.facilities_silver")
display(df.select("name", "completeness_score", "specialty_count").limit(10))
```

### Test Medical Desert Detection
```python
spark.table("virtue_foundation.ghana.regional_summary") \
    .filter("medical_desert_flag = true") \
    .select("address_stateOrRegion", "total_facilities", "total_hospitals")
```

### Test RAG Endpoint
```bash
curl -X POST https://your-backend.onrender.com/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Which facilities offer pediatric care in Accra?"}'
```

## 🐛 Troubleshooting

### CSV Upload Issues
If CSV doesn't load, check:
* File encoding is UTF-8
* JSON arrays are properly quoted
* No trailing commas in rows

### Vector Search Index Fails
```python
# Check if embeddings endpoint is available
from databricks.vector_search.client import VectorSearchClient
client = VectorSearchClient()
client.list_endpoints()
```

### Genie Returns Empty Results
* Verify tables are registered in the Genie space
* Check Unity Catalog permissions
* Run `DESCRIBE EXTENDED virtue_foundation.ghana.facilities_silver`

## 📚 Additional Resources

* [Databricks Genie Documentation](https://docs.databricks.com/genie/)
* [Vector Search Guide](https://docs.databricks.com/vector-search/)
* [LangGraph Tutorial](https://python.langchain.com/docs/langgraph)
* [Lakeflow Pipelines](https://docs.databricks.com/delta-live-tables/)

## 👥 Team

Built for the Databricks × Accenture Hackathon — Virtue Foundation Ghana Track

## 📄 License

See LICENSE file

---

**Status:** 🚧 In Development | **Version:** 0.1.0 | **Last Updated:** April 2026
