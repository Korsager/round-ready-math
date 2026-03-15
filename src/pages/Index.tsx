import React, { useState } from "react";
import {
  Mail, Bell, ChevronDown, ArrowUpRight, Heart, Droplets,
  Pill, Calendar, RefreshCw, ZoomIn, ZoomOut, Check,
  Share2, Brain, Wind, Flower2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import heartImg from "@/assets/heart-3d.png";
import avatarImg from "@/assets/avatar-olivia.png";

const tabs = ["Dashboard", "Vitals", "Lab Results", "Medication", "Reports"];

const bpData = [
  { day: "Mon", sys: 125 }, { day: "Tue", sys: 130 },
  { day: "Wed", sys: 128 }, { day: "Thu", sys: 135 },
  { day: "Fri", sys: 130 }, { day: "Sat", sys: 127 },
  { day: "Sun", sys: 132 },
];

const calDays = [
  { label: "Sun", num: 18 }, { label: "Mon", num: 19 },
  { label: "Tue", num: 20 }, { label: "Wed", num: 21, active: true },
  { label: "Thu", num: 22 }, { label: "Fri", num: 23 },
  { label: "Sat", num: 24 },
];

const organs = [
  { icon: Wind, color: "bg-primary/10 text-primary", label: "Lungs" },
  { icon: Heart, color: "bg-red-50 text-red-500", label: "Heart" },
  { icon: Brain, color: "bg-purple-50 text-purple-500", label: "Brain" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Flower2 className="text-primary" size={22} />
            <span className="text-lg font-bold text-foreground tracking-tight">Sellution</span>
          </div>

          {/* Tabs - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === t
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground">
              <Mail size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <img src={avatarImg} alt="Olivia" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">Olivia Carter</p>
                <p className="text-xs text-muted-foreground">@oll.carter</p>
              </div>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden overflow-x-auto px-4 pb-2 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === t
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Greeting */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Hey, Olivia! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Let's monitor your health today</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Heart + Efficiency */}
          <div className="lg:col-span-5 space-y-6">
            {/* Heart illustration */}
            <div className="relative flex justify-center animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <img
                src={heartImg}
                alt="3D Anatomical Heart"
                className="w-64 sm:w-80 lg:w-96 drop-shadow-2xl animate-pulse-gentle"
              />
            </div>

            {/* Heart Function Efficiency */}
            <div
              className="bg-card rounded-2xl border border-border p-5 shadow-md hover:shadow-lg transition-shadow animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Heart Function Efficiency</h3>
                <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl font-bold text-foreground tabular-nums">86%</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  Moderate
                </span>
              </div>
              <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 animate-progress-fill"
                  style={{ width: "86%" }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>0%</span><span>100%</span>
              </div>
            </div>

            {/* Organ quick views */}
            <div className="flex gap-3 animate-fade-up" style={{ animationDelay: "0.25s" }}>
              {organs.map((o) => (
                <button
                  key={o.label}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border border-border bg-card hover:shadow-md transition-all hover:scale-[1.03] ${o.color}`}
                >
                  <o.icon size={28} />
                  <span className="text-xs font-medium text-foreground">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center column: Blood Pressure */}
          <div className="lg:col-span-4 space-y-6">
            {/* Blood Pressure Card */}
            <div
              className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-lg animate-fade-up"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium opacity-90">Blood Pressure</h3>
                <div className="flex gap-1">
                  <button className="p-1 rounded-md hover:bg-white/20 transition-colors"><ZoomIn size={14} /></button>
                  <button className="p-1 rounded-md hover:bg-white/20 transition-colors"><ZoomOut size={14} /></button>
                  <button className="p-1 rounded-md hover:bg-white/20 transition-colors"><RefreshCw size={14} /></button>
                  <button className="p-1 rounded-md hover:bg-white/20 transition-colors"><Calendar size={14} /></button>
                </div>
              </div>
              <p className="text-4xl font-bold mb-1">130/82</p>
              <p className="text-xs opacity-75 mb-4">mmHg · Slightly Elevated</p>

              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bpData} barCategoryGap="25%">
                    <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[100, 140]} />
                    <Bar dataKey="sys" radius={[6, 6, 0, 0]}>
                      {bpData.map((_, i) => (
                        <Cell key={i} fill={i === 3 ? "#ffffff" : "rgba(255,255,255,0.4)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* HRV bubble */}
              <div className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Heart size={13} />
                <span className="text-xs font-medium">HRV 84 ms</span>
                <span className="text-[10px] bg-emerald-400/30 text-emerald-100 px-1.5 py-0.5 rounded-full font-medium">Stable ↑</span>
              </div>
            </div>

            {/* Vitals Quick Stats */}
            <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-red-50">
                        <Heart size={16} className="text-red-500" />
                      </div>
                      <span className="text-xs text-muted-foreground">Heart Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">112</p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Normal resting heart rate: 60-100 bpm. Yours is slightly elevated.</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-blue-50">
                        <Droplets size={16} className="text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Glucose</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">9.0</p>
                    <p className="text-xs text-muted-foreground">mmol/L</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Normal fasting glucose: 4.0-5.4 mmol/L. Yours is elevated.</TooltipContent>
              </Tooltip>
            </div>

            {/* Medication Reminder */}
            <div
              className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 hover:shadow-md transition-shadow animate-fade-up"
              style={{ animationDelay: "0.35s" }}
            >
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Pill size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Medication Reminder</p>
                <p className="text-xs text-muted-foreground truncate">Take antihypertensive at 5:00 PM</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0">
                Done
              </button>
            </div>
          </div>

          {/* Right column: Profile + Appointments */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <div
              className="bg-card rounded-2xl border border-border p-5 text-center hover:shadow-md transition-shadow animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <img src={avatarImg} alt="Olivia" className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-primary/10 mb-3" />
              <h3 className="text-base font-semibold text-foreground">Olivia Carter</h3>
              <p className="text-xs text-muted-foreground mb-3">27 years old</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-xs font-medium text-amber-700">Mild Hypertension</span>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              <h3 className="text-base font-semibold text-foreground mb-4">Upcoming Appointments</h3>

              {/* Calendar strip */}
              <div className="flex gap-1 mb-4">
                {calDays.map((d) => (
                  <div
                    key={d.num}
                    className={`flex-1 text-center py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      d.active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="text-[10px] opacity-75">{d.label}</div>
                    <div className="font-bold">{d.num}</div>
                  </div>
                ))}
              </div>

              {/* Appointment */}
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">May 21st, 2025</p>
                <p className="text-sm font-semibold text-foreground">Dr. Sophia Bennett</p>
                <p className="text-xs text-muted-foreground mb-2">Cardiologist · 03:30 – 04:00 PM</p>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors">
                    <Check size={12} /> Confirm
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    <Mail size={13} />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    <Share2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Sellution Health Dashboard — For informational purposes only.
      </footer>
    </div>
  );
};

export default Index;
