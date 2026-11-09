"use client";

import React, { useState, useEffect } from "react";
import { 
  CalendarClock, 
  Send, 
  Bell, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  MapPin, 
  Sparkles,
  Zap
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function PlanScreen() {
  const [userText, setUserText] = useState(
    "I ride my two-wheeler to PCCOE college from Nigdi at 8:20 AM, and my brother with asthma jogs at 6:30 PM."
  );
  const [parsing, setParsing] = useState(false);
  const [trips, setTrips] = useState<any[]>([
    {
      trip_id: "trip_morning_1",
      title: "Morning Campus Commute",
      departure_time: "08:20",
      origin: "Nigdi Pradhikaran",
      destination: "PCCOE Campus (Akurdi)",
      travel_mode: "two_wheeler",
      vulnerability_group: "respiratory",
      t_minus_alert_time: "08:00"
    },
    {
      trip_id: "trip_evening_2",
      title: "Evening Jog / Sports",
      departure_time: "18:30",
      origin: "PCCOE Grounds",
      destination: "Durga Devi Tekdi Park",
      travel_mode: "walking",
      vulnerability_group: "respiratory",
      t_minus_alert_time: "18:10"
    }
  ]);

  // Route comparison state
  const [routeOrigin, setRouteOrigin] = useState("nigdi_to_pccoe");
  const [routeComparison, setRouteComparison] = useState<any>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Sentinel Simulation State
  const [sentinelLoading, setSentinelLoading] = useState(false);
  const [latestAlert, setLatestAlert] = useState<any>(null);
  const [ntfyTopic, setNtfyTopic] = useState("saansai-pccoe-alerts");

  // Fetch route comparison
  const fetchRoutes = async (originKey: string) => {
    try {
      setLoadingRoutes(true);
      const res = await fetch(`${BACKEND_URL}/api/routes/compare?origin_key=${originKey}&activity=two_wheeler&vulnerability_group=respiratory`);
      const data = await res.json();
      setRouteComparison(data);
    } catch (err) {
      console.error("Route compare error:", err);
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    fetchRoutes(routeOrigin);
  }, [routeOrigin]);

  // Parse routine text
  const handleParseRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim()) return;
    try {
      setParsing(true);
      const res = await fetch(`${BACKEND_URL}/api/routine/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: userText })
      });
      const data = await res.json();
      if (data.trips && data.trips.length > 0) {
        setTrips(data.trips);
      }
    } catch (err) {
      console.error("Parse error:", err);
    } finally {
      setParsing(false);
    }
  };

  // Simulate T-20 Departure Alert
  const handleTriggerSentinel = async () => {
    try {
      setSentinelLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/sentinel/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: trips[0]?.trip_id || "trip_morning_1",
          scheduled_departure: trips[0]?.departure_time || "08:20",
          origin_key: routeOrigin,
          activity: trips[0]?.travel_mode || "two_wheeler",
          vulnerability_group: trips[0]?.vulnerability_group || "respiratory",
          ntfy_topic: ntfyTopic
        })
      });
      const data = await res.json();
      setLatestAlert(data);
    } catch (err) {
      console.error("Sentinel trigger error:", err);
    } finally {
      setSentinelLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Conversational Q&A Routine Architect */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-400" />
              Conversational Routine Architect (Ollama LLM)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              State your schedule in plain words. SaansAI extracts departure waypoints and arms T-20 departure sentinels.
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg">
            Local Model: qwen2.5:3b
          </span>
        </div>

        <form onSubmit={handleParseRoutine} className="flex gap-2">
          <input
            type="text"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="e.g. I leave home in Nigdi at 8:20 AM for PCCOE on my bike..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={parsing}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-3 rounded-xl font-semibold text-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {parsing ? <Zap className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Parse Itinerary</span>
          </button>
        </form>

        {/* Visual Daily Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {trips.map((t, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t.title}</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  Departs: {t.departure_time}
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <p>📍 {t.origin} ➔ {t.destination}</p>
                <p>🛵 Travel Mode: <span className="text-slate-400 capitalize">{t.travel_mode.replace("_", " ")}</span></p>
                <p>🛡️ Profile: <span className="text-amber-400 capitalize">{t.vulnerability_group}</span></p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Bell className="h-3.5 w-3.5" />
                  T-20 Sentinel armed for <b>{t.t_minus_alert_time}</b>
                </span>
                <span className="text-[10px] text-slate-500">20 min prior</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Real Road Geometry Route Comparison (OSRM) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Clean Air Corridor Comparison (OSRM Real Geometry)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Comparing arterial highway routes against green residential corridors.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRouteOrigin("nigdi_to_pccoe")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                routeOrigin === "nigdi_to_pccoe"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-slate-950 text-slate-400 border-slate-800"
              }`}
            >
              Nigdi ➔ PCCOE Campus
            </button>
            <button
              onClick={() => setRouteOrigin("pccoe_to_hinjewadi")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                routeOrigin === "pccoe_to_hinjewadi"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-slate-950 text-slate-400 border-slate-800"
              }`}
            >
              PCCOE ➔ Hinjewadi IT Park
            </button>
          </div>
        </div>

        {/* Route Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routeComparison?.routes?.map((r: any, idx: number) => {
            const isCleanest = r.route_id === routeComparison.cleanest_route_id;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  isCleanest
                    ? "bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isCleanest ? "text-emerald-400" : "text-slate-400"}`}>
                    {r.name}
                  </span>
                  {isCleanest && (
                    <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Cleanest Choice
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-4">{r.summary}</p>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Avg PM2.5</span>
                    <span className="text-base font-bold text-white">{r.avg_pm25} µg</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Trip Time</span>
                    <span className="text-base font-bold text-slate-200">{r.duration_minutes} min</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Inhaled Dose</span>
                    <span className="text-base font-bold text-amber-400">{r.cumulative_inhaled_mass_ug} µg</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Distance: {r.distance_km} km</span>
                  <span className="font-semibold text-slate-300">Risk Tier: {r.risk_tier}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict Box */}
        {routeComparison && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                SaansAI Trade-off Verdict ({routeComparison.exposure_reduction_pct}% Toxic Dose Reduction)
              </span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {routeComparison.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. T-20 Departure Sentinel & Real Mobile Push Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-400" />
              T-20 Departure Sentinel & Real Phone Push Alert
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Fires a real system push notification to your phone via ntfy.sh and renders the on-screen lock screen preview.
            </p>
          </div>

          <button
            onClick={handleTriggerSentinel}
            disabled={sentinelLoading}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            <span>{sentinelLoading ? "Dispatching Alert..." : "Simulate T-20 Departure Alert"}</span>
          </button>
        </div>

        {/* Phone Mockup Frame & Notification Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Mobile Lock Screen Preview */}
          <div className="flex justify-center">
            <div className="w-[320px] bg-slate-950 rounded-[38px] border-4 border-slate-800 p-4 shadow-2xl relative">
              {/* Notch */}
              <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-4" />
              
              {/* Lock screen time */}
              <div className="text-center mb-6">
                <span className="text-4xl font-extralight text-white tracking-wider">08:00</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Push Notification Banner */}
              <div className="bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3.5 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-white tracking-wide">SaansAI Sentinel</span>
                  </div>
                  <span className="text-[10px] text-slate-500">now</span>
                </div>

                <p className="text-xs font-semibold text-emerald-400">
                  {latestAlert?.alert_title || "SaansAI Alert (T-20 Min): 08:20 Departure"}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  {latestAlert?.alert_message || "Spine Road PM2.5 is 34.7 µg/m³. Switch to 'Pradhikaran Green Corridor' to cut inhaled toxic burden by 20.4%."}
                </p>

                <div className="mt-3 flex gap-2">
                  <button className="flex-1 bg-emerald-500 text-slate-950 text-[10px] font-bold py-1.5 rounded-lg text-center">
                    Switch to Clean Route
                  </button>
                  <button className="px-2.5 bg-slate-800 text-slate-400 text-[10px] rounded-lg">
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Bottom bar indicator */}
              <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-8 mb-2" />
            </div>
          </div>

          {/* Right: Real Phone Instructions */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Live Testing on Your Actual Smartphone
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you click the button above, SaansAI dispatches this exact alert payload to the open-source <b>ntfy.sh</b> gateway.
            </p>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <span className="text-[11px] text-slate-400 block font-semibold">1. Open on your mobile phone:</span>
              <a
                href={`https://ntfy.sh/${ntfyTopic}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline font-mono text-xs block break-all"
              >
                https://ntfy.sh/{ntfyTopic}
              </a>
              <span className="text-[11px] text-slate-400 block font-semibold mt-2">2. Click "Subscribe"</span>
              <span className="text-[11px] text-slate-500 block">
                Anytime the alert triggers, a native system banner will pop up on your lock screen!
              </span>
            </div>

            {latestAlert && (
              <div className="text-[11px] text-slate-400 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Last dispatched successfully at {latestAlert.current_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
