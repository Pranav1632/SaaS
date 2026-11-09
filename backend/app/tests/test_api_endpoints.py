"""
Integration tests for FastAPI endpoints using TestClient / AsyncClient.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_and_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_stations_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/stations")
        assert r.status_code == 200
        stations = r.json()
        assert len(stations) >= 4
        # Verify PCCOE campus node is present
        campus_node = next((s for s in stations if s["station_id"] == "pccoe_campus_01"), None)
        assert campus_node is not None
        assert campus_node["pm25"] > 0
        assert campus_node["aqi"] > 0

@pytest.mark.asyncio
async def test_hyperlocal_concentration_and_explain():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # PCCOE coordinates
        r = await client.get("/api/concentration?lat=18.6517&lon=73.7615")
        assert r.status_code == 200
        data = r.json()
        assert data["pm25"] > 0
        assert 50 <= data["confidence_pct"] <= 100
        assert "traffic_roads" in data["source_attribution"]
        assert "industrial_plumes" in data["source_attribution"]

        # Explain endpoint
        r_exp = await client.get("/api/explain?lat=18.6517&lon=73.7615")
        assert r_exp.status_code == 200
        exp_data = r_exp.json()
        assert "summary" in exp_data
        assert "primary_driver" in exp_data
        assert "traffic_emissions_pct" in exp_data["breakdown"]

@pytest.mark.asyncio
async def test_exposure_point_dose():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "lat": 18.6517,
            "lon": 73.7615,
            "activity": "running",
            "duration_minutes": 45,
            "microenvironment": "open_air",
            "mask": "none",
            "vulnerability_group": "respiratory"
        }
        r = await client.post("/api/exposure/point", json=payload)
        assert r.status_code == 200
        dose = r.json()
        assert dose["inhaled_mass_micrograms"] > 0
        assert dose["cigarette_equivalence"] > 0
        assert 0 <= dose["exposure_score"] <= 100
        assert "medical_guardrail" in dose

@pytest.mark.asyncio
async def test_route_comparison():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/routes/compare?origin_key=nigdi_to_pccoe&activity=two_wheeler&vulnerability_group=respiratory")
        assert r.status_code == 200
        data = r.json()
        assert len(data["routes"]) == 2
        assert data["exposure_reduction_pct"] > 0
        assert "recommendation" in data

@pytest.mark.asyncio
async def test_routine_parsing():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"user_text": "I ride my bike to PCCOE college from Nigdi at 8:15 AM, and my brother with asthma runs at 6:30 PM."}
        r = await client.post("/api/routine/parse", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert len(data["trips"]) >= 1
        assert data["trips"][0]["departure_time"] is not None
        assert data["trips"][0]["t_minus_alert_time"] is not None

@pytest.mark.asyncio
async def test_campus_status():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/campus/status")
        assert r.status_code == 200
        data = r.json()
        assert data["campus_name"] is not None
        assert data["sports_recess_status"] in ["PERMITTED", "RESTRICTED", "PROHIBITED"]
        assert "outdoor_intake_dampers" in data["hvac_state"]

@pytest.mark.asyncio
async def test_weather_and_traffic():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Weather
        r_w = await client.get("/api/weather?lat=18.6279&lon=73.7636")
        assert r_w.status_code == 200
        w_data = r_w.json()
        assert "temperature_c" in w_data
        assert "ventilation_index" in w_data

        # Traffic
        r_t = await client.get("/api/traffic")
        assert r_t.status_code == 200
        t_data = r_t.json()
        assert len(t_data) >= 3
        assert 0.0 <= t_data[0]["congestion_ratio"] <= 1.0

@pytest.mark.asyncio
async def test_crowd_reports():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get existing reports
        r_get = await client.get("/api/crowd-reports")
        assert r_get.status_code == 200
        reports = r_get.json()
        assert isinstance(reports, list)

        # Post a new report
        new_rep = {
            "report_type": "road_digging",
            "description": "Trench digging along Spine Road near PCCOE sector 26",
            "lat": 18.6540,
            "lon": 73.7650,
            "reported_by": "Test Suite Student"
        }
        r_post = await client.post("/api/crowd-reports", json=new_rep)
        assert r_post.status_code == 200
        created = r_post.json()
        assert created["description"] == new_rep["description"]
        assert created["reported_by"] == "Test Suite Student"

@pytest.mark.asyncio
async def test_forecast_and_sentinel_simulate():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Forecast
        r_fc = await client.get("/api/forecast?lat=18.6279&lon=73.7636")
        assert r_fc.status_code == 200
        fc_data = r_fc.json()
        assert len(fc_data["forecast_hours"]) > 0
        assert "best_window" in fc_data

        # Sentinel simulation
        sentinel_payload = {
            "trip_id": "test_trip_1",
            "scheduled_departure": "08:30",
            "origin_key": "nigdi_to_pccoe",
            "activity": "two_wheeler",
            "vulnerability_group": "respiratory",
            "ntfy_topic": "saansai-pccoe-alerts"
        }
        r_sentinel = await client.post("/api/sentinel/simulate", json=sentinel_payload)
        assert r_sentinel.status_code == 200
        sent_data = r_sentinel.json()
        assert "alert_title" in sent_data
        assert "alert_message" in sent_data
        assert "recommended_route_name" in sent_data
        assert sent_data["push_delivered"] is True
