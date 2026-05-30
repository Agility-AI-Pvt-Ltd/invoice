import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Invoice Anomaly Detection Analytics")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL)

class AnomalyRequest(BaseModel):
    organization_id: str
    invoice_id: str
    amount: float

@app.get("/")
def read_root():
    return {"message": "Invoice Analytics Service"}

@app.post("/api/analyze")
def analyze_invoice(req: AnomalyRequest):
    # Fetch historical invoices for the organization
    query = f"""
        SELECT id, total 
        FROM "Invoice" 
        WHERE "organizationId" = '{req.organization_id}'
        AND status != 'CANCELLED'
    """
    
    try:
        df = pd.read_sql(query, engine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if df.empty or len(df) < 5:
        # Not enough data to establish a baseline
        return {
            "is_anomaly": False,
            "reason": "Insufficient historical data for anomaly detection.",
            "threshold": None,
            "score": 0.0
        }

    # Convert totals to numeric (handling decimals)
    df['total'] = pd.to_numeric(df['total'], errors='coerce')
    df = df.dropna(subset=['total'])

    mean_amount = df['total'].mean()
    std_amount = df['total'].std()

    # Dynamic threshold: Mean + 2 * Standard Deviation
    threshold = mean_amount + (2 * std_amount) if std_amount > 0 else mean_amount * 2

    # Check if current invoice amount is an anomaly
    is_anomaly = req.amount > threshold

    reason = None
    score = 0.0

    if is_anomaly:
        reason = f"Invoice amount (₹{req.amount:,.2f}) significantly exceeds typical historical spending (average: ₹{mean_amount:,.2f}, threshold: ₹{threshold:,.2f})."
        score = (req.amount - mean_amount) / std_amount if std_amount > 0 else 1.0

    return {
        "is_anomaly": is_anomaly,
        "reason": reason,
        "threshold": threshold,
        "score": score,
        "metrics": {
            "average": mean_amount,
            "std_dev": std_amount,
            "count": len(df)
        }
    }

@app.get("/api/analytics/{organization_id}")
def get_analytics(organization_id: str):
    query = f"""
        SELECT "issueDate", total 
        FROM "Invoice" 
        WHERE "organizationId" = '{organization_id}'
        AND status != 'CANCELLED'
        ORDER BY "issueDate" ASC
    """
    try:
        df = pd.read_sql(query, engine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if df.empty:
        return {"trends": [], "range": {"min": 0, "max": 0, "avg": 0}}

    df['total'] = pd.to_numeric(df['total'], errors='coerce')
    df['issueDate'] = pd.to_datetime(df['issueDate'])
    
    # Calculate monthly trends
    monthly_trends = df.groupby(df['issueDate'].dt.to_period('M'))['total'].sum().reset_index()
    monthly_trends['issueDate'] = monthly_trends['issueDate'].dt.strftime('%Y-%m')
    
    mean_amount = df['total'].mean()
    std_amount = df['total'].std()
    
    return {
        "trends": monthly_trends.to_dict(orient="records"),
        "range": {
            "min": max(0, mean_amount - std_amount),
            "max": mean_amount + (2 * std_amount) if std_amount > 0 else mean_amount * 2,
            "avg": mean_amount
        }
    }
