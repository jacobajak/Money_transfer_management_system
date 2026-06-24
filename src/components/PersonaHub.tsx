import React, { useState } from "react";
import { Employee, Branch } from "../types.js";
import { UserCheck, Shield, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface PersonaHubProps {
  employees: Employee[];
  branches: Branch[];
  activeEmployeeId: string;
  onSelectEmployee: (empId: string) => void;
}

export const PersonaHub: React.FC<PersonaHubProps> = ({
  employees,
  branches,
  activeEmployeeId,
  onSelectEmployee,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Minimized by default for pristine spacing

  const currentEmp = employees.find((e) => e.id === activeEmployeeId);
  const currentBranch = branches.find((b) => b.id === currentEmp?.branchId);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "MANAGER":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "AGENT":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "AUDITOR":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const activePersonas = [
    { id: "emp-1", label: "Owner (Jacob)", role: "OWNER", desc: "Full Access & AI Hub" },
    { id: "emp-2", label: "Juba Mgr (Deng)", role: "MANAGER", desc: "HQ Management" },
    { id: "emp-5", label: "Bor Cashier (Daniel)", role: "AGENT", desc: "Transfers & Payouts" },
    { id: "emp-8", label: "Auditor (Ezekiel)", role: "AUDITOR", desc: "Read-only logs" },
  ];

  return (
    <div id="persona-simulator-card" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6 transition-all duration-300">
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/70 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-indigo-600" />
          <h2 className="font-display font-semibold text-slate-800 text-sm md:text-base">
            MTMS Role Persona Simulator
          </h2>
          {isCollapsed && currentEmp && (
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-3 bg-indigo-50 text-indigo-750 border border-indigo-100 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
              Current: {currentEmp.name} ({currentEmp.role})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            Simulating live branch agents
          </div>
          <button 
            type="button"
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            title={isCollapsed ? "Expand Simulator" : "Minimize Simulator"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="p-4 md:p-5 animate-fadeIn">
          <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">
            Select an active employee profile below to test role permissions, branch constraints, and localized transfer processing:
          </p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
            {activePersonas.map((p) => {
              const emp = employees.find((e) => e.id === p.id);
              const isSelected = activeEmployeeId === p.id;
              return (
                <button
                  key={p.id}
                  id={`btn-persona-${p.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEmployee(p.id);
                  }}
                  className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between pointer-events-none mb-1">
                    <span className="font-semibold text-slate-800 text-xs md:text-sm truncate">
                      {emp?.name.split(" ")[0]} {emp?.name.split(" ")[1] || ""}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(p.role)}`}>
                      {p.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 pointer-events-none italic">
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {currentEmp && (
            <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-display font-medium flex items-center justify-center text-sm shadow-sm border border-indigo-700">
                  {currentEmp.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-sm">{currentEmp.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRoleBadgeStyle(currentEmp.role)}`}>
                      {currentEmp.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {currentEmp.id} • Tel: {currentEmp.phone} • Email: {currentEmp.email}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-start md:items-end border-t md:border-t-0 border-slate-200/60 pt-2.5 md:pt-0 w-full md:w-auto">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                  Security Scope
                </span>
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  Active Node: <span className="text-slate-900 font-bold">{currentBranch ? currentBranch.name : "ALL BRANCHES (Remittance HQ)"}</span>
                </span>
                {currentBranch && (
                  <span className="text-[10px] text-slate-500 block italic">
                    Located in: {currentBranch.city} Town terminal
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
