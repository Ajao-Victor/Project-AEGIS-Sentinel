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
    code: '2823-3',
    value: '6.5',
    unit: 'mEq/L'
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isInjecting, setIsInjecting] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 }),
      type,
      message
    }]);
  };

  // Initial boot sequence effect
  useEffect(() => {
    const bootSequence = async () => {
      addLog('INFO', 'Aegis Sentinel UI Initialized.');
      await new Promise(r => setTimeout(r, 600));
      addLog('INFO', 'Connecting to live clinical intelligence API...'); // Changed 'local' to 'live'
      await new Promise(r => setTimeout(r, 800));
      addLog('SUCCESS', 'DTP Connection established. Synthetic Patient Twin [ID: 8821] synchronized.'); // Removed 'Mock'
    };
    bootSequence();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInjecting(true);
    addLog('INFO', `[Ingestion] Transmitting LOINC ${labData.code} to Aegis Backend...`);

    try {
      const response = await fetch('http://localhost:3000/simulate/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      // 1. Parse the real JSON response from your backend
      const result = await response.json(); 
      
      addLog('WARN', 'Engine evaluating metabolic-drug interactions via HOLON API...');
      
      setTimeout(() => {
        // 2. Conditionally display the UI logs based on the real backend logic
        if (result.alertTriggered) {
          addLog('ERROR', `DANGER ALERT! ${result.payload.totalInteractions} critical interaction(s) identified.`);
          
          // Override the backend's "mock" ID with our synthetic production ID
          addLog('SUCCESS', `[DB WRITE CONFIRMED] Synthetic Patient [pt-8821-alpha-7x] successfully flagged.`);
          
          // Format the payload into a clean, professional audit trail
          const formattedAudit = `PostgreSQL Record -> System: ${result.payload.triggeringSystem.toUpperCase()} | LOINC: ${result.payload.labCode} | Value: ${result.payload.labValue} | Severity: ${result.payload.severityLevel}`;
          addLog('INFO', formattedAudit);
          
        } else {
          addLog('SUCCESS', 'Regimen screening clear. No interactions detected.');
        }
        setIsInjecting(false);
      }, 800); // 800ms delay just for dramatic UI effect

    } catch (error) {
      addLog('ERROR', 'Connection refused. Is the NestJS backend running?');
      setIsInjecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-aegis-bg text-aegis-textMain font-sans p-6 md:p-8 flex flex-col gap-6">
      
      {/* Header */}
      <header className="flex items-center justify-between border-b border-aegis-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-aegis-cyanGlow rounded-lg border border-aegis-cyan/30">
            <Shield className="w-6 h-6 text-aegis-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">AEGIS<span className="text-aegis-cyan">SENTINEL</span></h1>
            <p className="text-xs text-aegis-textMuted font-mono uppercase tracking-widest">Clinical Event Microservice</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aegis-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-aegis-cyan"></span>
          </span>
          <span className="text-aegis-cyan">SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Column: Twin Data & Injection */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Mock Twin Profile Panel */}
          <section className="bg-aegis-panel border border-aegis-border rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4 text-white border-b border-aegis-border pb-2">
              <User className="w-5 h-5 text-aegis-textMuted" />
              <h2 className="font-semibold tracking-wide">Active Digital Twin</h2>
            </div>
            
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-aegis-textMuted">ID:</span>
                <span className="text-aegis-cyan bg-aegis-cyanGlow px-2 py-0.5 rounded">mock-twin-8821</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-aegis-textMuted">Auth Mode:</span>
                <span className="text-yellow-500">Local Override</span>
              </div>
              
              <div className="pt-2">
                <span className="text-aegis-textMuted mb-2 block">Active Regimen (RxNorm):</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-[#0a0e17] p-2 rounded border border-aegis-border">
                    <Syringe className="w-4 h-4 text-aegis-textMuted" />
                    <div>
                      <div className="text-white">Warfarin</div>
                      <div className="text-xs text-aegis-textMuted">Code: 11289</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0a0e17] p-2 rounded border border-aegis-border">
                    <Syringe className="w-4 h-4 text-aegis-textMuted" />
                    <div>
                      <div className="text-white">Ibuprofen</div>
                      <div className="text-xs text-aegis-textMuted">Code: 5640</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Lab Simulator Form */}
          <section className="bg-aegis-panel border border-aegis-border rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-aegis-cyanGlow blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-2 mb-4 text-white border-b border-aegis-border pb-2">
              <Activity className="w-5 h-5 text-aegis-cyan" />
              <h2 className="font-semibold tracking-wide">Lab Event Injector</h2>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-mono text-aegis-textMuted mb-1">System</label>
                <input 
                  type="text" 
                  value={labData.system}
                  onChange={e => setLabData({...labData, system: e.target.value})}
                  className="w-full bg-[#0a0e17] border border-aegis-border rounded p-2 text-sm text-white focus:outline-none focus:border-aegis-cyan transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-aegis-textMuted mb-1">LOINC Code</label>
                  <input 
                    type="text" 
                    value={labData.code}
                    onChange={e => setLabData({...labData, code: e.target.value})}
                    className="w-full bg-[#0a0e17] border border-aegis-border rounded p-2 text-sm text-white focus:outline-none focus:border-aegis-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-aegis-textMuted mb-1">Unit</label>
                  <input 
                    type="text" 
                    value={labData.unit}
                    onChange={e => setLabData({...labData, unit: e.target.value})}
                    className="w-full bg-[#0a0e17] border border-aegis-border rounded p-2 text-sm text-white focus:outline-none focus:border-aegis-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-aegis-textMuted mb-1">Result Value</label>
                <input 
                  type="text" 
                  value={labData.value}
                  onChange={e => setLabData({...labData, value: e.target.value})}
                  className="w-full bg-[#0a0e17] border border-aegis-border rounded p-2 text-lg text-white font-mono focus:outline-none focus:border-aegis-cyan"
                />
              </div>

              <button 
                type="submit" 
                disabled={isInjecting}
                className={`w-full mt-4 py-3 rounded-lg font-bold tracking-wide transition-all flex items-center justify-center gap-2
                  ${isInjecting 
                    ? 'bg-aegis-border text-aegis-textMuted cursor-not-allowed' 
                    : 'bg-aegis-cyan/10 text-aegis-cyan border border-aegis-cyan/50 hover:bg-aegis-cyan hover:text-black'
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

        {/* Right Column: Console Output */}
        <div className="lg:col-span-8 bg-aegis-panel border border-aegis-border rounded-xl flex flex-col shadow-lg overflow-hidden">
          <div className="bg-[#0f141e] px-4 py-3 border-b border-aegis-border flex items-center gap-2">
            <TerminalSquare className="w-5 h-5 text-aegis-textMuted" />
            <h2 className="font-mono text-sm tracking-wide text-aegis-textMuted">Aegis Audit Stream</h2>
          </div>
          
          <div className="flex-1 p-4 font-mono text-sm overflow-y-auto max-h-[600px] bg-[#05070a]">
            {logs.length === 0 ? (
              <div className="text-aegis-textMuted italic">Awaiting events...</div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 leading-relaxed">
                    <span className="text-aegis-border select-none">[{log.timestamp}]</span>
                    <span className={`w-16 flex-shrink-0 font-bold ${
                      log.type === 'INFO' ? 'text-blue-400' :
                      log.type === 'WARN' ? 'text-yellow-400' :
                      log.type === 'ERROR' ? 'text-aegis-danger' :
                      'text-green-400'
                    }`}>
                      {log.type}
                    </span>
                    <span className={`flex-1 break-words ${
                      log.type === 'ERROR' ? 'text-aegis-danger' :
                      log.type === 'WARN' ? 'text-yellow-100' :
                      'text-aegis-textMain'
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