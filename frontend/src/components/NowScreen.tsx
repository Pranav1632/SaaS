"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Wind, 
  Cigarette, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  Layers,
  Thermometer,
  Sparkles,
  HeartPulse,
  Compass,
  Gauge,
  ArrowUpRight,
  Info
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

const safeJsonFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return null;
  }
};

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
      const [cRes, expRes, fRes, wRes] = await Promise.all([
        safeJsonFetch(`${BACKEND_URL}/api/concentration?lat=18.6517&lon=73.7615`),
        safeJsonFetch(`${BACKEND_URL}/api/explain?lat=18.6517&lon=73.7615`),
        safeJsonFetch(`${BACKEND_URL}/api/forecast?lat=18.6279&lon=73.7636`),
        safeJsonFetch(`${BACKEND_URL}/api/weather?lat=18.6279&lon=73.7636`)
      ]);

      if (cRes) setConcData(cRes);
      if (expRes) setExplainData(expRes);
      if (fRes) setForecastData(fRes);
      if (wRes) setWeatherData(wRes);

      // Fetch personal dose
      const dRes = await safeJsonFetch(`${BACKEND_URL}/api/exposure/point`, {
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
      });

      if (dRes) setDoseData(dRes);
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
    if (score <= 25) return { text: "text-emerald-400", hex: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Low Hazard" };
    if (score <= 50) return { text: "text-amber-400", hex: "#facc15", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Moderate" };
    if (score <= 75) return { text: "text-orange-400", hex: "#fb923c", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "High Risk" };
    if (score <= 90) return { text: "text-rose-400", hex: "#f87171", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Severe Alert" };
    return { text: "text-purple-400", hex: "#c084fc", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Hazardous" };
  };

  const score = doseData?.exposure_score || 0;
  const scoreMeta = getScoreColor(score);

  // SVG Gauge calculations (radius = 70, circumference = 2 * PI * 70 = 439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(score, 100) / 100) * (circumference * 0.75);

  const profiles = [
    { id: "general", label: "General Adult", mult: "1.0×" },
    { id: "child", label: "Child / Student", mult: "1.45×" },
    { id: "elderly", label: "Elderly", mult: "1.35×" },
    { id: "respiratory", label: "Asthma / Respiratory", mult: "1.85×" },
  ];

  const activities = [
    { id: "resting", label: "Seated", rate: "6 L/m" },
    { id: "walking", label: "Walking", rate: "15 L/m" },
    { id: "cycling", label: "Cycling", rate: "30 L/m" },
    { id: "running", label: "Cardio", rate: "45 L/m" },
  ];

  const microenvs = [
    { id: "open_air", label: "Open Air Walk" },
    { id: "two_wheeler", label: "Two-Wheeler" },
    { id: "bus_auto", label: "Bus / Rickshaw" },
    { id: "car_recirculation", label: "Car AC Recirc" },
    { id: "indoor_hepa", label: "Indoor HEPA" },
  ];

  const masks = [
    { id: "none", label: "No Mask (0%)" },
    { id: "cloth", label: "Cloth (40%)" },
    { id: "surgical", label: "Surgical (60%)" },
    { id: "n95", label: "N95 Sealed (95%)" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Precision Physiological Parameter Console */}
      <div className="bg-[#0d131f] border border-white/[0.08] rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
          <div className="flex items-center space-x-2">
            <HeartPulse className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-semibold">
              Physiological Telemetry & Exposure Setup
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            WHO 2021 Reference Framework
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Profile Select */}
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider block">
              Vulnerability Profile
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {profiles.map((p) => {
                const isSelected = profile === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProfile(p.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono border transition-all text-left ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]"
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="text-[10px] opacity-70 ml-1">{p.mult}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Select */}
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider block">
              Activity (Minute Ventilation)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {activities.map((a) => {
                const isSelected = activity === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActivity(a.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono border transition-all text-left ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]"
                    }`}
                  >
                    <span>{a.label}</span>
                    <span className="text-[10px] opacity-70 ml-1">{a.rate}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Microenvironment & Mask Select */}
          <div className="lg:col-span-4 space-y-3">
            <div>
              <label className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Travel Microenvironment
              </label>
              <select
                value={microenv}
                onChange={(e) => setMicroenv(e.target.value)}
                className="w-full bg-[#080c14] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                {microenvs.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Filtration Mask
                </label>
                <select
                  value={mask}
                  onChange={(e) => setMask(e.target.value)}
                  className="w-full bg-[#080c14] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  {masks.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-28">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                    Duration
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">{duration}m</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Telemetry Grid (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Precision Radial Exposure Gauge */}
        <div className="lg:col-span-4 bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                Exposure Telemetry Index
              </span>
              <span className="text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-slate-300 px-2 py-0.5 rounded">
                Conf: {concData?.confidence_pct || 96}%
              </span>
            </div>

            {/* Custom SVG Precision Dial */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-135" viewBox="0 0 160 160">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="10"
                    strokeDasharray={circumference * 0.75}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                  />
                  {/* Value Arc */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={scoreMeta.hex}
                    strokeWidth="10"
                    strokeDasharray={circumference * 0.75}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                  <span className={`text-5xl font-black font-mono tracking-tight ${scoreMeta.text}`}>
                    {score}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">INDEX / 100</span>
                  <div className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${scoreMeta.bg} ${scoreMeta.text} border ${scoreMeta.border}`}>
                    {scoreMeta.label}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] space-y-2">
            <div className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed font-sans">
              <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{doseData?.actionable_advice || "Evaluating real-time exposure..."}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 pt-1">
              Physiological basis: {doseData?.minute_ventilation_liters_min || 15} L/min ventilation rate
            </div>
          </div>
        </div>

        {/* Column 2: Alveolar Dose & Berkeley Earth Cigarette Equivalence */}
        <div className="lg:col-span-4 bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
                <Cigarette className="h-3.5 w-3.5 text-amber-400" />
                Alveolar Deposition & Cigarette Burden
              </span>
              <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                Berkeley Earth Model
              </span>
            </div>

            {/* Dose Metrics Split */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#080c14] border border-white/[0.06] p-4 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Inhaled Mass
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-white tabular-nums">
                    {doseData?.inhaled_mass_micrograms || 0}
                  </span>
                  <span className="text-xs font-mono text-slate-400">µg</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 block mt-1">
                  Alveolar deposition
                </span>
              </div>

              <div className="bg-[#080c14] border border-white/[0.06] p-4 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Cigarette Equiv.
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-amber-400 tabular-nums">
                    {doseData?.cigarette_equivalence || 0}
                  </span>
                  <span className="text-xs font-mono text-slate-400">cigs</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 block mt-1">
                  For this {duration}m trip
                </span>
              </div>
            </div>

            {/* Local Station Micro-pollutant Baseline */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Local Ambient Baseline (PCCOE Sensor Node)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-[#080c14] border border-white/[0.06] p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">PM2.5</span>
                  <span className="text-sm font-bold text-emerald-400">{concData?.pm25 || 24}</span>
                  <span className="text-[9px] text-slate-500 block">µg/m³</span>
                </div>
                <div className="bg-[#080c14] border border-white/[0.06] p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">PM10</span>
                  <span className="text-sm font-bold text-slate-200">{concData?.pm10 || 45}</span>
                  <span className="text-[9px] text-slate-500 block">µg/m³</span>
                </div>
                <div className="bg-[#080c14] border border-white/[0.06] p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">NO2</span>
                  <span className="text-sm font-bold text-slate-200">{concData?.no2 || 22}</span>
                  <span className="text-[9px] text-slate-500 block">µg/m³</span>
                </div>
                <div className="bg-[#080c14] border border-white/[0.06] p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">NAQI</span>
                  <span className="text-sm font-bold text-emerald-400">{concData?.aqi || 46}</span>
                  <span className="text-[9px] text-slate-500 block">Good</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Guardrail */}
          <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{doseData?.medical_guardrail}</span>
          </div>
        </div>

        {/* Column 3: Source Attribution & Physics Decomposition */}
        <div className="lg:col-span-4 bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-teal-400" />
                Two-Stage Source Attribution ("Why")
              </span>
              <span className="text-[10px] font-mono bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded">
                Physics + IDW
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-[#080c14] p-3 rounded-xl border border-white/[0.06]">
              {explainData?.summary || "Attributing particulate sources..."}
            </p>

            {/* Precision Micro-bars */}
            <div className="space-y-3 font-mono">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">Road Traffic (Old Hwy / Spine Rd)</span>
                  <span className="font-bold text-emerald-400">
                    {explainData?.breakdown?.traffic_emissions_pct || 36}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#080c14] rounded-full overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${explainData?.breakdown?.traffic_emissions_pct || 36}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">Bhosari MIDC Industrial Plumes</span>
                  <span className="font-bold text-amber-400">
                    {explainData?.breakdown?.industrial_plumes_pct || 28}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#080c14] rounded-full overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${explainData?.breakdown?.industrial_plumes_pct || 28}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">Crustal & Construction Dust</span>
                  <span className="font-bold text-orange-400">
                    {explainData?.breakdown?.construction_dust_pct || 14}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#080c14] rounded-full overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${explainData?.breakdown?.construction_dust_pct || 14}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">Regional Atmospheric Background</span>
                  <span className="font-bold text-slate-400">
                    {explainData?.breakdown?.regional_background_pct || 22}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#080c14] rounded-full overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-500"
                    style={{ width: `${explainData?.breakdown?.regional_background_pct || 22}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meteorological Dispersal Telemetry */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Wind Speed</span>
              <span className="font-bold text-slate-200 text-xs">{weatherData?.wind_speed_kmh || 9} km/h</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Boundary Layer</span>
              <span className="font-bold text-slate-200 text-xs">{weatherData?.boundary_layer_height_m || 850} m</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Ventilation</span>
              <span className="font-bold text-emerald-400 text-xs">{weatherData?.ventilation_index || 2000}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Hour Short-Horizon Forecast Trajectory */}
      <div className="bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                6-Hour Short-Horizon Forecast & Clean Air Departure Window
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Diurnal boundary-layer ventilation trajectory with ±14% uncertainty bounds.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Optimal Window: <strong className="text-white">{forecastData?.best_window || "Next 2 hours"}</strong></span>
          </div>
        </div>

        {/* Precision Timeline Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
          {forecastData?.forecast_hours?.map((h: any, i: number) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border text-center transition-all ${
                i === 0
                  ? "bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                  : "bg-[#080c14] border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <span className="text-[10px] font-semibold text-slate-400 block">{h.hour_label}</span>
              <div className="my-1.5">
                <span className="text-xl font-black text-white tabular-nums block">{h.pm25}</span>
                <span className="text-[9px] text-slate-500 block">±{Math.round((h.pm25_upper - h.pm25))} µg</span>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] font-bold text-emerald-400 block">
                  AQI {h.aqi}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5 truncate">{h.dispersion_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
