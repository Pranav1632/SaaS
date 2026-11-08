"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import NowScreen from "@/components/NowScreen";
import MapScreen from "@/components/MapScreen";
import PlanScreen from "@/components/PlanScreen";
import CampusScreen from "@/components/CampusScreen";

export default function Home() {
  const [activeTab, setActiveTab] = useState("now");
  const [serverOnline, setServerOnline] = useState(false);

  // Ping backend health
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/health");
        if (res.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch (err) {
        setServerOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverOnline={serverOnline}
      />

      <main className="flex-1 pb-16">
        {activeTab === "now" && <NowScreen />}
        {activeTab === "map" && <MapScreen />}
        {activeTab === "plan" && <PlanScreen />}
        {activeTab === "campus" && <CampusScreen />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SaansAI v2 — PS-03 Personal Air-Quality Exposure & Action Guidance</span>
          <span>PCCOE Campus & Pune Region • SDGs 3, 11, 13</span>
        </div>
      </footer>
    </div>
  );
}
