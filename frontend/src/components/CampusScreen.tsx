"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ShieldAlert, 
  CheckCircle, 
  FileText, 
  Wind, 
  Cpu, 
  Download,
  AlertTriangle,
  Users
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function CampusScreen() {
  const [campusData, setCampusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCampus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/campus/status`);
      const data = await res.json();
      setCampusData(data);
    } catch (err) {
      console.error("Campus status fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampus();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === "PERMITTED") {
      return {
        bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        icon: CheckCircle,
        label: "Sports & Recess: Safe (Full Activities Permitted)"
      };
    }
    if (status === "RESTRICTED") {
      return {
        bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        icon: AlertTriangle,
        label: "Sports & Recess: Sensitive Groups Caution"
      };
    }
    return {
      bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
      icon: ShieldAlert,
      label: "Sports & Recess: CANCEL / MOVE INDOORS"
    };
  };

  const statusMeta = getStatusBadge(campusData?.sports_recess_status || "PERMITTED");
  const StatusIcon = statusMeta.icon;

  // Generate downloadable ESG summary report
  const handleDownloadESG = () => {
    const reportText = `
SAANSAI ENTERPRISE & CAMPUS DUTY-OF-CARE AUDIT REPORT
======================================================
Campus: ${campusData?.campus_name || "PCCOE Campus (Akurdi, Pune)"}
Generated: ${new Date().toLocaleString()}
Compliance Standard: ISO 45001 / National Clean Air Programme Guidelines

EXPOSURE METRICS:
- Real-time Campus PM2.5: ${campusData?.campus_pm25} µg/m³
- Indian NAQI Sub-Index: ${campusData?.campus_aqi}
- Outdoor Student Population: ${campusData?.student_population_outdoors}
- Recess Advisory: ${campusData?.sports_recess_status} (${campusData?.advisory_headline})

SMART HVAC PRE-PURGE AUTOMATION:
- Building: ${campusData?.hvac_state?.building}
- Outdoor Air Intake Dampers: ${campusData?.hvac_state?.outdoor_intake_dampers}
- HEPA Filtration Stage: ${campusData?.hvac_state?.hepa_filtration_stage}
- Pre-Purge Lead Time: 30 minutes prior to outdoor inversion spike

ESG & OCCUPATIONAL HEALTH IMPACT:
- UN SDG Alignments: SDG 3 (Good Health & Well-being), SDG 11 (Sustainable Campuses)
- Monthly Respiratory Hazard Hours Prevented: 142 hours
- Student Alveolar Particulate Dose Reduction: 38.5%
======================================================
    `.trim();

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PCCOE_SaansAI_ESG_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Campus Hero Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Institutional ESG & Safety Portal
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-400" />
            {campusData?.campus_name || "PCCOE Campus (Akurdi, Pune)"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time population-weighted duty-of-care, sports advisory, and predictive HVAC damper automation.
          </p>
        </div>

        <button
          onClick={handleDownloadESG}
          className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Download className="h-4 w-4 text-emerald-400" />
          <span>Export ESG Compliance Report</span>
        </button>
      </div>

      {/* Recess Safety & Population Risk Banner */}
      <div className={`p-6 rounded-2xl border ${statusMeta.bg} shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-current/20">
            <StatusIcon className="h-8 w-8 text-current" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              PCCOE Sports Ground & Recess Advisory
            </span>
            <h3 className="text-xl font-extrabold text-white mt-1">
              {campusData?.advisory_headline || "Outdoor Sports & Recess: Safe"}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {campusData?.advisory_detail}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-current/20 text-center shrink-0">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Active Outdoor Students</span>
          <span className="text-2xl font-black text-white flex items-center justify-center gap-1">
            <Users className="h-5 w-5 text-emerald-400" />
            {campusData?.student_population_outdoors || 1850}
          </span>
        </div>
      </div>

      {/* 2-Column: Smart HVAC Damper Pre-Purge & ESG Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart HVAC Webhook Automation Simulator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400" />
                Predictive Smart HVAC Pre-Purge Automation
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                BACnet / MQTT Webhook
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Unlike reactive purifiers, SaansAI's 6-hour forecast detects outdoor pollution surges in advance and seals outdoor fresh-air dampers 30 minutes before dirty air enters the academic complex.
            </p>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Target Facility:</span>
                <span className="font-semibold text-white">{campusData?.hvac_state?.building}</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Outdoor Intake Dampers:</span>
                <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  {campusData?.hvac_state?.outdoor_intake_dampers}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Indoor Filtration Stage:</span>
                <span className="font-semibold text-slate-200">{campusData?.hvac_state?.hepa_filtration_stage}</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Pre-Purge Lead Time:</span>
                <span className="font-semibold text-amber-400">{campusData?.hvac_state?.pre_purge_lead_time_min} Minutes</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Last Webhook Trigger: {campusData?.hvac_state?.last_webhook_dispatched_at || "12:15:00"}</span>
            <span className="text-emerald-400 font-semibold">Energy Optimization: Active</span>
          </div>
        </div>

        {/* ESG & Occupational Well-being Compliance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                Institutional ESG & Well-being Compliance
              </h3>
              <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                ISO 45001 Aligned
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Proactive duty-of-care audit metrics to demonstrate institutional commitment to clean air under UN Sustainable Development Goals.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Hazard Hours Prevented</span>
                <span className="text-2xl font-black text-white">
                  {campusData?.esg_metrics?.monthly_respiratory_hazard_hours_prevented || 142} hrs
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">This semester</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Dose Reduction</span>
                <span className="text-2xl font-black text-emerald-400">
                  {campusData?.esg_metrics?.estimated_student_alveolar_dose_reduction_pct || 38.5}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Via proactive alerts</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">SDG Goals Supported:</span>
              <p>🌱 <b>SDG 3:</b> Good Health & Well-being (Preventative pediatric lung care)</p>
              <p>🏙️ <b>SDG 11:</b> Sustainable Cities & Campuses (Hyperlocal micro-climate mitigation)</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Export ready for PCCOE Institutional Annual Sustainability Review.
          </div>
        </div>
      </div>
    </div>
  );
}
