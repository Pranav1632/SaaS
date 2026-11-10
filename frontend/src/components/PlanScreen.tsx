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
  Zap,
  Route,
  Navigation,
  ExternalLink,
  ChevronRight,
  TrendingDown
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
  const [parserUsed, setParserUsed] = useState("google_gemini_2.5_flash");
  const [feedbackMsg, setFeedbackMsg] = useState("Neural LLM Ready: Google Gemini 2.5 Flash & Ollama");

  // Fetch route comparison
  const fetchRoutes = async (originKey: string) => {
    try {
      setLoadingRoutes(true);
      const res = await fetch(
        `${BACKEND_URL}/api/routes/compare?origin_key=${originKey}&activity=two_wheeler&vulnerability_group=respiratory`
      );
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
  const handleParseRoutine = async (textToParse?: string) => {
    const query = textToParse || userText;
    if (!query.trim()) return;
    try {
      setParsing(true);
      const res = await fetch(`${BACKEND_URL}/api/routine/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: query })
      });
      const data = await res.json();
      if (data.trips && data.trips.length > 0) {
        setTrips(data.trips);
      }
      if (data.parser_used) {
        setParserUsed(data.parser_used);
      }
      if (data.feedback_message) {
        setFeedbackMsg(data.feedback_message);
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

  const samplePrompts = [
    "I ride my two-wheeler to PCCOE college from Nigdi at 8:20 AM, and my brother with asthma jogs at 6:30 PM.",
    "Bus commute from Chinchwad Station to PCCOE Akurdi at 09:00 AM.",
    "Cycle ride around Ravet & PCCOE campus at 07:15 AM for a student with respiratory allergy."
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. Conversational Routine Architect */}
      <div className="bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Conversational Routine Architect (Neural LLM)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Natural language itinerary extraction. SaansAI automatically arms T-20 departure sentinels.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {parserUsed === "google_gemini_2.5_flash"
                  ? "AI Engine: Google Gemini 2.5 Flash (Active)"
                  : parserUsed === "ollama_local"
                  ? "AI Engine: Ollama Local LLM (Active)"
                  : "AI Engine: Deterministic Fallback"}
              </span>
            </span>
          </div>
        </div>

        {/* Dynamic AI Status Notification */}
        {feedbackMsg && (
          <div className="bg-[#080c14] border border-white/[0.06] px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{feedbackMsg}</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase">Live Model Response</span>
          </div>
        )}

        {/* Command-Palette Style Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleParseRoutine();
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="e.g. I leave home in Nigdi at 8:20 AM for PCCOE on my bike..."
              className="flex-1 bg-[#080c14] border border-white/[0.08] rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 shadow-inner"
            />
            <button
              type="submit"
              disabled={parsing}
              className="bg-emerald-500 hover:bg-emerald-400 text-[#06090e] px-5 py-3 rounded-xl font-bold font-mono text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 shrink-0"
            >
              {parsing ? (
                <Zap className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{parsing ? "Parsing..." : "Extract Itinerary"}</span>
            </button>
          </div>

          {/* Quick-Prompt Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Presets:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUserText(p);
                  handleParseRoutine(p);
                }}
                className="text-[11px] font-mono bg-[#080c14] hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg border border-white/[0.06] transition text-left truncate max-w-xs"
              >
                {p}
              </button>
            ))}
          </div>
        </form>

        {/* Extracted Waypoint Itinerary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {trips.map((t, idx) => (
            <div
              key={idx}
              className="bg-[#080c14] p-4 rounded-xl border border-white/[0.06] relative font-mono space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {t.title}
                </span>
                <span className="text-[10px] bg-white/[0.06] text-slate-300 px-2 py-0.5 rounded border border-white/[0.08]">
                  Departs: {t.departure_time}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1 font-sans">
                <p className="flex items-center gap-1.5 font-mono text-[11px]">
                  <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="text-white font-medium">{t.origin}</span>
                  <ArrowRight className="h-3 w-3 text-slate-500" />
                  <span className="text-white font-medium">{t.destination}</span>
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                  <span>Mode: <strong className="text-slate-200 capitalize">{t.travel_mode.replace("_", " ")}</strong></span>
                  <span>Profile: <strong className="text-amber-400 capitalize">{t.vulnerability_group}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Bell className="h-3.5 w-3.5" />
                  <span>T-20 Sentinel armed for <strong>{t.t_minus_alert_time}</strong></span>
                </span>
                <span className="text-[10px] text-slate-500">20 min prior</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Real Road Geometry Route Comparison (OSRM) */}
      <div className="bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Clean Air Corridor Comparison (OSRM Road Polyline Sampling)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Physiological dose comparison: Old Pune-Mumbai Highway vs Pradhikaran Green Corridor.
            </p>
          </div>

          <div className="flex gap-2 font-mono">
            <button
              onClick={() => setRouteOrigin("nigdi_to_pccoe")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                routeOrigin === "nigdi_to_pccoe"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 font-semibold"
                  : "bg-[#080c14] text-slate-400 border-white/[0.06] hover:text-slate-200"
              }`}
            >
              Nigdi ➔ PCCOE Campus
            </button>
            <button
              onClick={() => setRouteOrigin("pccoe_to_hinjewadi")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                routeOrigin === "pccoe_to_hinjewadi"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 font-semibold"
                  : "bg-[#080c14] text-slate-400 border-white/[0.06] hover:text-slate-200"
              }`}
            >
              PCCOE ➔ Hinjewadi IT Park
            </button>
          </div>
        </div>

        {/* Route Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono">
          {routeComparison?.routes?.map((r: any, idx: number) => {
            const isCleanest = r.route_id === routeComparison.cleanest_route_id;
            return (
              <div
                key={idx}
                className={`p-5 rounded-xl border transition-all ${
                  isCleanest
                    ? "bg-[#080c14] border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.06)]"
                    : "bg-[#080c14] border-white/[0.06]"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isCleanest ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {r.name}
                  </span>
                  {isCleanest && (
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Recommended Clean Choice
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-sans mb-4 leading-relaxed">{r.summary}</p>

                <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                  <div className="bg-[#0d131f] p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 block uppercase">Avg PM2.5</span>
                    <span className="text-base font-black text-white tabular-nums">{r.avg_pm25}</span>
                    <span className="text-[9px] text-slate-500 block">µg/m³</span>
                  </div>
                  <div className="bg-[#0d131f] p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 block uppercase">Travel Time</span>
                    <span className="text-base font-black text-slate-200 tabular-nums">
                      {r.duration_minutes}
                    </span>
                    <span className="text-[9px] text-slate-500 block">min</span>
                  </div>
                  <div className="bg-[#0d131f] p-2.5 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 block uppercase">Inhaled Dose</span>
                    <span
                      className={`text-base font-black tabular-nums ${
                        isCleanest ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {r.cumulative_inhaled_mass_ug}
                    </span>
                    <span className="text-[9px] text-slate-500 block">µg mass</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
                  <span>Distance: {r.distance_km} km</span>
                  <span className="font-semibold text-slate-300">Risk Tier: {r.risk_tier}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict Callout */}
        {routeComparison && (
          <div className="p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 flex items-start gap-3">
            <TrendingDown className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block font-mono">
                Trade-off Verdict: {routeComparison.exposure_reduction_pct}% Inhaled Dose Reduction
              </span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {routeComparison.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. T-20 Departure Sentinel & Real Phone Push Alert Simulator */}
      <div className="bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                T-20 Departure Sentinel & Mobile Phone Push Alert
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dispatches native system push notifications to your physical phone via ntfy.sh with interactive route switching.
            </p>
          </div>

          <button
            onClick={handleTriggerSentinel}
            disabled={sentinelLoading}
            className="bg-emerald-500 hover:bg-emerald-400 text-[#06090e] font-bold font-mono text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 shrink-0"
          >
            <Bell className="h-4 w-4" />
            <span>{sentinelLoading ? "Dispatching..." : "Simulate T-20 Departure Alert"}</span>
          </button>
        </div>

        {/* Lock Screen Simulation & Phone Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Mobile Lock Screen Preview */}
          <div className="flex justify-center">
            <div className="w-[310px] bg-[#06090e] rounded-[36px] border-4 border-slate-800 p-4 shadow-2xl relative font-sans">
              {/* Dynamic Island / Camera Notch */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-4" />

              {/* Lock Screen Clock */}
              <div className="text-center mb-6">
                <span className="text-4xl font-extralight text-white font-mono tracking-wider">
                  08:00
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric"
                  })}
                </span>
              </div>

              {/* Push Notification Banner */}
              <div className="bg-[#0f172a]/95 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-1.5 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-white tracking-wide">
                      SaansAI Sentinel
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">now</span>
                </div>

                <p className="text-xs font-semibold text-emerald-400 font-mono">
                  {latestAlert?.alert_title || "SaansAI Alert (T-20 Min): 08:20 Departure"}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  {latestAlert?.alert_message ||
                    "Spine Road PM2.5 is 34.7 µg/m³. Switch to 'Pradhikaran Green Corridor' to cut inhaled toxic burden by 20.4%."}
                </p>

                <div className="mt-3 flex gap-2 font-mono">
                  <button className="flex-1 bg-emerald-500 text-slate-950 text-[10px] font-bold py-1.5 rounded-lg text-center hover:bg-emerald-400 transition">
                    Switch to Clean Route
                  </button>
                  <button className="px-2.5 bg-slate-800 text-slate-400 text-[10px] rounded-lg">
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Home indicator bar */}
              <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-8 mb-1" />
            </div>
          </div>

          {/* Right: Actual Phone Subscription Console */}
          <div className="bg-[#080c14] p-5 rounded-xl border border-white/[0.06] space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Zap className="h-4 w-4 text-emerald-400" />
                Live Dispatch to Your Phone
              </h4>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Free • No API Key
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Clicking <strong>"Simulate T-20 Departure Alert"</strong> publishes instantly to the open-source <strong>ntfy.sh</strong> mobile push broker.
            </p>

            <div className="bg-[#0d131f] p-3.5 rounded-lg border border-white/[0.06] text-xs space-y-2">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                Subscribe in 1-Click:
              </span>
              <a
                href={`https://ntfy.sh/${ntfyTopic}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline text-xs flex items-center gap-1.5 break-all"
              >
                <span>https://ntfy.sh/{ntfyTopic}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              <span className="text-[11px] text-slate-400 block font-sans leading-relaxed pt-1">
                Install the <strong>ntfy app</strong> (Android/iOS) or open in mobile Chrome to receive real lock screen notifications with urgent priority.
              </span>
            </div>

            {latestAlert && (
              <div className="text-[11px] text-emerald-400 flex items-center gap-2 pt-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Dispatched successfully at {latestAlert.current_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
