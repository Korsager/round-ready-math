import React, { useState } from "react";
import {
  Mail, Bell, ChevronDown, ArrowUpRight, TrendingUp, DollarSign,
  PieChart, Settings, Calendar, RefreshCw, ZoomIn, ZoomOut, Check,
  Share2, Rocket, BarChart3, Target
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell,
  PieChart as RPieChart, Pie, Tooltip as ReTooltip
} from "recharts";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import rocketImg from "@/assets/rocket-launch.png";
import avatarImg from "@/assets/avatar-alex.png";

const tabs = ["Dashboard", "Valuation", "Dilution", "IRR/MOIC", "Scenarios", "Reports"];

const ownershipData = [
  { name: "Founders", value: 80, fill: "hsl(217, 91%, 60%)" },
  { name: "Investors", value: 20, fill: "hsl(160, 84%, 39%)" },
];

const roundHistory = [
  { round: "Pre-Seed", val: 2 },
  { round: "Seed", val: 5 },
  { round: "Series A", val: 10 },
  { round: "Series B", val: 25 },
  { round: "Series C", val: 60 },
];

const quarters = [
  { label: "Q1", year: "2026" },
  { label: "Q2", year: "2026", active: true },
  { label: "Q3", year: "2026" },
  { label: "Q4", year: "2026" },
];

const deepDives = [
  { icon: BarChart3, color: "bg-primary/10 text-primary", label: "Valuation" },
  { icon: PieChart, color: "bg-emerald-50 text-emerald-600", label: "Dilution" },
  { icon: Target, color: "bg-purple-50 text-purple-500", label: "IRR Grid" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Rocket className="text-primary" size={22} />
            <span className="text-lg font-bold text-foreground tracking-tight">Fundraise Math</span>
          </div>

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

          <div className="flex items-center gap-3 shrink-0">
            <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground">
              <Mail size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <img src={avatarImg} alt="Alex" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">Alex Founder</p>
                <p className="text-xs text-muted-foreground">@alexstartup</p>
              </div>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>

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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Greeting */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Hey, Alex! 🚀
          </h1>
          <p className="text-muted-foreground mt-1">
            Know your valuation, dilution, required exit & IRR in real time
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Illustration + Round Efficiency */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative flex justify-center animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <img
                src={rocketImg}
                alt="Growth & Fundraising"
                className="w-64 sm:w-80 lg:w-96 drop-shadow-2xl animate-pulse-gentle"
              />
            </div>

            {/* Round Efficiency Score */}
            <div
              className="bg-card rounded-2xl border border-border p-5 shadow-md hover:shadow-lg transition-shadow animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Round Efficiency Score</h3>
                <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl font-bold text-foreground tabular-nums">78%</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  Solid
                </span>
              </div>
              <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 animate-progress-fill"
                  style={{ width: "78%" }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>0%</span><span>100%</span>
              </div>
            </div>

            {/* Deep-dive icons */}
            <div className="flex gap-3 animate-fade-up" style={{ animationDelay: "0.25s" }}>
              {deepDives.map((d) => (
                <button
                  key={d.label}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border border-border bg-card hover:shadow-md transition-all hover:scale-[1.03] ${d.color}`}
                >
                  <d.icon size={28} />
                  <span className="text-xs font-medium text-foreground">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center: Post-Money + Quick Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Post-Money Valuation Card */}
            <div
              className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-lg animate-fade-up"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium opacity-90">Post-Money Valuation & Dilution</h3>
                <div className="flex gap-1">
                  <button className="p-1 rounded-md hover:bg-white/20 transition-colors"><ZoomIn size={14} /></button>
                  <button className="p-1 rounded-md hover:bg-white/20 transition-colors"><ZoomOut size={14} /></button>
                  <button className="p-1 rounded-md hover:bg-white/20 transition-colors"><RefreshCw size={14} /></button>
                  <button className="p-1 rounded-md hover:bg-white/20 transition-colors"><Calendar size={14} /></button>
                </div>
              </div>
              <p className="text-4xl font-bold mb-1">$10M</p>
              <p className="text-xs opacity-75 mb-4">Post-Money · 20% Investor Ownership</p>

              {/* Ownership Pie */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-28 h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie
                        data={ownershipData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        strokeWidth={0}
                      />
                      <ReTooltip
                        contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                      />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/60" />
                    <span className="text-xs opacity-80">Founders 80%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                    <span className="text-xs opacity-80">Investors 20%</span>
                  </div>
                </div>
              </div>

              {/* Raise highlight */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <DollarSign size={13} />
                <span className="text-xs font-medium">Raising $2M</span>
                <span className="text-[10px] bg-emerald-400/30 text-emerald-100 px-1.5 py-0.5 rounded-full font-medium">Seed ↑</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-emerald-50">
                        <TrendingUp size={16} className="text-emerald-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">Target IRR</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">30%</p>
                    <p className="text-xs text-muted-foreground">annual</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Internal Rate of Return investors expect annually over the hold period.</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <DollarSign size={16} className="text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Raising</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">$2M</p>
                    <p className="text-xs text-muted-foreground">this round</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Total capital you're raising in the current round.</TooltipContent>
              </Tooltip>
            </div>

            {/* Scenario Reminder */}
            <div
              className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 hover:shadow-md transition-shadow animate-fade-up"
              style={{ animationDelay: "0.35s" }}
            >
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Settings size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Scenario Reminder</p>
                <p className="text-xs text-muted-foreground truncate">Adjust inputs to see required MOIC & exit value</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0">
                Adjust
              </button>
            </div>
          </div>

          {/* Right: Profile + Milestones */}
          <div className="lg:col-span-3 space-y-6">
            {/* Startup Profile */}
            <div
              className="bg-card rounded-2xl border border-border p-5 text-center hover:shadow-md transition-shadow animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Rocket size={28} className="text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">My Startup</h3>
              <p className="text-xs text-muted-foreground mb-3">SaaS · Productivity</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs font-medium text-primary">Seed Stage</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Last round: Pre-seed $500K</p>
            </div>

            {/* Milestones / Exit Scenarios */}
            <div
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              <h3 className="text-base font-semibold text-foreground mb-4">Milestones & Exit</h3>

              {/* Quarter strip */}
              <div className="flex gap-1.5 mb-4">
                {quarters.map((q) => (
                  <div
                    key={q.label}
                    className={`flex-1 text-center py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      q.active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="font-bold">{q.label}</div>
                    <div className="text-[10px] opacity-75">{q.year}</div>
                  </div>
                ))}
              </div>

              {/* Milestone */}
              <div className="bg-secondary/50 rounded-xl p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-1">Target: Q3 2026</p>
                <p className="text-sm font-semibold text-foreground">Series A Round</p>
                <p className="text-xs text-muted-foreground mb-2">Required exit: $40M for 4× MOIC</p>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors">
                    <Check size={12} /> On Track
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    <Mail size={13} />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    <Share2 size={13} />
                  </button>
                </div>
              </div>

              {/* Round history mini-chart */}
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roundHistory} barCategoryGap="20%">
                    <XAxis dataKey="round" tick={{ fontSize: 9, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]} fill="hsl(217, 91%, 60%)" fillOpacity={0.3}>
                      {roundHistory.map((_, i) => (
                        <Cell key={i} fillOpacity={i <= 1 ? 0.8 : 0.25} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Fundraise Math Dashboard — For informational purposes only. Not financial advice.
      </footer>
    </div>
  );
};

export default Index;
