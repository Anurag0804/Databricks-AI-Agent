"""
MLflow Utilities for Virtue Foundation Ghana Healthcare Intelligence Platform

Shared utilities for experiment tracking across all agent pipelines:
- IDP Enrichment Agent
- Medical Desert Detection Agent
- Anomaly Detection Agent
- RAG Query Agent

Usage:
    from mlflow_utils import start_agent_run, log_enrichment_metrics
    
    with start_agent_run("idp_enrichment", {"batch_size": 50}) as run:
        # Agent logic here
        log_enrichment_metrics(rows_processed=50, rows_enriched=45, rows_failed=5)
"""

import mlflow
from datetime import datetime
from typing import Dict, Any, Optional
import json


def start_agent_run(agent_name: str, params: Dict[str, Any]) -> mlflow.ActiveRun:
    """
    Start MLflow run for an agent with automatic experiment creation.
    
    Args:
        agent_name: Name of the agent (e.g., 'idp_enrichment', 'medical_desert')
        params: Dictionary of parameters to log
        
    Returns:
        MLflow ActiveRun context manager
        
    Example:
        with start_agent_run("idp_enrichment", {"model": "dbrx", "batch_size": 50}):
            # Agent code
            mlflow.log_metric("accuracy", 0.95)
    """
    # Set experiment (creates if doesn't exist)
    experiment_name = f"/Users/anuragrc27@gmail.com/virtue_foundation_{agent_name}"
    mlflow.set_experiment(experiment_name)
    
    # Start run with timestamp
    run_name = f"{agent_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    run = mlflow.start_run(run_name=run_name)
    
    # Log all parameters
    mlflow.log_params(params)
    
    # Log agent metadata
    mlflow.set_tag("agent_name", agent_name)
    mlflow.set_tag("project", "virtue_foundation_ghana")
    mlflow.set_tag("environment", "development")
    
    return run


def log_enrichment_metrics(
    rows_processed: int,
    rows_enriched: int, 
    rows_failed: int,
    model_name: str = None
):
    """
    Log metrics for IDP enrichment agent runs.
    
    Args:
        rows_processed: Total rows attempted
        rows_enriched: Successfully enriched rows
        rows_failed: Failed rows
        model_name: Optional LLM model name
    """
    mlflow.log_metrics({
        "rows_processed": rows_processed,
        "rows_enriched": rows_enriched,
        "rows_failed": rows_failed,
        "enrichment_rate": rows_enriched / max(rows_processed, 1),
        "failure_rate": rows_failed / max(rows_processed, 1)
    })
    
    if model_name:
        mlflow.log_param("model_name", model_name)
    
    # Log summary as artifact
    summary = {
        "total_processed": rows_processed,
        "successful": rows_enriched,
        "failed": rows_failed,
        "success_rate": f"{(rows_enriched/max(rows_processed,1))*100:.2f}%",
        "model": model_name,
        "timestamp": datetime.now().isoformat()
    }
    
    mlflow.log_dict(summary, "enrichment_summary.json")


def log_desert_assessment(
    region: str,
    desert_score: float,
    facility_count: int,
    recommendations: list = None
):
    """
    Log metrics for medical desert detection agent.
    
    Args:
        region: Region name
        desert_score: Desert severity score (0.0-1.0)
        facility_count: Number of facilities in region
        recommendations: Optional list of recommendations
    """
    # Log per-region metrics
    mlflow.log_metrics({
        f"{region}_desert_score": desert_score,
        f"{region}_facility_count": facility_count
    })
    
    # Log assessment details
    assessment = {
        "region": region,
        "desert_score": desert_score,
        "severity": "critical" if desert_score > 0.7 else "moderate" if desert_score > 0.4 else "low",
        "facility_count": facility_count,
        "recommendations": recommendations or [],
        "assessed_at": datetime.now().isoformat()
    }
    
    mlflow.log_dict(assessment, f"desert_assessment_{region}.json")


def log_anomaly_summary(anomaly_counts: Dict[str, int]):
    """
    Log summary of anomaly detection results.
    
    Args:
        anomaly_counts: Dictionary mapping anomaly type to count
            Example: {
                "high_capacity_no_doctors": 15,
                "hospital_no_procedures": 8,
                ...
            }
    """
    # Log each anomaly type count
    for anomaly_type, count in anomaly_counts.items():
        mlflow.log_metric(f"anomaly_{anomaly_type}", count)
    
    # Calculate totals
    total_anomalies = sum(anomaly_counts.values())
    anomaly_types_found = len([c for c in anomaly_counts.values() if c > 0])
    
    mlflow.log_metrics({
        "total_anomalies": total_anomalies,
        "anomaly_types_found": anomaly_types_found
    })
    
    # Log detailed summary
    summary = {
        "total_anomalies_detected": total_anomalies,
        "unique_anomaly_types": anomaly_types_found,
        "breakdown": anomaly_counts,
        "detected_at": datetime.now().isoformat()
    }
    
    mlflow.log_dict(summary, "anomaly_summary.json")


def log_rag_query(
    question: str,
    answer: str,
    sources: list,
    retrieval_time: float,
    generation_time: float,
    num_sources: int
):
    """
    Log RAG query performance metrics.
    
    Args:
        question: User question
        answer: Generated answer
        sources: List of source facility names
        retrieval_time: Vector search time (seconds)
        generation_time: LLM generation time (seconds)
        num_sources: Number of retrieved documents
    """
    mlflow.log_metrics({
        "retrieval_time_seconds": retrieval_time,
        "generation_time_seconds": generation_time,
        "total_time_seconds": retrieval_time + generation_time,
        "num_sources_retrieved": num_sources
    })
    
    # Log query/answer pair
    qa_pair = {
        "question": question,
        "answer": answer,
        "sources": sources,
        "num_sources": num_sources,
        "retrieval_time": retrieval_time,
        "generation_time": generation_time,
        "timestamp": datetime.now().isoformat()
    }
    
    mlflow.log_dict(qa_pair, f"rag_query_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")


def log_batch_processing(
    batch_id: str,
    batch_size: int,
    processing_time: float,
    success_count: int,
    error_count: int,
    errors: list = None
):
    """
    Log batch processing metrics for any agent.
    
    Args:
        batch_id: Unique batch identifier
        batch_size: Number of items in batch
        processing_time: Time taken (seconds)
        success_count: Successfully processed items
        error_count: Failed items
        errors: Optional list of error messages
    """
    mlflow.log_metrics({
        f"batch_{batch_id}_size": batch_size,
        f"batch_{batch_id}_processing_time": processing_time,
        f"batch_{batch_id}_success": success_count,
        f"batch_{batch_id}_errors": error_count,
        f"batch_{batch_id}_throughput": batch_size / max(processing_time, 0.001)
    })
    
    if errors:
        error_summary = {
            "batch_id": batch_id,
            "total_errors": error_count,
            "error_rate": error_count / max(batch_size, 1),
            "errors": errors[:10],  # Log first 10 errors
            "timestamp": datetime.now().isoformat()
        }
        mlflow.log_dict(error_summary, f"batch_{batch_id}_errors.json")


def create_tracing_span(
    span_name: str,
    inputs: Dict[str, Any],
    outputs: Dict[str, Any],
    data_used: list = None
):
    """
    Create MLflow tracing span for step-level observability.
    
    Use for LangGraph nodes to track which data influenced each step.
    
    Args:
        span_name: Name of the span (e.g., "load_batch", "llm_call")
        inputs: Input data for this step
        outputs: Output data from this step  
        data_used: Optional list of data identifiers used (e.g., facility IDs)
        
    Example:
        with mlflow.start_span(name="extract_facts") as span:
            span.set_inputs({"facility_id": "123", "description": "..."})
            result = llm_extract(description)
            span.set_outputs({"procedures": result.procedures, 
                             "data_used": ["facility_123"]})
    """
    with mlflow.start_span(name=span_name) as span:
        span.set_inputs(inputs)
        span.set_outputs({
            **outputs,
            "data_used": data_used or []
        })
        return span


def log_model_artifact(
    model: Any,
    model_name: str,
    signature: Any = None,
    input_example: Any = None
):
    """
    Log a model to MLflow with metadata.
    
    Args:
        model: Model object (sklearn, PyFunc, etc.)
        model_name: Name for the registered model
        signature: MLflow ModelSignature
        input_example: Example input for model
    """
    mlflow.sklearn.log_model(
        sk_model=model,
        artifact_path=model_name,
        signature=signature,
        input_example=input_example,
        registered_model_name=f"virtue_foundation_{model_name}"
    )
    
    print(f"✅ Model '{model_name}' logged to MLflow")


# Helper for end-of-run summary
def log_agent_summary(
    agent_name: str,
    start_time: datetime,
    end_time: datetime,
    status: str,
    summary_metrics: Dict[str, Any]
):
    """
    Log final summary at the end of an agent run.
    
    Args:
        agent_name: Name of agent
        start_time: Run start time
        end_time: Run end time
        status: "success" | "partial_success" | "failed"
        summary_metrics: Key metrics to highlight
    """
    duration = (end_time - start_time).total_seconds()
    
    mlflow.log_metrics({
        "run_duration_seconds": duration,
        "run_duration_minutes": duration / 60
    })
    
    mlflow.set_tag("run_status", status)
    
    summary = {
        "agent": agent_name,
        "status": status,
        "started_at": start_time.isoformat(),
        "ended_at": end_time.isoformat(),
        "duration_seconds": duration,
        "metrics": summary_metrics
    }
    
    mlflow.log_dict(summary, "run_summary.json")
    
    print(f"\n{'='*80}")
    print(f"AGENT RUN SUMMARY: {agent_name}")
    print(f"{'='*80}")
    print(f"Status: {status}")
    print(f"Duration: {duration:.2f}s ({duration/60:.2f}m)")
    for key, value in summary_metrics.items():
        print(f"{key}: {value}")
    print(f"{'='*80}\n")


# Example usage
if __name__ == "__main__":
    # Example: IDP Enrichment Agent
    with start_agent_run("idp_enrichment", {"model": "dbrx", "batch_size": 50}):
        # Simulate enrichment
        log_enrichment_metrics(
            rows_processed=50,
            rows_enriched=45,
            rows_failed=5,
            model_name="databricks-dbrx-instruct"
        )
        
        log_agent_summary(
            agent_name="idp_enrichment",
            start_time=datetime.now(),
            end_time=datetime.now(),
            status="success",
            summary_metrics={"enrichment_rate": 0.9, "total_processed": 50}
        )
