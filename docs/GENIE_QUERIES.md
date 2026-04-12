# Genie Text2SQL Sample Queries
## Virtue Foundation Ghana Healthcare Intelligence

### Setup Instructions

1. **Create Genie Space:**
   * Go to Databricks workspace → **Genie**
   * Click **Create Space**
   * Name: "Virtue Foundation Ghana — Healthcare Intelligence"
   * Description: "Natural language querying over ~978 healthcare facilities in Ghana"

2. **Add Tables:**
   ```
   virtue_foundation.ghana.facilities_silver
   virtue_foundation.ghana.regional_summary
   virtue_foundation.ghana.desert_assessments (after running agents)
   virtue_foundation.ghana.facility_documents (optional)
   ```

3. **Add Sample Questions as Trusted Assets** (copy the queries below)

---

## Medical Desert Queries

### Query 1: Identify All Medical Deserts
```
Show me all regions in Ghana that have fewer than 3 healthcare facilities total,
along with their total bed capacity and number of doctors.
```

### Query 2: Regions with No Hospitals
```
Which regions have zero hospitals AND zero clinics?
Show region name, total facility count, and whether any NGOs are present.
```

### Query 3: Cities Lacking Emergency Care
```
Find all cities where there is no facility with emergency care capability.
Group by region and count the cities affected per region.
```

### Query 4: Medical Desert Severity Ranking
```
Rank Ghana's regions by their "medical desert severity":
- No hospital = +3 points
- No doctors recorded = +3 points
- Fewer than 2 clinics = +2 points
- No NGOs = +1 point
Show region, total score, and the individual penalty components.
```

### Query 5: Incomplete Facility Records
```
List every facility that has a completeness_score below 0.3
(meaning less than 30% of key fields are filled).
Include name, city, region, facility type, and which key fields are missing.
```

---

## Specialty & Capability Gap Analysis

### Query 6: Specialty Gaps Across Regions
```
Which medical specialties are present in Greater Accra but completely absent
in Northern Region, Upper East, and Upper West combined?
```

### Query 7: Specialty Diversity by Region
```
Show regions sorted by the number of distinct medical specialties available.
Include a column showing whether pediatrics, emergency medicine, and
gynecology are each present (yes/no) in that region.
```

### Query 8: Surgery Capability Mismatch
```
Find facilities that mention 'surgery' or 'surgical' in their capability or
procedure fields but have no surgeon specialty listed.
These are potential data anomalies.
```

### Query 9: Essential Services Coverage Matrix
```
How many facilities in each region offer each of the following:
- Emergency care
- Maternity / gynecology services
- Pediatric care
- HIV/AIDS services
Show the result as a pivot-style table by region.
```

### Query 10: Capacity Without Staff
```
Which facilities list capacity (beds) > 50 but have numberDoctors = 0 or NULL?
This may indicate a data quality issue or a staffing crisis.
```

---

## NGO Intelligence Queries

### Query 11: All NGOs with Mission
```
List all NGOs in the dataset with their mission statement, operating regions,
and whether they accept volunteers.
```

### Query 12: NGOs in Medical Deserts
```
Which NGOs cover regions that have zero public hospitals?
Show NGO name, region covered, and the number of facilities in that region.
```

### Query 13: NGO Clinical Capabilities
```
For regions that have medical_desert_flag = true,
show the NGOs present there and whether they have clinical capabilities
(i.e., procedure or capability arrays are non-empty).
```

### Query 14: NGOs Without Contact Info
```
Which NGOs have no contact information at all
(no phone, no email, no website)?
List them with their city and region.
```

---

## Infrastructure & Resource Queries

### Query 15: Facility Type Distribution
```
Show the distribution of facility types (hospital, clinic, pharmacy, dentist, doctor)
across all regions. Format as a count per type per region.
```

### Query 16: Bed Capacity by Region
```
What is the total bed capacity across all facilities by region?
Highlight regions where total capacity is below 100 beds.
```

### Query 17: Top Facilities by Doctors
```
List the top 10 facilities by number of doctors, with their region,
facility type, and whether they have recorded bed capacity.
```

### Query 18: Facility Age Distribution
```
How many facilities were established before year 2000 vs. after 2000?
Break this down by region and facility type.
```

### Query 19: Private Hospitals with Missing Data
```
Show all private hospitals in Ghana that have no listed equipment or procedures.
These may be high-priority targets for data enrichment.
```

### Query 20: Unreachable Public Hospitals
```
Which public hospitals have no phone number and no email?
These are unreachable facilities — list them by region sorted alphabetically.
```

---

## Advanced Queries (After Running Agents)

### Query 21: Anomaly Summary
```
SELECT anomaly_type, COUNT(*) as occurrences
FROM virtue_foundation.ghana.facilities_anomalies
WHERE total_anomaly_flags > 0
GROUP BY anomaly_type
ORDER BY occurrences DESC;
```

### Query 22: Desert Assessment with Recommendations
```
SELECT 
    region,
    desert_score,
    reasoning,
    recommendations
FROM virtue_foundation.ghana.desert_assessments
WHERE desert_score > 0.5
ORDER BY desert_score DESC;
```

### Query 23: Enrichment Success Rate
```
SELECT 
    COUNT(*) as total_facilities,
    SUM(CASE WHEN procedure_enriched IS NOT NULL THEN 1 ELSE 0 END) as enriched_procedures,
    SUM(CASE WHEN equipment_enriched IS NOT NULL THEN 1 ELSE 0 END) as enriched_equipment,
    (SUM(CASE WHEN procedure_enriched IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as enrichment_rate
FROM virtue_foundation.ghana.facilities_enriched;
```

---

## Tips for Using Genie

1. **Be specific:** Include column names and table names when possible
2. **Use natural language:** Genie understands conversational queries
3. **Iterate:** Refine your question based on results
4. **Save useful queries:** Mark frequently-used queries as "Trusted Assets"
5. **Check generated SQL:** Review and optimize the SQL Genie creates
6. **Use filters:** Add WHERE clauses to narrow results
7. **Aggregate:** Use SUM, AVG, COUNT for summaries
8. **Join tables:** Genie can join multiple tables automatically

---

## Common Genie Phrases That Work Well

* "Show me..."
* "List all..."
* "How many..."
* "Which regions..."
* "What is the total..."
* "Find facilities where..."
* "Compare regions by..."
* "Group by... and count..."
* "Sort by... descending"
* "Filter to only..."

---

## Example Multi-Table Query

```
Show me facilities in medical desert regions (medical_desert_flag = true)
that have completeness_score above 0.7,
along with the region's total facility count and desert severity score.
```

Genie will automatically:
1. Join `facilities_silver` with `regional_summary`
2. Apply filters
3. Return relevant columns

---

**📊 After running these queries, export results for:**
* Dashboard visualizations
* Executive reports
* Intervention planning
* Funding proposals
