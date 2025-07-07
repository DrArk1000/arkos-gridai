from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from . import db, risk_engine, report
import uuid
from datetime import datetime

app = FastAPI()

class AnalyzeRequest(BaseModel):
    lat: float
    lon: float

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    score = risk_engine.get_tri_score(req.lat, req.lon)
    conn = db.get_connection()
    site_id = str(uuid.uuid4())
    now = datetime.utcnow()
    conn.execute(
        "INSERT INTO sites (id, lat, lon, connection, curtailment, delay, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (site_id, req.lat, req.lon, score, score, score, now)
    )
    pdf_bytes = report.make_pdf({"connection": score, "curtailment": score, "delay": score})
    return {"site_id": site_id, "score": score, "pdf_len": len(pdf_bytes)}
