"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Info, Layers, RefreshCw, AlertCircle } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function MapScreen() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [stations, setStations] = useState<any[]>([]);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [crowdReports, setCrowdReports] = useState<any[]>([]);
  const [inspectedPoint, setInspectedPoint] = useState<any>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);

  // Fetch stations, traffic, and crowd reports
  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const [stRes, trRes, crRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/stations`).then(r => r.json()),
          fetch(`${BACKEND_URL}/api/traffic`).then(r => r.json()),
          fetch(`${BACKEND_URL}/api/crowd-reports`).then(r => r.json())
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

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically load leaflet
    import("leaflet").then((L) => {
      if (mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current!).setView([18.6450, 73.7750], 13);
      mapInstanceRef.current = map;

      // Official OpenStreetMap tiles (100% free, no API key, no watermark)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        subdomains: ["a", "b", "c"],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | SaansAI v2 PCCOE',
        maxZoom: 19
      }).addTo(map);

      // Map Click Handler: Click-to-inspect micro-zone
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        setLoadingInspection(true);
        try {
          const res = await fetch(`${BACKEND_URL}/api/concentration?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`);
          const data = await res.json();
          setInspectedPoint(data);

          // Add a temporary inspection circle/marker
          L.circleMarker([lat, lng], {
            radius: 8,
            color: "#10b981",
            fillColor: "#059669",
            fillOpacity: 0.8
          }).addTo(map).bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; font-size: 12px;">
              <b>Micro-Zone Reading</b><br/>
              PM2.5: <b>${data.pm25} µg/m³</b> (AQI: ${data.aqi})<br/>
              Confidence: <b>${data.confidence_pct}%</b>
            </div>
          `).openPopup();
        } catch (err) {
          console.error("Inspection error:", err);
        } finally {
          setLoadingInspection(false);
        }
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || stations.length === 0) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;

      // Add Station Pins
      stations.forEach((st) => {
        const isCampus = st.station_id === "pccoe_campus_01";
        const color = isCampus ? "#10b981" : (st.aqi <= 50 ? "#34d399" : (st.aqi <= 100 ? "#facc15" : "#f87171"));

        const circle = L.circleMarker([st.lat, st.lon], {
          radius: isCampus ? 12 : 9,
          color: "#ffffff",
          weight: 2,
          fillColor: color,
          fillOpacity: 0.9
        }).addTo(map);

        circle.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; padding: 4px;">
            <b style="font-size: 13px;">${st.name}</b><br/>
            <span style="font-size: 11px; color: #64748b;">${st.source_type}</span><br/>
            <hr style="margin: 6px 0; border: none; border-top: 1px solid #cbd5e1;"/>
            PM2.5: <b>${st.pm25} µg/m³</b> | PM10: <b>${st.pm10} µg</b><br/>
            Indian NAQI: <b style="color: ${color}; font-size: 14px;">${st.aqi}</b>
          </div>
        `);
      });

      // Add Traffic Hotspots
      traffic.forEach((tr) => {
        L.circleMarker([tr.lat, tr.lon], {
          radius: 7,
          color: "#f59e0b",
          fillColor: "#d97706",
          fillOpacity: 0.75
        }).addTo(map).bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; font-size: 11px;">
            <b>🚦 Traffic Hotspot: ${tr.name}</b><br/>
            Speed: <b>${tr.current_speed_kmh} km/h</b> (Free: ${tr.free_flow_speed_kmh} km/h)<br/>
            Congestion Ratio: <b>${(tr.congestion_ratio * 100).toFixed(0)}%</b>
          </div>
        `);
      });
    });
  }, [stations, traffic]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-400" />
            Hyperlocal Micro-Zone Map (Pune & PCMC)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Click anywhere on the map to trigger on-the-fly two-stage spatial concentration estimation.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500 border border-white/50" />
            <span className="text-slate-300">PCCOE Campus Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="text-slate-300">CPCB Official Monitor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-slate-300">Traffic Congestion</span>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaflet Map Frame */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[550px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Quick Notice Overlay */}
          <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2 shadow-lg">
            <Info className="h-4 w-4 text-emerald-400" />
            <span>Click any coordinate to inspect micro-zone particulate density.</span>
          </div>
        </div>

        {/* Click-To-Inspect Sidebar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              Micro-Zone Inspector
            </h3>

            {loadingInspection ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400 mb-2" />
                <span className="text-xs">Computing Stage 1 Physics...</span>
              </div>
            ) : inspectedPoint ? (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1">Target Coordinates</span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    {inspectedPoint.lat.toFixed(4)}° N, {inspectedPoint.lon.toFixed(4)}° E
                  </span>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">PM2.5</span>
                      <span className="text-2xl font-black text-white">{inspectedPoint.pm25}</span>
                      <span className="text-[10px] text-slate-500"> µg/m³</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Indian NAQI</span>
                      <span className="text-2xl font-black text-emerald-400">{inspectedPoint.aqi}</span>
                      <span className="text-[10px] text-slate-500"> Sub-Index</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
                    <span>Nearest Sensor:</span>
                    <span className="text-slate-200 font-semibold">{inspectedPoint.nearest_station_km} km</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Model Confidence:</span>
                    <span className="text-emerald-400 font-semibold">{inspectedPoint.confidence_pct}%</span>
                  </div>
                </div>

                {/* Source Percentage Breakdown */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2">Local Source Contributions</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Road Traffic:</span>
                      <span className="font-semibold text-emerald-400">{inspectedPoint.source_percentages.traffic}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Industrial Plumes:</span>
                      <span className="font-semibold text-amber-400">{inspectedPoint.source_percentages.industry}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dust & Construction:</span>
                      <span className="font-semibold text-orange-400">{inspectedPoint.source_percentages.construction}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Regional Background:</span>
                      <span className="font-semibold text-slate-300">{inspectedPoint.source_percentages.background}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                Click on any street, chowk, or park in the map to view instant hyperlocal readings.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500">
            Powered by Open-Meteo live feeds + SciPy cKDTree spatial index.
          </div>
        </div>
      </div>
    </div>
  );
}
