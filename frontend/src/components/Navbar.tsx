"use client";

import React from "react";
import { Activity, MapPin, CalendarClock, Building2, Bell, Radio, ExternalLink } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serverOnline: boolean;
}

export default function Navbar({ activeTab, setActiveTab, serverOnline }: NavbarProps) {
  const tabs = [
    { id: "now", num: "01", label: "Exposure Telemetry", icon: Activity },
    { id: "map", num: "02", label: "Hyperlocal Grid", icon: MapPin },
    { id: "plan", num: "03", label: "Route & Sentinel", icon: CalendarClock },
    { id: "campus", num: "04", label: "Institutional ESG", icon: Building2 },
  ];

  return (
    <header className="border-b border-white/[0.08] bg-[#080c14]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Telemetry Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-white font-mono">
                  SAANSAI
                </span>
                <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-300">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight flex items-center gap-1">
                <span>PCCOE Campus • 18.6517°N, 73.7615°E</span>
              </p>
            </div>
          </div>

          {/* Precision Segmented Control */}
          <nav className="flex items-center bg-[#0d131f] p-1 rounded-xl border border-white/[0.08] shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/[0.1] text-white border border-white/[0.15] shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                  }`}
                >
                  <span className={`text-[10px] font-mono ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                    {tab.num}
                  </span>
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>

          {/* Engine & Alert Status */}
          <div className="hidden lg:flex items-center space-x-2.5">
            <div className="flex items-center space-x-2 text-xs bg-[#0d131f] border border-white/[0.08] px-3 py-1.5 rounded-lg font-mono">
              <span
                className={`h-2 w-2 rounded-full ${
                  serverOnline ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-rose-500"
                }`}
              />
              <span className="text-slate-300 text-[11px]">
                {serverOnline ? "ENGINE ACTIVE: 8000" : "ENGINE OFFLINE"}
              </span>
            </div>

            <a
              href="https://ntfy.sh/saansai-pccoe-alerts"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white transition bg-[#0d131f] border border-white/[0.08] hover:border-amber-500/40 px-3 py-1.5 rounded-lg font-mono group"
              title="Open real-time phone push alert stream"
            >
              <Bell className="h-3.5 w-3.5 text-amber-400 group-hover:animate-bounce" />
              <span>ntfy: alerts</span>
              <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-amber-400" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
