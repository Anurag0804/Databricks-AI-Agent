# Dataset Upload Instructions

## 📍 CSV Upload Location

**Upload your CSV file here:**
```
/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/data/
```

**Expected filename:**
```
Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv
```

## Upload Methods

### Method 1: Databricks Workspace UI (Recommended for Small Files)

1. In Databricks workspace, navigate to:
   * **Workspace** → **Users** → **anuragrc27@gmail.com** → **Databricks-AI-Agent** → **data**

2. Click **"Create" → "Upload files"**

3. Select your CSV file: `Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv`

4. Upload completes → File appears in the data/ folder

### Method 2: Databricks CLI (Recommended for Large Files)

```bash
# Install Databricks CLI
pip install databricks-cli

# Configure authentication
databricks configure --token

# Upload file
databricks workspace import \
  /Users/anuragrc27@gmail.com/Databricks-AI-Agent/data/Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv \
  --file Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv \
  --format AUTO
```

### Method 3: Using Databricks Volumes (Production Recommended)

```python
# Create Unity Catalog Volume
%sql
CREATE VOLUME IF NOT EXISTS virtue_foundation.ghana.raw_data;

# Upload via UI to Volume path:
# /Volumes/virtue_foundation/ghana/raw_data/

# Or copy from workspace:
dbutils.fs.cp(
    "file:/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/data/Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv",
    "/Volumes/virtue_foundation/ghana/raw_data/Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv"
)
```

## Verify Upload

Run this in a Databricks notebook to verify the file is accessible:

```python
# Check if file exists
file_path = "/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/data/Virtue_Foundation_Ghana_v0_3_-_Sheet1.csv"

try:
    df = spark.read.format("csv") \
        .option("header", "true") \
        .option("inferSchema", "true") \
        .load(file_path)
    
    print(f"✅ File found!")
    print(f"Rows: {df.count():,}")
    print(f"Columns: {len(df.columns)}")
    display(df.limit(5))
except Exception as e:
    print(f"❌ File not found or error: {e}")
```

## Expected Dataset Schema (41 Columns)

The CSV should contain these columns:
* `source_url`, `name`, `pk_unique_id`, `unique_id`
* `specialties` (JSON array)
* `procedure` (JSON array)
* `equipment` (JSON array)
* `capability` (JSON array)
* `facilityTypeId`, `operatorTypeId`
* `phone_numbers` (JSON array)
* `email`, `websites` (JSON array), `officialWebsite`
* `address_*` (line1, line2, line3, city, stateOrRegion, country, countryCode, zipOrPostcode)
* `yearEstablished`, `acceptsVolunteers`
* Social media links
* `description`, `missionStatement`, `organizationDescription`
* `numberDoctors`, `capacity`, `area`

## Data Quality Notes

* **Expected row count:** ~978 facilities
* **JSON arrays:** Some columns contain JSON-stringified arrays like `["value1", "value2"]`
* **Null values:** Mix of empty strings `""`, empty arrays `[]`, and actual nulls
* **Special characters:** File should be UTF-8 encoded

## Troubleshooting

### File Won't Upload
* Check file size (max 100MB via UI, use CLI for larger)
* Ensure UTF-8 encoding
* Check file permissions

### Can't Find Uploaded File
```python
# List all files in data directory
display(dbutils.fs.ls("file:/Workspace/Users/anuragrc27@gmail.com/Databricks-AI-Agent/data/"))
```

### CSV Parsing Errors
* Verify CSV has headers in first row
* Check for unescaped quotes in data
* Ensure commas in data are properly quoted

## Next Steps

Once uploaded, proceed to:
1. **Run Bronze Ingestion:** `databricks_notebooks/01_bronze_ingestion.py`
2. Follow the setup guide in `SETUP_GUIDE.md`

---

**Questions?** Check the main [README.md](../README.md) or [SETUP_GUIDE.md](../SETUP_GUIDE.md)
