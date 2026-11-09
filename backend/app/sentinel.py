"""
T-20 Minute Departure Sentinel & Real Mobile Push Delivery via ntfy.sh.
Audits the planned route 20 minutes before departure and fires a real push notification.
"""
import time
import httpx
from pydantic import BaseModel
from typing import Optional, Dict
from .routing import evaluate_route_options

class SentinelAlertResponse(BaseModel):
    trip_id: str
    scheduled_departure: str
    current_time: str
    origin: str
    destination: str
    alert_title: str
    alert_message: str
    clean_alternative_recommended: bool
    recommended_route_name: str
    exposure_saved_pct: float
    time_penalty_min: int
    push_delivered: bool
    ntfy_topic: str
    ntfy_url: str

async def trigger_t20_sentinel_alert(
    trip_id: str = "trip_morning_1",
    scheduled_departure: str = "08:30",
    origin_key: str = "nigdi_to_pccoe",
    activity: str = "two_wheeler",
    vulnerability_group: str = "respiratory",
    ntfy_topic: str = "saansai-pccoe-alerts"
) -> SentinelAlertResponse:
    """
    Evaluates current air quality on the planned route and dispatches real push alert.
    """
    comp = await evaluate_route_options(
        origin_key=origin_key,
        activity=activity,
        vulnerability_group=vulnerability_group
    )

    clean_route = next((r for r in comp.routes if r.route_id == comp.cleanest_route_id), comp.routes[0])
    highway_route = comp.routes[0]

    now_time = time.strftime("%H:%M:%S")
    title = f"SaansAI Alert (T-20 Min) - {now_time}"
    message = (
        f"Spine/Highway corridor PM2.5 is {highway_route.avg_pm25} µg/m³. "
        f"Switch to '{clean_route.name}' to cut inhaled toxic burden by {comp.exposure_reduction_pct}% "
        f"(+{comp.time_penalty_minutes} min)."
    )

    # Dispatch to ntfy.sh with interactive Action Button and Urgent Priority
    push_success = False
    ntfy_url = f"https://ntfy.sh/{ntfy_topic}"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(
                ntfy_url,
                content=message.encode("utf-8"),
                headers={
                    "Title": title,
                    "Priority": "urgent",  # Level 5: forces heads-up banner & vibration every time
                    "Tags": "warning,wind_face,mask",
                    # Clean ASCII Action button displayed directly inside phone notification:
                    "Actions": f"view, Switch to Clean Route, https://ntfy.sh/{ntfy_topic}"
                }
            )
            if resp.status_code == 200:
                push_success = True
    except Exception as e:
        print(f"[Sentinel Push] ntfy.sh dispatch notice: {e}")

    return SentinelAlertResponse(
        trip_id=trip_id,
        scheduled_departure=scheduled_departure,
        current_time=time.strftime("%H:%M"),
        origin=comp.origin_name,
        destination=comp.destination_name,
        alert_title=title,
        alert_message=message,
        clean_alternative_recommended=(comp.exposure_reduction_pct > 15.0),
        recommended_route_name=clean_route.name,
        exposure_saved_pct=comp.exposure_reduction_pct,
        time_penalty_min=comp.time_penalty_minutes,
        push_delivered=push_success,
        ntfy_topic=ntfy_topic,
        ntfy_url=ntfy_url
    )
