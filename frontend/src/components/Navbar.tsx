"use client";

import React from "react";
import { Wind, MapPin, ShieldAlert, CalendarClock, Building2, Bell } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serverOnline: boolean;
}

export default function Navbar({ activeTab, setActiveTab, serverOnline }: NavbarProps) {
  const tabs = [
    { id: "now", label: "Now (Exposure)", icon: Wind },
    { id: "map", label: "Hyperlocal Map", icon: MapPin },
    { id: "plan", label: "Plan (Routes & Routine)", icon: CalendarClock },
    { id: "campus", label: "Campus Duty-of-Care", icon: Building2 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wind className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                  SaansAI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-400" />
                PCCOE Campus & Pune Region
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 shadow-md font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>

          {/* Live Status Badge */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className={`h-2 w-2 rounded-full ${serverOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
              <span className="text-slate-300 font-medium">
                {serverOnline ? "FastAPI Live (Port 8000)" : "Backend Offline"}
              </span>
            </div>
            <a
              href="https://ntfy.sh/saansai-pccoe-alerts"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition bg-slate-900/50 border border-slate-800 px-2.5 py-1.5 rounded-lg"
              title="Subscribe to real phone push alerts"
            >
              <Bell className="h-3.5 w-3.5 text-amber-400" />
              <span>ntfy.sh</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
