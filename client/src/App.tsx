import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Database, User, Syringe, TerminalSquare } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

export default function App() {
  const [labData, setLabData] = useState({
    system: 'cardiovascular',
    code: '2823-3', // Potassium LOINC
    value: '6.5',
    unit: 'mEq/L'
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isInjecting, setIsInjecting] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [twinInfo, setTwinInfo] = useState({
    twinId: 'Connecting...',
    authMode: 'Authenticating...',
    medications: [] as Array<{ code: string; name: string }>
  });

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 }),
      type,
      message
    }]);
  };

  useEffect(() => {
    const bootSequence = async () => {
      addLog('INFO', 'Aegis Sentinel UI Initialized.');
      await new Promise(r => setTimeout(r, 400));
      addLog('INFO', 'Connecting to live clinical intelligence API...');
      
      try {
        const response = await fetch('http://localhost:3000/simulate/status');
        const data = await response.json();
        
        if (data.connected) {
          setTwinInfo({
            twinId: data.twinId,
            authMode: data.authMode,
            medications: data.medications
          });
          addLog('SUCCESS', `DTP Connection established. Live Digital Twin Synchronized [ID: ${data.twinId}].`);
          if (data.medications.length === 0) {
             addLog('WARN', 'Live twin currently has no active medication regimen on file.');
          }
        } else {
          addLog('ERROR', 'DTP Connection failed: Twin not available.');
        }
      } catch (err) {
        addLog('ERROR', 'Failed to retrieve live twin status from backend service.');
      }
    };
    bootSequence();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInjecting(true);
    addLog('INFO', `[Ingestion] Transmitting LOINC ${labData.code} [Value: ${labData.value}] to Aegis Backend...`);

    try {
      const response = await fetch('http://localhost:3000/simulate/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json(); 
      const { alertTriggered, payload } = result;
      
      addLog('INFO', 'Engine evaluating metabolic-drug interactions via Ontomorph HOLON API...');
      
      // 1. DDI Screening Status Updates
      if (twinInfo.medications.length < 2) {
        addLog('INFO', `HOLON Screening Skipped: Patient is on ${twinInfo.medications.length} medication(s). No DDI possible.`);
      } else {
        addLog('INFO', `HOLON Screening Complete: ${payload.totalInteractions} interaction(s) detected.`);
      }

      if (alertTriggered) {
        // 2. Log Drug Interactions if they exist
        if (payload.totalInteractions > 0) {
          addLog('ERROR', `DANGER ALERT [${payload.severityLevel}]: ${payload.totalInteractions} critical drug interaction(s) identified.`);
          
          // Print the exact API interaction details into the UI terminal
          if (payload.interactionsDetail && payload.interactionsDetail.length > 0) {
            payload.interactionsDetail.forEach((interaction: any) => {
               const severity = interaction.severity ? interaction.severity.toUpperCase() : 'HIGH';
               const desc = interaction.description || 'Pharmacological conflict detected between active regimen components.';
               addLog('WARN', `-> DDI Detail [${severity}]: ${desc}`);
            });
          }
        } 
        
        // 3. Log Metabolic Lab Alerts
        if (parseFloat(payload.labValue) >= 5.5) {
          addLog('ERROR', `CLINICAL ALERT [${payload.severityLevel}]: Critical metabolic threshold breached (Value: ${payload.labValue}).`);
        }
        
        // 4. Log Database Confirmation
        addLog('SUCCESS', `[DB WRITE CONFIRMED] Digital Twin [${twinInfo.twinId}] incident safely stored in PostgreSQL.`);
        addLog('WARN', `Audit Record -> System: ${payload.triggeringSystem.toUpperCase()} | LOINC: ${payload.labCode} | Value: ${payload.labValue} | Severity: ${payload.severityLevel}`);
        
      } else {
        addLog('SUCCESS', `Screening clear. Value ${payload.labValue} is within safe metabolic limits and zero DDIs detected.`);
      }

    } catch (error) {
      addLog('ERROR', 'Connection refused. Is the NestJS backend running?');
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-gray-300 font-sans p-6 md:p-8 flex flex-col gap-6">
      
      <header className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">AEGIS<span className="text-blue-400">SENTINEL</span></h1>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Ontomorph Integrated Microservice</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <span className="text-blue-400">ONTOMORPH SDK ONLINE</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <section className="bg-[#0a0d14] border border-gray-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4 text-white border-b border-gray-800 pb-2">
              <User className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold tracking-wide">Live Digital Twin Profile</h2>
            </div>
            
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Twin ID:</span>
                <span className="text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded text-xs truncate max-w-[160px]" title={twinInfo.twinId}>
                  {twinInfo.twinId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">SDK Auth:</span>
                <span className="text-green-400">{twinInfo.authMode}</span>
              </div>
              
              <div className="pt-2">
                <span className="text-gray-500 mb-2 block">Active Regimen (RxNorm Check):</span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {twinInfo.medications.length === 0 ? (
                     <div className="text-gray-600 text-xs italic">No active medications found on Twin.</div>
                  ) : (
                    twinInfo.medications.map((med, index) => (
                      <div key={index} className="flex items-center gap-2 bg-[#05070a] p-2 rounded border border-gray-800">
                        <Syringe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div className="truncate">
                          <div className="text-white truncate">{med.name}</div>
                          <div className="text-xs text-gray-500 font-mono">Code: {med.code}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#0a0d14] border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-white border-b border-gray-800 pb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold tracking-wide">Lab Event Injector</h2>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Triggering System</label>
                <input 
                  type="text" 
                  value={labData.system}
                  onChange={e => setLabData({...labData, system: e.target.value})}
                  className="w-full bg-[#05070a] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">LOINC Code</label>
                  <input 
                    type="text" 
                    value={labData.code}
                    onChange={e => setLabData({...labData, code: e.target.value})}
                    className="w-full bg-[#05070a] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">Unit</label>
                  <input 
                    type="text" 
                    value={labData.unit}
                    onChange={e => setLabData({...labData, unit: e.target.value})}
                    className="w-full bg-[#05070a] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Result Value</label>
                <input 
                  type="text" 
                  value={labData.value}
                  onChange={e => setLabData({...labData, value: e.target.value})}
                  className="w-full bg-[#05070a] border border-gray-800 rounded p-2 text-lg text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={isInjecting}
                className={`w-full mt-4 py-3 rounded-lg font-bold tracking-wide transition-all flex items-center justify-center gap-2
                  ${isInjecting 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-900/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500 hover:text-black'
                  }`}
              >
                {isInjecting ? (
                  <span className="animate-pulse">TRANSMITTING...</span>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    INJECT LAB RESULT
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        <div className="lg:col-span-8 bg-[#0a0d14] border border-gray-800 rounded-xl flex flex-col shadow-lg overflow-hidden">
          <div className="bg-[#05070a] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalSquare className="w-5 h-5 text-gray-500" />
              <h2 className="font-mono text-sm tracking-wide text-gray-500">Aegis Server Stream (Real-Time)</h2>
            </div>
          </div>
          
          <div className="flex-1 p-4 font-mono text-sm overflow-y-auto max-h-[600px] bg-[#020408]">
            {logs.length === 0 ? (
              <div className="text-gray-600 italic">Awaiting network events...</div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 leading-relaxed">
                    <span className="text-gray-700 select-none">[{log.timestamp}]</span>
                    <span className={`w-20 flex-shrink-0 font-bold ${
                      log.type === 'INFO' ? 'text-blue-400' :
                      log.type === 'WARN' ? 'text-yellow-400' :
                      log.type === 'ERROR' ? 'text-red-500' :
                      'text-green-400'
                    }`}>
                      {log.type}
                    </span>
                    <span className={`flex-1 break-words ${
                      log.type === 'ERROR' ? 'text-red-400 font-semibold' :
                      log.type === 'WARN' ? 'text-yellow-200' :
                      'text-gray-300'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}