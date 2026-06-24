import React, { useState } from "react";
import { Wifi, WifiOff, RefreshCw, Layers, CheckCircle2, AlertTriangle, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { Transaction } from "../types.js";

interface OfflineSyncPanelProps {
  isOffline: boolean;
  onToggleOffline: (offline: boolean) => void;
  syncQueue: {
    transactions: Transaction[];
    payoutEntries: { code: string; pin: string; payoutAt: string; agentId: string; branchId: string }[];
  };
  onTriggerSync: () => Promise<{
    success: boolean;
    syncedTransactionCodes: string[];
    conflictLog: string[];
  } | null>;
}

export const OfflineSyncPanel: React.FC<OfflineSyncPanelProps> = ({
  isOffline,
  onToggleOffline,
  syncQueue,
  onTriggerSync,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Minimized by default for crisp workspace density
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    syncedTransactionCodes: string[];
    conflictLog: string[];
    timestamp: string;
  } | null>(null);

  const totalQueued = syncQueue.transactions.length + syncQueue.payoutEntries.length;

  const handleSyncProcess = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await onTriggerSync();
      if (result) {
        setSyncResult({
          ...result,
          timestamp: new Date().toLocaleTimeString(),
        });
        setShowConsole(true);
      }
    } catch (err) {
      console.error("Sync pipeline failure:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="sync-simulator-card" className="bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 overflow-hidden mb-6 transition-all duration-300">
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="bg-slate-950 font-mono px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs md:text-sm cursor-pointer hover:bg-slate-900 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-slate-300">South Sudan Regional Transit Offline Console</span>
          {isCollapsed && (
            <span className={`ml-2 hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
              isOffline 
                ? "bg-amber-500/20 text-amber-400 border border-amber-400/40" 
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-400/40"
            }`}>
              {isOffline ? "OFFLINE" : "ONLINE"} ({totalQueued} Queued)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {/* Toggle Trigger */}
          <button
            id="btn-connection-toggle"
            onClick={() => onToggleOffline(!isOffline)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition-all text-xs ${
              isOffline
                ? "bg-amber-500/20 text-amber-400 border border-amber-400/40 hover:bg-amber-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 hover:bg-emerald-500/30"
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                OFFLINE MODE (Low Connectivity)
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                ONLINE (Server Linked)
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? "Expand Console Settings" : "Minimize Console Settings"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8">
              <h3 className="font-display font-medium text-slate-100 text-sm md:text-base flex items-center gap-2 mb-1">
                {isOffline ? (
                  <span className="text-amber-400 font-bold">● Network Simulation: Offline Operations Active</span>
                ) : (
                  <span className="text-emerald-400 font-bold">● Network Simulation: Real Time Remittance Active</span>
                )}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-sans text-justify">
                Remittance companies in Juba, Bor, and Wau experience frequent local power and satellite network cuts. In offline mode, agents can still record <b>Send Money</b> collection orders and verify <b>Receive Money</b> payouts locally. They queue into the client memory and sync immediately upon reconnection.
              </p>
            </div>

            <div className="md:col-span-4 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1.5 font-mono">
                <Layers className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Offline Buffer Cache</span>
              </div>
              
              <div className="flex items-baseline gap-1 bg-slate-900 px-3 py-0.5 rounded border border-slate-800 font-mono text-xl font-bold mb-3">
                <span className={totalQueued > 0 ? "text-amber-400 animate-pulse" : "text-emerald-400"}>
                  {totalQueued}
                </span>
                <span className="text-xs text-slate-500 font-normal font-sans">Remittances</span>
              </div>

              <button
                id="btn-reconcile-sync"
                disabled={isOffline || totalQueued === 0 || isSyncing}
                onClick={handleSyncProcess}
                className={`w-full py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isOffline
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : totalQueued === 0
                    ? "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Compiling & Merging..." : "Reconcile Offline Buffer"}
              </button>
              
              {isOffline && totalQueued > 0 && (
                <span className="text-[9px] text-amber-500/95 font-semibold mt-1.5 animate-pulse text-left w-full text-center">
                  ⚠️ Connect server online before syncing.
                </span>
              )}
            </div>
          </div>

        {/* Console sync readout logs */}
        {showConsole && syncResult && (
          <div className="mt-4 bg-black rounded-lg border border-slate-800 font-mono text-[11px] p-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Local Remittance Sync Complete ({syncResult.timestamp})
              </span>
              <button onClick={() => setShowConsole(false)} className="text-slate-500 hover:text-slate-300 text-xs font-bold px-1">&times; Close Console</button>
            </div>
            
            <div className="space-y-1 text-slate-300/90 leading-relaxed select-text max-h-48 overflow-y-auto">
              <div className="text-emerald-400 font-bold">[Step 1/4] Establishing secure RPC socket and JWT handshake with Nile HQ Server...</div>
              <div className="text-slate-400"> - Connection resolved: 0.0.0.0:3000 to Cloud-Run Node ID (200 OK)</div>
              
              <div className="text-emerald-400 font-bold mt-1">[Step 2/4] Parsing offline buffer queue content...</div>
              <div className="text-slate-400"> - Transmitted payload packet: {syncQueue.transactions.length} Send entries, {syncQueue.payoutEntries.length} Pay receipts.</div>
              
              <div className="text-emerald-400 font-bold mt-1">[Step 3/4] Resolving clashing states and duplicate remittance checks...</div>
              {syncResult.syncedTransactionCodes.length > 0 ? (
                <div className="text-indigo-400 font-semibold pl-3">
                  ✓ Successfully reconciled remittance keys: {syncResult.syncedTransactionCodes.join(", ")}
                </div>
              ) : (
                <div className="text-slate-500 pl-3">No active code records needed table insertion.</div>
              )}

              {syncResult.conflictLog.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-amber-400 font-bold mt-1">⚠️ Synced Conflicts Flagged:</div>
                  {syncResult.conflictLog.map((log, lIdx) => (
                    <div key={lIdx} className="text-amber-500 pl-3 italic">
                      - {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-emerald-500 font-bold pl-3 mt-1 text-xs">
                  ✓ Code Check: 100% integrity. No record conflicts or duplicate payout attempts detected.
                </div>
              )}
              
              <div className="text-emerald-400 font-bold mt-1">[Step 4/4] Updating local client cache states...</div>
              <div className="text-slate-400"> - Safes balances recalculated. Opening physical log tracks saved.</div>
              <div className="text-emerald-400 font-bold text-xs mt-1">✓ Remittance database successfully synchronized. Ready for transit.</div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
};
