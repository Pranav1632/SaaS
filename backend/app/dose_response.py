"""
Stage 2: Personal Dose & Physiological Risk Model.
Computes minute ventilation, microenvironment attenuation, inhaled toxic mass,
cigarette equivalence heuristic, and saturated 0-100 exposure risk score.
"""
import math
from pydantic import BaseModel
from typing import Optional

# MET-based minute ventilation rates (Liters per minute)
VENTILATION_RATES_L_PER_MIN = {
    "resting": 6.0,
    "walking": 15.0,
    "cycling": 30.0,
    "running": 45.0
}

# Microenvironment penetration / infiltration factors
MICROENVIRONMENT_FACTORS = {
    "open_air": 1.00,
    "two_wheeler": 1.00,
    "bus_auto": 0.85,
    "car_recirculation": 0.45,
    "indoor_normal": 0.65,
    "indoor_hepa": 0.25
}

# Mask filtration multipliers
MASK_PENETRATION = {
    "none": 1.00,
    "cloth": 0.60,
    "surgical": 0.40,
    "n95": 0.05
}

# Vulnerability weights (amplifies physiological susceptibility)
VULNERABILITY_WEIGHTS = {
    "general": 1.00,
    "child": 1.45,
    "elderly": 1.35,
    "respiratory": 1.85  # Asthma, COPD, dust bronchitis
}

class DoseCalculation(BaseModel):
    ambient_pm25: float
    effective_pm25: float
    activity: str
    duration_minutes: int
    microenvironment: str
    mask: str
    vulnerability_group: str
    inhaled_mass_micrograms: float
    cigarette_equivalence: float
    exposure_score: int  # 0 to 100
    risk_tier: str  # "Low" | "Moderate" | "High" | "Severe" | "Hazardous"
    actionable_advice: str
    medical_guardrail: str = "Guidance only — SaansAI calculates physiological exposure estimates and never provides clinical diagnoses or replaces medical advice."

def compute_personal_dose(
    pm25: float,
    activity: str = "walking",
    duration_minutes: int = 30,
    microenvironment: str = "open_air",
    mask: str = "none",
    vulnerability_group: str = "general"
) -> DoseCalculation:
    """
    Computes cumulative inhaled dose and exposure score.
    """
    ve = VENTILATION_RATES_L_PER_MIN.get(activity.lower(), 15.0)
    micro_factor = MICROENVIRONMENT_FACTORS.get(microenvironment.lower(), 1.00)
    mask_factor = MASK_PENETRATION.get(mask.lower(), 1.00)
    vuln_weight = VULNERABILITY_WEIGHTS.get(vulnerability_group.lower(), 1.00)

    # Effective inhaled PM2.5 concentration after filtration
    if pm25 <= 0.0 or duration_minutes <= 0:
        effective_pm25 = 0.0
        inhaled_mass_ug = 0.0
        cigarette_equiv = 0.0
        exposure_score = 0
    else:
        effective_pm25 = max(0.1, pm25 * micro_factor * mask_factor)
        # Inhaled mass in micrograms (ug):
        # ve (L/min) * (1 m3 / 1000 L) * duration (min) * effective_pm25 (ug/m3)
        inhaled_volume_m3 = (ve / 1000.0) * duration_minutes
        inhaled_mass_ug = round(effective_pm25 * inhaled_volume_m3, 1)
        cigarette_equiv = round(inhaled_mass_ug / 330.0, 2)
        # Saturated exposure score (0 to 100):
        # Log-linear saturating curve: 100 * [1 - exp(- (mass / 220) * vuln_weight)]
        saturated_score = 100.0 * (1.0 - math.exp(- (inhaled_mass_ug / 220.0) * vuln_weight))
        exposure_score = int(round(max(0.0, min(100.0, saturated_score))))

    # Risk tiers
    if exposure_score <= 25:
        tier = "Low"
        advice = "Safe outdoor breathing conditions for this activity and duration."
    elif exposure_score <= 50:
        tier = "Moderate"
        advice = "Acceptable air exposure. Sensitive individuals should avoid prolonged exertion."
    elif exposure_score <= 75:
        tier = "High"
        advice = "Significant toxic lung burden. Consider shifting departure by 45 min or wearing an N95 mask."
    elif exposure_score <= 90:
        tier = "Severe"
        advice = "Unhealthy alveolar particulate deposition. Restrict outdoor exercise or choose indoor alternative."
    else:
        tier = "Hazardous"
        advice = "Extreme toxic exposure hazard. Immediate recommendation to stay indoors with air purification."

    return DoseCalculation(
        ambient_pm25=round(pm25, 1),
        effective_pm25=round(effective_pm25, 1),
        activity=activity,
        duration_minutes=duration_minutes,
        microenvironment=microenvironment,
        mask=mask,
        vulnerability_group=vulnerability_group,
        inhaled_mass_micrograms=inhaled_mass_ug,
        cigarette_equivalence=cigarette_equiv,
        exposure_score=exposure_score,
        risk_tier=tier,
        actionable_advice=advice
    )
