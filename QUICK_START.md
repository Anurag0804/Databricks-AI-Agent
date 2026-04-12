# Quick Start Guide - Virtue Foundation Ghana Healthcare Intelligence

## Step-by-Step Setup (15 Minutes to Results)

### Step 1: Upload Dataset (2 min)
Upload your CSV to: `/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/data/`
File name: `Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv`

### Step 2: Create Unity Catalog (1 min)
Run in Databricks SQL:
- CREATE CATALOG IF NOT EXISTS virtue_foundation;
- CREATE SCHEMA IF NOT EXISTS virtue_foundation.ghana;

### Step 3: Bronze Ingestion (3 min)
Open `databricks_notebooks/01_bronze_ingestion.py` and run all cells.
Expected: ~978 rows in virtue_foundation.ghana.facilities_bronze

### Step 4: Silver Transformation (5 min)
Create DLT Pipeline with `databricks_notebooks/02_silver_transformation_dlt.py`

### Step 5: Gold Aggregations (2 min)  
Run `databricks_notebooks/03_gold_regional_summary.py`

### Step 6: Test Genie (2 min)
Create Genie space and ask: "Which regions have fewer than 5 facilities?"

## Success Criteria
After setup you should have:
- Bronze table with ~978 rows
- Silver table with cleaned data and completeness scores
- Gold table with regional aggregations and medical desert flags
- Genie answering natural language questions

See SETUP_GUIDE.md for detailed implementation instructions.
