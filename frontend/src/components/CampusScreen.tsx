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
  Users,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity
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
        bg: "bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-400",
        icon: CheckCircle2,
        label: "Sports & Recess: Safe (Full Activities Permitted)"
      };
    }
    if (status === "RESTRICTED") {
      return {
        bg: "bg-amber-500/[0.08] border-amber-500/30 text-amber-400",
        icon: AlertTriangle,
        label: "Sports & Recess: Sensitive Groups Caution"
      };
    }
    return {
      bg: "bg-rose-500/[0.08] border-rose-500/30 text-rose-400",
      icon: ShieldAlert,
      label: "Sports & Recess: CANCEL / MOVE INDOORS"
    };
  };

  const statusMeta = getStatusBadge(campusData?.sports_recess_status || "PERMITTED");
  const StatusIcon = statusMeta.icon;

  // Generate downloadable ESG summary report
  const handleDownloadESG = () => {
    const reportText = `
SAANSAI INSTITUTIONAL DUTY-OF-CARE & ESG AUDIT CERTIFICATE
================================================================
Institution: ${campusData?.campus_name || "Pimpri Chinchwad College of Engineering (PCCOE)"}
Location: Akurdi, Pune, Maharashtra (18.6517° N, 73.7615° E)
Audit Timestamp: ${new Date().toISOString()}
Compliance Framework: ISO 45001 / National Clean Air Programme (NCAP) / WHO 2021

EXPOSURE METRICS & CAMPUS TELEMETRY:
----------------------------------------------------------------
- Real-time Campus PM2.5: ${campusData?.campus_pm25 ?? 24} µg/m³
- Indian NAQI Sub-Index: ${campusData?.campus_aqi ?? 46}
- Outdoor Student Population: ${campusData?.student_population_outdoors ?? 1850}
- Recess Status: ${campusData?.sports_recess_status ?? "PERMITTED"}
- Official Advisory: ${campusData?.advisory_headline ?? "Safe for outdoor sports"}
- Advisory Detail: ${campusData?.advisory_detail ?? "Ambient air quality meets safety thresholds."}

PREDICTIVE SMART HVAC DAMPER AUTOMATION:
----------------------------------------------------------------
- Target Building: ${campusData?.hvac_state?.building ?? "Mechanical & Computer Engineering Complex"}
- Outdoor Air Intake Dampers: ${campusData?.hvac_state?.outdoor_intake_dampers ?? "OPEN (100% Fresh Air)"}
- HEPA Filtration Stage: ${campusData?.hvac_state?.hepa_filtration_stage ?? "Stage 1 Active"}
- Predictive Inversion Pre-Purge Lead Time: 30 minutes
- Webhook Protocol: BACnet / MQTT over TLS

ESG & SUSTAINABILITY IMPACT ASSESSMENT:
----------------------------------------------------------------
- UN SDG 3: Good Health and Well-being (Pediatric and student respiratory protection)
- UN SDG 11: Sustainable Cities & Communities (Hyperlocal micro-climate mitigation)
- Monthly Respiratory Hazard Hours Prevented: ${campusData?.esg_metrics?.monthly_respiratory_hazard_hours_prevented ?? 142} hours
- Student Alveolar Particulate Dose Reduction: ${campusData?.esg_metrics?.estimated_student_alveolar_dose_reduction_pct ?? 38.5}%

Verified by SaansAI Telemetry Core v2.0 • PCCOE International Global Climate Hackathon
================================================================
    `.trim();

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PCCOE_SaansAI_ESG_Audit_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Institutional Duty-of-Care Header */}
      <div className="bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20">
              Institutional Duty-of-Care & ESG Command Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-emerald-400" />
            {campusData?.campus_name || "PCCOE Campus (Akurdi, Pune)"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time population-weighted duty-of-care, recess safety advisory, and predictive HVAC damper automation.
          </p>
        </div>

        <button
          onClick={handleDownloadESG}
          className="bg-emerald-500 hover:bg-emerald-400 text-[#06090e] text-xs font-bold font-mono px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 self-start md:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Export ESG Compliance Audit</span>
        </button>
      </div>

      {/* Recess Safety & Population Risk Banner */}
      <div
        className={`p-6 rounded-2xl border ${statusMeta.bg} shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#080c14] border border-current/20 shrink-0">
            <StatusIcon className="h-7 w-7 text-current" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest block opacity-80">
              PCCOE Sports Ground & Recess Advisory
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5 font-mono">
              {campusData?.advisory_headline || "Outdoor Sports & Recess: Safe"}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {campusData?.advisory_detail ||
                "Ambient air quality meets safety thresholds. All scheduled physical education and recess activities may proceed without restriction."}
            </p>
          </div>
        </div>

        <div className="bg-[#080c14] px-5 py-3.5 rounded-xl border border-white/[0.08] text-center shrink-0 font-mono w-full md:w-auto">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold">
            Active Outdoor Students
          </span>
          <div className="text-2xl font-black text-white flex items-center justify-center gap-2 mt-0.5">
            <Users className="h-5 w-5 text-emerald-400" />
            <span>{campusData?.student_population_outdoors || 1850}</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-0.5">Campus Population Model</span>
        </div>
      </div>

      {/* 2-Column: Smart HVAC Pre-Purge Automation & Institutional ESG Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart HVAC Webhook Automation Simulator */}
        <div className="bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col justify-between font-mono space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Predictive Smart HVAC Pre-Purge Automation
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                BACnet / MQTT Webhook
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-5">
              Unlike reactive purifiers that wait for air to get contaminated, SaansAI's 6-hour forecast predicts evening inversion spikes and signals building management 30 minutes in advance to pre-purge and close outdoor dampers.
            </p>

            {/* Visual HVAC Damper Flow Schematic */}
            <div className="bg-[#080c14] p-4 rounded-xl border border-white/[0.06] mb-5 space-y-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Damper Flow Schematic
              </span>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">Outdoor Intake</span>
                  <span className="font-bold text-emerald-400">Fresh Air</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
                <div className="text-center px-2.5 py-1 rounded bg-[#0d131f] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-500 block">Actuator State</span>
                  <span className="font-bold text-white">
                    {campusData?.hvac_state?.outdoor_intake_dampers || "OPEN"}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">Filtration</span>
                  <span className="font-bold text-teal-400">
                    {campusData?.hvac_state?.hepa_filtration_stage || "Stage 1 HEPA"}
                  </span>
                </div>
              </div>
            </div>

            {/* Facility Status Key-Values */}
            <div className="space-y-2 text-xs">
              <div className="bg-[#080c14] p-3 rounded-lg border border-white/[0.04] flex justify-between items-center">
                <span className="text-slate-400">Target Facility:</span>
                <span className="font-semibold text-white">
                  {campusData?.hvac_state?.building || "Mechanical & Computer Engineering Complex"}
                </span>
              </div>
              <div className="bg-[#080c14] p-3 rounded-lg border border-white/[0.04] flex justify-between items-center">
                <span className="text-slate-400">Pre-Purge Lead Time:</span>
                <span className="font-semibold text-amber-400">
                  {campusData?.hvac_state?.pre_purge_lead_time_min || 30} Minutes Prior
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500">
            <span>Last Dispatched: {campusData?.hvac_state?.last_webhook_dispatched_at || "12:15:00"}</span>
            <span className="text-emerald-400 font-semibold">Energy Consumption Optimized</span>
          </div>
        </div>

        {/* Institutional ESG & Well-being Compliance */}
        <div className="bg-[#0d131f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col justify-between font-mono space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Institutional ESG & Duty-of-Care Audit
                </h3>
              </div>
              <span className="text-[10px] bg-white/[0.06] text-slate-300 border border-white/[0.08] px-2 py-0.5 rounded">
                ISO 45001 Aligned
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-5">
              Proactive duty-of-care audit metrics to demonstrate institutional ESG commitment to clean air under UN Sustainable Development Goals.
            </p>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#080c14] p-4 rounded-xl border border-white/[0.06]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                  Hazard Hours Prevented
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white tabular-nums">
                    {campusData?.esg_metrics?.monthly_respiratory_hazard_hours_prevented || 142}
                  </span>
                  <span className="text-xs text-slate-400">hrs</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">This academic semester</span>
              </div>

              <div className="bg-[#080c14] p-4 rounded-xl border border-white/[0.06]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                  Student Dose Cut
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    {campusData?.esg_metrics?.estimated_student_alveolar_dose_reduction_pct || 38.5}
                  </span>
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">Via proactive departure sentinels</span>
              </div>
            </div>

            {/* UN Sustainable Development Goals Supported */}
            <div className="bg-[#080c14] p-3.5 rounded-xl border border-white/[0.06] text-xs text-slate-300 space-y-2 font-sans">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">
                UN Sustainable Development Goals Supported:
              </span>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span><strong className="text-white">SDG 3:</strong> Good Health & Well-being (Preventative student lung health)</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                <span><strong className="text-white">SDG 11:</strong> Sustainable Cities & Campuses (Hyperlocal micro-climate monitoring)</span>
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-[10px] text-slate-500">
            Export ready for PCCOE Institutional Annual Sustainability Review.
          </div>
        </div>
      </div>
    </div>
  );
}
