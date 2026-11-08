"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Wind, 
  Cigarette, 
  ShieldCheck, 
  Clock, 
  HelpCircle, 
  Gauge, 
  AlertTriangle,
  TrendingDown,
  Layers,
  Thermometer,
  CloudRain
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function NowScreen() {
  const [profile, setProfile] = useState("general");
  const [activity, setActivity] = useState("walking");
  const [duration, setDuration] = useState(30);
  const [microenv, setMicroenv] = useState("open_air");
  const [mask, setMask] = useState("none");

  const [loading, setLoading] = useState(true);
  const [concData, setConcData] = useState<any>(null);
  const [doseData, setDoseData] = useState<any>(null);
  const [explainData, setExplainData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);

  // Fetch live exposure data from FastAPI backend
  const fetchData = async () => {
    try {
      setLoading(true);
      // Default coordinate: PCCOE Campus (18.6517, 73.7615)
      const [cRes, expRes, fRes, wRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/concentration?lat=18.6517&lon=73.7615`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/explain?lat=18.6517&lon=73.7615`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/forecast?lat=18.6279&lon=73.7636`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/weather?lat=18.6279&lon=73.7636`).then(r => r.json())
      ]);

      setConcData(cRes);
      setExplainData(expRes);
      setForecastData(fRes);
      setWeatherData(wRes);

      // Fetch personal dose
      const dRes = await fetch(`${BACKEND_URL}/api/exposure/point`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: 18.6517,
          lon: 73.7615,
          activity: activity,
          duration_minutes: duration,
          microenvironment: microenv,
          mask: mask,
          vulnerability_group: profile
        })
      }).then(r => r.json());

      setDoseData(dRes);
    } catch (err) {
      console.error("Backend fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile, activity, duration, microenv, mask]);

  // Color helper based on exposure score
  const getScoreColor = (score: number) => {
    if (score <= 25) return { text: "text-emerald-400", bg: "bg-emerald-500", ring: "border-emerald-500", label: "Low Hazard" };
    if (score <= 50) return { text: "text-yellow-400", bg: "bg-yellow-500", ring: "border-yellow-500", label: "Moderate" };
    if (score <= 75) return { text: "text-amber-500", bg: "bg-amber-500", ring: "border-amber-500", label: "High Risk" };
    if (score <= 90) return { text: "text-rose-500", bg: "bg-rose-500", ring: "border-rose-500", label: "Severe Alert" };
    return { text: "text-purple-400", bg: "bg-purple-500", ring: "border-purple-500", label: "Hazardous" };
  };

  const scoreMeta = getScoreColor(doseData?.exposure_score || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Controls: Profile, Activity, Duration, Microenv */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Profile */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Vulnerability Profile
            </label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="general">General Adult (Baseline)</option>
              <option value="child">Child / School Student (1.45x)</option>
              <option value="elderly">Elderly (1.35x)</option>
              <option value="respiratory">Asthma / COPD / Allergy (1.85x)</option>
            </select>
          </div>

          {/* Activity */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Activity (Ventilation Rate)
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="resting">Resting / Seated (6 L/min)</option>
              <option value="walking">Walking (15 L/min)</option>
              <option value="cycling">Cycling (30 L/min)</option>
              <option value="running">Running / High Cardio (45 L/min)</option>
            </select>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Duration
              </label>
              <span className="text-xs font-bold text-emerald-400">{duration} min</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Microenvironment */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Travel Microenvironment
            </label>
            <select
              value={microenv}
              onChange={(e) => setMicroenv(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="open_air">Walking Open Air</option>
              <option value="two_wheeler">Two-Wheeler / Bike</option>
              <option value="bus_auto">Bus / Auto Rickshaw</option>
              <option value="car_recirculation">Car (AC Recirculation)</option>
              <option value="indoor_hepa">Indoor Sealed (HEPA Filtered)</option>
            </select>
          </div>

          {/* Mask Type */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Respiratory Mask
            </label>
            <select
              value={mask}
              onChange={(e) => setMask(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="none">No Mask (100% Penetration)</option>
              <option value="cloth">Cloth Mask (40% Filtration)</option>
              <option value="surgical">Surgical Mask (60% Filtration)</option>
              <option value="n95">Certified N95 (95% Filtration)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Exposure Score Hero & Inhaled Particulate Burden */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exposure Score Radial Ring */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full text-[11px] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Confidence: {concData?.confidence_pct || 96}%</span>
          </div>

          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
            Personal Exposure Score
          </h3>

          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Circular Ring Frame */}
            <div className={`w-40 h-40 rounded-full border-8 border-slate-800 flex items-center justify-center shadow-inner ${scoreMeta.ring}`}>
              <div className="flex flex-col items-center">
                <span className={`text-5xl font-black tracking-tight ${scoreMeta.text}`}>
                  {doseData?.exposure_score || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium mt-0.5">/ 100</span>
              </div>
            </div>
          </div>

          <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${scoreMeta.bg}/20 ${scoreMeta.text} border border-current/30`}>
            {scoreMeta.label}
          </div>

          <p className="text-xs text-slate-400 mt-4 max-w-xs leading-relaxed">
            {doseData?.actionable_advice || "Evaluating real-time exposure..."}
          </p>
        </div>

        {/* Inhaled Particulate Mass & Cigarette Equivalence */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Cigarette className="h-4 w-4 text-amber-400" />
                Alveolar Inhaled Particulate Burden
              </h3>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono">
                Berkeley Earth Model
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Inhaled PM2.5 Mass</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">
                    {doseData?.inhaled_mass_micrograms || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">µg</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">Deep lung alveolar deposition</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Cigarette Equivalence</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-amber-400">
                    {doseData?.cigarette_equivalence || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">cigs</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">For this {duration}-min trip</span>
              </div>
            </div>

            {/* Micro-Pollutant Breakdown */}
            <div className="mt-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Local Station Baseline (PCCOE Node)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">PM2.5</span>
                  <span className="text-sm font-bold text-emerald-400">{concData?.pm25 || 24} µg</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">PM10</span>
                  <span className="text-sm font-bold text-slate-200">{concData?.pm10 || 45} µg</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">NO2</span>
                  <span className="text-sm font-bold text-slate-200">{concData?.no2 || 22} µg</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">AQI</span>
                  <span className="text-sm font-bold text-emerald-400">{concData?.aqi || 46}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{doseData?.medical_guardrail}</span>
          </div>
        </div>

        {/* Explainability Engine: "Why" Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-400" />
                Source Attribution ("Why")
              </h3>
              <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-md">
                Stage 1 Physics
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
              {explainData?.summary || "Attributing particulate sources..."}
            </p>

            {/* Percentage Source Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Road Traffic (Old Hwy / Spine Rd)</span>
                  <span className="font-semibold text-emerald-400">
                    {explainData?.breakdown?.traffic_emissions_pct || 36}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${explainData?.breakdown?.traffic_emissions_pct || 36}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Upwind Industrial (Bhosari MIDC)</span>
                  <span className="font-semibold text-amber-400">
                    {explainData?.breakdown?.industrial_plumes_pct || 28}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${explainData?.breakdown?.industrial_plumes_pct || 28}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Construction & Road Dust</span>
                  <span className="font-semibold text-orange-400">
                    {explainData?.breakdown?.construction_dust_pct || 14}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${explainData?.breakdown?.construction_dust_pct || 14}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Regional Atmospheric Background</span>
                  <span className="font-semibold text-slate-400">
                    {explainData?.breakdown?.regional_background_pct || 22}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-slate-600 rounded-full"
                    style={{ width: `${explainData?.breakdown?.regional_background_pct || 22}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meteorological Dispersal Context */}
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs text-slate-400">
            <div>
              <span className="text-[10px] block text-slate-500">Wind Speed</span>
              <span className="font-semibold text-slate-200">{weatherData?.wind_speed_kmh || 9} km/h</span>
            </div>
            <div>
              <span className="text-[10px] block text-slate-500">Boundary Layer</span>
              <span className="font-semibold text-slate-200">{weatherData?.boundary_layer_height_m || 850} m</span>
            </div>
            <div>
              <span className="text-[10px] block text-slate-500">Ventilation</span>
              <span className="font-semibold text-emerald-400">{weatherData?.ventilation_index || 2000}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Hour Short-Horizon Forecast Trajectory */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-400" />
              6-Hour Short-Horizon Forecast & Clean Air Window
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hourly trajectory with diurnal boundary-layer correction and ±14% uncertainty band.
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-medium">
            Best Window: <span className="font-bold text-white">{forecastData?.best_window || "Next 2 hours"}</span>
          </div>
        </div>

        {/* Forecast Timeline Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {forecastData?.forecast_hours?.map((h: any, i: number) => (
            <div
              key={i}
              className={`p-3 rounded-xl border text-center transition-all ${
                i === 0
                  ? "bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700"
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-400 block">{h.hour_label}</span>
              <span className="text-lg font-black text-white block my-1">{h.pm25}</span>
              <span className="text-[10px] text-slate-500 block">±{Math.round((h.pm25_upper - h.pm25))} µg</span>
              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                  AQI {h.aqi}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">{h.dispersion_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
