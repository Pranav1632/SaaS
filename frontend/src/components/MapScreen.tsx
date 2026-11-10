"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Info, 
  Layers, 
  RefreshCw, 
  Crosshair, 
  ShieldCheck, 
  AlertTriangle,
  Radio,
  Zap,
  Navigation
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

// Robust Leaflet accessor that avoids Webpack RSC chunk crash in Next.js 15
const getLeaflet = async () => {
  if (typeof window === "undefined") return null;
  if ((window as any).L) return (window as any).L;
  try {
    const mod = await import("leaflet");
    return (mod as any).default || mod;
  } catch (e) {
    return (window as any).L || null;
  }
};

export default function MapScreen() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [stations, setStations] = useState<any[]>([]);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [crowdReports, setCrowdReports] = useState<any[]>([]);
  const [inspectedPoint, setInspectedPoint] = useState<any>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Fetch stations, traffic, and crowd reports
  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const [stRes, trRes, crRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/stations`).then((r) => r.json()),
          fetch(`${BACKEND_URL}/api/traffic`).then((r) => r.json()),
          fetch(`${BACKEND_URL}/api/crowd-reports`).then((r) => r.json())
        ]);
        setStations(stRes || []);
        setTraffic(trRes || []);
        setCrowdReports(crRes || []);
      } catch (err) {
        console.error("Layer fetch error:", err);
      }
    };
    fetchLayers();
  }, []);

  // Initialize Leaflet Map safely with window.L
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    let isMounted = true;

    getLeaflet().then((L) => {
      if (!L || !isMounted || !mapContainerRef.current) return;

      // Avoid re-initialization if map already exists
      if (mapInstanceRef.current) return;

      // Reset any stray leaflet ID if container was re-used during HMR
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      try {
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([18.6450, 73.7750], 13);
        mapInstanceRef.current = map;

        // High-contrast clean OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          subdomains: ["a", "b", "c"],
          maxZoom: 19
        }).addTo(map);

        // Layer group for dynamic markers
        const markerGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markerGroup;
        setMapReady(true);

        // Map Click Handler: Click-to-inspect micro-zone
        map.on("click", async (e: any) => {
          const { lat, lng } = e.latlng;
          setLoadingInspection(true);
          try {
            const res = await fetch(
              `${BACKEND_URL}/api/concentration?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`
            );
            const data = await res.json();
            setInspectedPoint(data);

            // Add inspection pin to map
            L.circleMarker([lat, lng], {
              radius: 8,
              color: "#10b981",
              weight: 2,
              fillColor: "#059669",
              fillOpacity: 0.9
            })
              .addTo(map)
              .bindPopup(`
                <div style="font-family: monospace; font-size: 11px; padding: 2px;">
                  <div style="color: #10b981; font-weight: bold; margin-bottom: 2px;">MICRO-ZONE PROBE</div>
                  <div style="color: #cbd5e1;">Coord: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
                  <div style="color: #f8fafc; font-size: 13px; font-weight: 800; margin: 4px 0;">PM2.5: ${data.pm25} µg/m³ (NAQI: ${data.aqi})</div>
                  <div style="color: #94a3b8; font-size: 10px;">Confidence: ${data.confidence_pct}% • Nearest: ${data.nearest_station_km}km</div>
                </div>
              `)
              .openPopup();
          } catch (err) {
            console.error("Inspection error:", err);
          } finally {
            setLoadingInspection(false);
          }
        });
      } catch (err) {
        console.error("Leaflet init error:", err);
      }
    });

    return () => {
      isMounted = false;
      setMapReady(false);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers on Leaflet Map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current || stations.length === 0) return;

    getLeaflet().then((L) => {
      if (!L) return;
      const group = markersLayerRef.current;
      if (!group) return;
      group.clearLayers();

      // Add Station Pins
      stations.forEach((st) => {
        const isCampus = st.station_id === "pccoe_campus_01";
        const color = isCampus
          ? "#10b981"
          : st.aqi <= 50
          ? "#34d399"
          : st.aqi <= 100
          ? "#facc15"
          : "#f87171";

        const circle = L.circleMarker([st.lat, st.lon], {
          radius: isCampus ? 13 : 9,
          color: isCampus ? "#ffffff" : color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95
        });

        circle.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <div style="color: ${color}; font-weight: bold; font-size: 12px;">${st.name}</div>
            <div style="color: #94a3b8; font-size: 10px; text-transform: uppercase;">${st.source_type}</div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 6px 0;"></div>
            <div style="color: #f8fafc; font-size: 13px; font-weight: 800;">PM2.5: ${st.pm25} µg/m³</div>
            <div style="color: #94a3b8;">PM10: ${st.pm10} µg • NAQI: <span style="color:${color}; font-weight:bold;">${st.aqi}</span></div>
          </div>
        `);

        group.addLayer(circle);
      });

      // Add Traffic Congestion Points
      traffic.forEach((tr) => {
        const tCircle = L.circleMarker([tr.lat, tr.lon], {
          radius: 7,
          color: "#f59e0b",
          weight: 1.5,
          fillColor: "#d97706",
          fillOpacity: 0.85
        });

        tCircle.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <div style="color: #f59e0b; font-weight: bold;">TRAFFIC NODE: ${tr.name}</div>
            <div style="color: #cbd5e1; margin-top: 2px;">Speed: ${tr.current_speed_kmh} km/h (Free: ${tr.free_flow_speed_kmh} km/h)</div>
            <div style="color: #94a3b8;">Congestion Ratio: ${(tr.congestion_ratio * 100).toFixed(0)}%</div>
          </div>
        `);

        group.addLayer(tCircle);
      });

      // Add Crowd Dust / Roadwork Reports
      crowdReports.forEach((cr) => {
        const cMarker = L.circleMarker([cr.lat, cr.lon], {
          radius: 7,
          color: "#f97316",
          weight: 1.5,
          fillColor: "#ea580c",
          fillOpacity: 0.85
        });

        cMarker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <div style="color: #f97316; font-weight: bold;">CROWD INCIDENT</div>
            <div style="color: #cbd5e1; margin-top: 2px;">${cr.incident_type}: ${cr.description}</div>
            <div style="color: #94a3b8;">Severity: ${cr.severity} • ${cr.reporter_role}</div>
          </div>
        `);

        group.addLayer(cMarker);
      });
    });
  }, [mapReady, stations, traffic, crowdReports]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Telemetry Header & Layer Legend */}
      <div className="bg-[#0d131f] border border-white/[0.08] p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Hyperlocal Spatial Grid (Pune & PCMC Dispersion Mesh)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real road network geometry, localized industrial plumes, and click-to-probe micro-zone concentration.
          </p>
        </div>

        {/* Precision Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 bg-[#080c14] border border-white/[0.06] px-2.5 py-1 rounded-lg">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span className="text-slate-200">PCCOE Campus Node</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#080c14] border border-white/[0.06] px-2.5 py-1 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            <span className="text-slate-300">CPCB Monitor</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#080c14] border border-white/[0.06] px-2.5 py-1 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-slate-300">Traffic Node</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#080c14] border border-white/[0.06] px-2.5 py-1 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-slate-300">Dust Report</span>
          </div>
        </div>
      </div>

      {/* Main Map & Telemetry Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map Frame */}
        <div className="lg:col-span-8 bg-[#06090e] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl h-[580px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Interactive Probe Overlay */}
          <div className="absolute bottom-4 left-4 z-20 bg-[#0d131f]/90 backdrop-blur-md border border-white/[0.1] px-3.5 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2.5 shadow-xl font-mono">
            <Crosshair className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>Click any coordinate in Pune/PCMC to probe micro-zone concentration.</span>
          </div>
        </div>

        {/* Click-To-Inspect Telemetry Console */}
        <div className="lg:col-span-4 bg-[#0d131f] border border-white/[0.08] rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                Micro-Zone Inspector
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Stage 1 + 2
              </span>
            </div>

            {loadingInspection ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-mono">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400 mb-3" />
                <span className="text-xs">Computing Two-Stage Physics...</span>
                <span className="text-[10px] text-slate-500 mt-1">Dispersion & IDW residual correction</span>
              </div>
            ) : inspectedPoint ? (
              <div className="space-y-4 font-mono">
                {/* Coordinates & Primary Metric */}
                <div className="bg-[#080c14] p-4 rounded-xl border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">
                    Target Coordinate
                  </span>
                  <span className="text-xs text-emerald-400 font-bold block">
                    {inspectedPoint.lat.toFixed(4)}° N, {inspectedPoint.lon.toFixed(4)}° E
                  </span>

                  <div className="mt-3.5 grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">PM2.5 Mass</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-white tabular-nums">
                          {inspectedPoint.pm25}
                        </span>
                        <span className="text-[10px] text-slate-400">µg/m³</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Indian NAQI</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-emerald-400 tabular-nums">
                          {inspectedPoint.aqi}
                        </span>
                        <span className="text-[10px] text-slate-400">Index</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-[11px] text-slate-400">
                    <span>Nearest Reference Station:</span>
                    <span className="text-white font-semibold">{inspectedPoint.nearest_station_km} km</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Model Confidence Score:</span>
                    <span className="text-emerald-400 font-semibold">{inspectedPoint.confidence_pct}%</span>
                  </div>
                </div>

                {/* Local Source Contribution Breakdown */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Attributed Source Contributions
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between bg-[#080c14] px-3 py-2 rounded-lg border border-white/[0.04]">
                      <span className="text-slate-400">Road Traffic:</span>
                      <span className="font-bold text-emerald-400">
                        {inspectedPoint.source_percentages?.traffic ?? 0}%
                      </span>
                    </div>
                    <div className="flex justify-between bg-[#080c14] px-3 py-2 rounded-lg border border-white/[0.04]">
                      <span className="text-slate-400">Industrial Plumes:</span>
                      <span className="font-bold text-amber-400">
                        {inspectedPoint.source_percentages?.industry ?? 0}%
                      </span>
                    </div>
                    <div className="flex justify-between bg-[#080c14] px-3 py-2 rounded-lg border border-white/[0.04]">
                      <span className="text-slate-400">Dust & Construction:</span>
                      <span className="font-bold text-orange-400">
                        {inspectedPoint.source_percentages?.construction ?? 0}%
                      </span>
                    </div>
                    <div className="flex justify-between bg-[#080c14] px-3 py-2 rounded-lg border border-white/[0.04]">
                      <span className="text-slate-400">Regional Background:</span>
                      <span className="font-bold text-slate-300">
                        {inspectedPoint.source_percentages?.background ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500 text-xs font-mono">
                Click any street, campus building, or intersection on the map to inspect real-time physics readings.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Spatial Mesh: SciPy cKDTree</span>
            <span className="text-emerald-400">Live Pune CAMS Feeds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
