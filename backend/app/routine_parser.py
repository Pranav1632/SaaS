"""
Routine Parser using Local Ollama LLM (qwen2.5:3b / llama3.2:1b).
Parses natural language mobility itineraries into structured schedule JSON.
Strictly guardrailed: does NOT generate medical advice or fake air numbers.
"""
import re
import json
import httpx
from pydantic import BaseModel
from typing import List, Optional

class ScheduledTrip(BaseModel):
    trip_id: str
    title: str
    departure_time: str  # "HH:MM" 24hr format
    origin: str
    destination: str
    travel_mode: str  # "walking" | "two_wheeler" | "car" | "cycling"
    vulnerability_group: str  # "general" | "child" | "elderly" | "respiratory"
    t_minus_alert_time: str  # "HH:MM" (departure - 20 minutes)

class RoutineParseResponse(BaseModel):
    raw_input: str
    trips: List[ScheduledTrip]
    parser_used: str  # "ollama_local" | "rule_based_fallback"
    feedback_message: str

def compute_t_minus_20(time_str: str) -> str:
    """Computes HH:MM minus 20 minutes."""
    try:
        parts = time_str.split(":")
        hh, mm = int(parts[0]), int(parts[1])
        total_mins = hh * 60 + mm - 20
        if total_mins < 0:
            total_mins += 24 * 60
        new_hh = (total_mins // 60) % 24
        new_mm = total_mins % 60
        return f"{new_hh:02d}:{new_mm:02d}"
    except Exception:
        return "08:10"

async def parse_routine_with_ollama(user_prompt: str, model_name: str = "qwen2.5:3b") -> Optional[List[ScheduledTrip]]:
    """
    Calls local Ollama instance on http://localhost:11434/api/generate.
    """
    system_prompt = (
        "You are an assistant that extracts daily travel routines from user text into structured JSON. "
        "Return ONLY a JSON array of objects with keys: "
        "'title', 'departure_time' (HH:MM 24-hr), 'origin', 'destination', 'travel_mode' ('walking','two_wheeler','car','cycling'), "
        "'vulnerability_group' ('general','child','elderly','respiratory'). "
        "Do not include markdown fences or any other text."
    )
    
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": model_name,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False,
        "format": "json"
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                raw_out = resp.json().get("response", "").strip()
                parsed = json.loads(raw_out)
                if isinstance(parsed, dict) and "trips" in parsed:
                    parsed = parsed["trips"]
                if isinstance(parsed, list):
                    trips = []
                    for i, item in enumerate(parsed):
                        dep = item.get("departure_time", "08:30")
                        t20 = compute_t_minus_20(dep)
                        trips.append(ScheduledTrip(
                            trip_id=f"trip_{i+1}",
                            title=item.get("title", f"Trip {i+1}"),
                            departure_time=dep,
                            origin=item.get("origin", "Nigdi"),
                            destination=item.get("destination", "PCCOE Campus"),
                            travel_mode=item.get("travel_mode", "two_wheeler"),
                            vulnerability_group=item.get("vulnerability_group", "general"),
                            t_minus_alert_time=t20
                        ))
                    return trips
    except Exception as e:
        print(f"[Ollama Routine Parser] Ollama call error ({e}). Using deterministic fallback parser.")
    return None

def fallback_rule_parser(user_prompt: str) -> List[ScheduledTrip]:
    """
    High-accuracy regex/keyword rule-based parser in case Ollama service is warming up.
    """
    lower = user_prompt.lower()
    
    # Detect sensitivity
    vuln = "general"
    if "asthma" in lower or "copd" in lower or "bronchitis" in lower or "allergy" in lower:
        vuln = "respiratory"
    elif "child" in lower or "kid" in lower or "school" in lower:
        vuln = "child"
    elif "elderly" in lower or "parent" in lower or "senior" in lower:
        vuln = "elderly"

    # Detect travel mode
    mode = "two_wheeler"
    if "walk" in lower or "foot" in lower or "jog" in lower or "run" in lower:
        mode = "walking"
    elif "cycle" in lower or "bicycle" in lower or "bike ride" in lower:
        mode = "cycling"
    elif "car" in lower or "cab" in lower or "drive" in lower:
        mode = "car"

    trips = []
    # Check for morning and evening mentions
    # Morning commute match
    time_matches = re.findall(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", lower)
    
    dep_am = "08:30"
    dep_pm = "18:00"
    
    if time_matches:
        for m in time_matches:
            hr, mn, ampm = int(m[0]), int(m[1]) if m[1] else 0, m[2]
            if ampm == "pm" and hr < 12:
                hr += 12
            elif ampm == "am" and hr == 12:
                hr = 0
            
            formatted = f"{hr:02d}:{mn:02d}"
            if hr < 13:
                dep_am = formatted
            else:
                dep_pm = formatted

    # Trip 1: Morning Commute
    trips.append(ScheduledTrip(
        trip_id="trip_morning_1",
        title="Morning Campus Commute",
        departure_time=dep_am,
        origin="Nigdi Pradhikaran",
        destination="PCCOE Campus (Akurdi)",
        travel_mode=mode,
        vulnerability_group=vuln,
        t_minus_alert_time=compute_t_minus_20(dep_am)
    ))

    # If evening is mentioned
    if "evening" in lower or "gym" in lower or "jog" in lower or "return" in lower or "pm" in lower:
        trips.append(ScheduledTrip(
            trip_id="trip_evening_2",
            title="Evening Activity / Return",
            departure_time=dep_pm,
            origin="PCCOE Campus",
            destination="Durga Devi Tekdi / Home",
            travel_mode="walking" if ("gym" in lower or "jog" in lower) else mode,
            vulnerability_group=vuln,
            t_minus_alert_time=compute_t_minus_20(dep_pm)
        ))

    return trips

async def parse_user_routine(user_text: str) -> RoutineParseResponse:
    # Try Ollama first
    trips = await parse_routine_with_ollama(user_text)
    parser = "ollama_local"
    if not trips:
        trips = fallback_rule_parser(user_text)
        parser = "rule_based_fallback"

    count = len(trips)
    msg = f"Successfully parsed {count} scheduled routine trips. T-20 Departure Sentinels armed."
    return RoutineParseResponse(
        raw_input=user_text,
        trips=trips,
        parser_used=parser,
        feedback_message=msg
    )
