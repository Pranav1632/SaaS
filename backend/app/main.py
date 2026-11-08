"""
SaansAI FastAPI Main Application.
Unified REST API & SSE Streaming Service for PCMC / Pune Region.
"""
import asyncio
import time
import json
from fastapi import FastAPI, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List

from .sources.weather import fetch_live_weather, WeatherData
from .sources.stations import fetch_station_readings, StationReading
from .sources.traffic import get_current_traffic_hotspots, TrafficHotspot
from .sources.crowd_reports import get_active_crowd_reports, add_crowd_report, CrowdReport
from .concentration_model import estimate_concentration_at_point, ConcentrationResult
from .dose_response import compute_personal_dose, DoseCalculation
from .explain import generate_exposure_explanation
from .forecast import get_short_horizon_forecast, ForecastResponse
from .routing import evaluate_route_options, RouteComparisonResponse
from .routine_parser import parse_user_routine, RoutineParseResponse
from .sentinel import trigger_t20_sentinel_alert, SentinelAlertResponse
from .campus import get_campus_duty_of_care_status, CampusStatusResponse

app = FastAPI(
    title="SaansAI Backend API",
    description="Hyperlocal Exposure Intelligence for Pune & PCCOE (PS-03)",
    version="2.0.0"
)

# Enable CORS for Next.js and mobile web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "SaansAI API v2",
        "region": "Pune / PCCOE Campus & PCMC",
        "status": "online",
        "timestamp": time.time()
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "uptime_ts": time.time()}

@app.get("/api/weather", response_model=WeatherData)
async def get_weather(lat: float = 18.6279, lon: float = 73.7636):
    return await fetch_live_weather(lat, lon)

@app.get("/api/stations", response_model=List[StationReading])
async def get_stations():
    return await fetch_station_readings()

@app.get("/api/traffic", response_model=List[TrafficHotspot])
def get_traffic():
    return get_current_traffic_hotspots()

@app.get("/api/crowd-reports", response_model=List[CrowdReport])
def get_reports():
    return get_active_crowd_reports()

class NewReportRequest(BaseModel):
    report_type: str
    description: str
    lat: float
    lon: float
    reported_by: Optional[str] = "Student Commuter"

@app.post("/api/crowd-reports", response_model=CrowdReport)
def submit_report(req: NewReportRequest):
    return add_crowd_report(
        report_type=req.report_type,
        description=req.description,
        lat=req.lat,
        lon=req.lon,
        reported_by=req.reported_by or "Student Commuter"
    )

@app.get("/api/concentration", response_model=ConcentrationResult)
async def get_concentration(lat: float = 18.6517, lon: float = 73.7615):
    return await estimate_concentration_at_point(lat, lon)

class PointDoseRequest(BaseModel):
    lat: float = 18.6517
    lon: float = 73.7615
    activity: str = "walking"
    duration_minutes: int = 30
    microenvironment: str = "open_air"
    mask: str = "none"
    vulnerability_group: str = "general"

@app.post("/api/exposure/point", response_model=DoseCalculation)
async def calculate_point_dose(req: PointDoseRequest):
    conc = await estimate_concentration_at_point(req.lat, req.lon)
    return compute_personal_dose(
        pm25=conc.pm25,
        activity=req.activity,
        duration_minutes=req.duration_minutes,
        microenvironment=req.microenvironment,
        mask=req.mask,
        vulnerability_group=req.vulnerability_group
    )

@app.get("/api/explain")
async def get_explanation(lat: float = 18.6517, lon: float = 73.7615):
    conc = await estimate_concentration_at_point(lat, lon)
    weather = await fetch_live_weather(lat, lon)
    return generate_exposure_explanation(conc, weather)

@app.get("/api/forecast", response_model=ForecastResponse)
async def get_forecast(lat: float = 18.6279, lon: float = 73.7636):
    return await get_short_horizon_forecast(lat, lon)

@app.get("/api/routes/compare", response_model=RouteComparisonResponse)
async def compare_routes(
    origin_key: str = Query("nigdi_to_pccoe", description="nigdi_to_pccoe or pccoe_to_hinjewadi"),
    activity: str = "two_wheeler",
    vulnerability_group: str = "respiratory"
):
    return await evaluate_route_options(
        origin_key=origin_key,
        activity=activity,
        vulnerability_group=vulnerability_group
    )

class RoutineParseReq(BaseModel):
    user_text: str

@app.post("/api/routine/parse", response_model=RoutineParseResponse)
async def parse_routine(req: RoutineParseReq):
    return await parse_user_routine(req.user_text)

class SentinelTriggerReq(BaseModel):
    trip_id: str = "trip_morning_1"
    scheduled_departure: str = "08:30"
    origin_key: str = "nigdi_to_pccoe"
    activity: str = "two_wheeler"
    vulnerability_group: str = "respiratory"
    ntfy_topic: str = "saansai-pccoe-alerts"

@app.post("/api/sentinel/simulate", response_model=SentinelAlertResponse)
async def simulate_sentinel_alert(req: SentinelTriggerReq):
    return await trigger_t20_sentinel_alert(
        trip_id=req.trip_id,
        scheduled_departure=req.scheduled_departure,
        origin_key=req.origin_key,
        activity=req.activity,
        vulnerability_group=req.vulnerability_group,
        ntfy_topic=req.ntfy_topic
    )

@app.get("/api/campus/status", response_model=CampusStatusResponse)
async def get_campus_status():
    return await get_campus_duty_of_care_status()

# Server-Sent Events (SSE) Stream for real-time live map & dashboard updates
@app.get("/api/stream")
async def sse_stream():
    async def event_generator():
        while True:
            # Send latest PCCOE campus reading and weather update
            conc = await estimate_concentration_at_point(18.6517, 73.7615)
            payload = {
                "timestamp": time.time(),
                "campus_pm25": conc.pm25,
                "campus_aqi": conc.aqi,
                "confidence_pct": conc.confidence_pct,
                "sources": conc.source_percentages
            }
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(8.0)  # Push every 8 seconds

    return StreamingResponse(event_generator(), media_type="text/event-stream")
