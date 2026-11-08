"""
Crowdsourced community dust, construction, and burning reports.
Allows students and citizens to submit geolocated dust / digging hazards.
"""
import time
from pydantic import BaseModel
from typing import List

class CrowdReport(BaseModel):
    id: str
    report_type: str  # "construction_dust" | "road_digging" | "garbage_burning"
    description: str
    lat: float
    lon: float
    reported_by: str
    upvotes: int
    created_at: float
    is_active: bool = True

_CROWD_REPORTS: List[CrowdReport] = [
    CrowdReport(
        id="rep_pccoe_gate2",
        report_type="road_digging",
        description="Drainage trench digging opposite PCCOE Gate 2, heavy airborne dust",
        lat=18.6521,
        lon=73.7628,
        reported_by="Civil Engg Dept",
        upvotes=14,
        created_at=time.time() - 3600 * 2,
        is_active=True
    ),
    CrowdReport(
        id="rep_bhosari_flyover",
        report_type="construction_dust",
        description="Metro pillar foundation work near Bhosari flyover ramp",
        lat=18.6310,
        lon=73.8390,
        reported_by="PMRDA Commuter",
        upvotes=28,
        created_at=time.time() - 3600 * 5,
        is_active=True
    )
]

def get_active_crowd_reports() -> List[CrowdReport]:
    return [r for r in _CROWD_REPORTS if r.is_active]

def add_crowd_report(report_type: str, description: str, lat: float, lon: float, reported_by: str = "Anonymous") -> CrowdReport:
    new_rep = CrowdReport(
        id=f"rep_{int(time.time())}",
        report_type=report_type,
        description=description,
        lat=lat,
        lon=lon,
        reported_by=reported_by,
        upvotes=1,
        created_at=time.time(),
        is_active=True
    )
    _CROWD_REPORTS.append(new_rep)
    return new_rep
