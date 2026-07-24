import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Database, User, Syringe, TerminalSquare, Cpu, Server, Zap } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

interface InteractionDetail {
  severity?: string;
  description?: string;
}

// --- High-Performance Animated Starfield ---
const StarField = React.memo(() => {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, 
      y: Math.random() * 100, 
      size: Math.random() * 2 + 0.5, 
      duration: Math.random() * 3 + 2, 
      delay: Math.random() * 2,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.6)`
          }}
          animate={{
            opacity: [0.15, 0.8, 0.15],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
});

// 🚀 THE FIX: Removed the 'Variants' type entirely and used 'as const' to satisfy strict TypeScript
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 } // <-- Added 'as const'
  }
};

const logVariant = {
  hidden: { opacity: 0, x: -10, scale: 0.95 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" as const } } // <-- Added 'as const'
};

export default function App() {
  const API_BASE_URL = import.meta.env.PROD 
    ? 'https://project-aegis-sentinel.onrender.com' 
    : 'http://localhost:3000';

  const [labData, setLabData] = useState({
    system: 'cardiovascular',
    code: '2823-3',
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
      await new Promise(r => setTimeout(r, 600));
      addLog('INFO', `Establishing secure handshake with API at ${API_BASE_URL}...`);
      
      try {
        const response = await fetch(`${API_BASE_URL}/simulate/status`);
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
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [logs]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInjecting(true);
    addLog('INFO', `[Ingestion] Transmitting LOINC ${labData.code} [Value: ${labData.value}] to Aegis Backend...`);

    try {
      const response = await fetch(`${API_BASE_URL}/simulate/lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json(); 
      const { alertTriggered, payload } = result;
      
      addLog('INFO', 'Engine evaluating metabolic-drug interactions via Ontomorph HOLON API...');
      
      if (twinInfo.medications.length < 2) {
        addLog('INFO', `HOLON Screening Skipped: Patient is on ${twinInfo.medications.length} medication(s). No DDI possible.`);
      } else {
        addLog('INFO', `HOLON Screening Complete: ${payload.totalInteractions} interaction(s) detected.`);
      }

      if (alertTriggered) {
        if (payload.totalInteractions > 0) {
          addLog('ERROR', `DANGER ALERT [${payload.severityLevel}]: ${payload.totalInteractions} critical drug interaction(s) identified.`);
          if (payload.interactionsDetail && payload.interactionsDetail.length > 0) {
            payload.interactionsDetail.forEach((interaction: InteractionDetail) => {
               const severity = interaction.severity ? interaction.severity.toUpperCase() : 'HIGH';
               const desc = interaction.description || 'Pharmacological conflict detected between active regimen components.';
               addLog('WARN', `-> DDI Detail [${severity}]: ${desc}`);
            });
          }
        } 
        
        if (parseFloat(payload.labValue) >= 5.5) {
          addLog('ERROR', `CLINICAL ALERT [${payload.severityLevel}]: Critical metabolic threshold breached (Value: ${payload.labValue}).`);
        }
        
        addLog('SUCCESS', `[DB WRITE CONFIRMED] Digital Twin incident safely stored in PostgreSQL.`);
        addLog('WARN', `Audit -> SYS: ${payload.triggeringSystem.toUpperCase()} | LOINC: ${payload.labCode} | VAL: ${payload.labValue} | SEV: ${payload.severityLevel}`);
        
      } else {
        addLog('SUCCESS', `Screening clear. Value ${payload.labValue} is within safe metabolic limits and zero DDIs detected.`);
      }

    } catch (error) {
      addLog('ERROR', 'Connection refused. Is the backend running?');
    } finally {
      setIsInjecting(false);
    }
  };

  const getLogColor = (type: string) => {
    switch(type) {
      case 'INFO': return 'text-blue-300';
      case 'WARN': return 'text-amber-300';
      case 'ERROR': return 'text-rose-400';
      case 'SUCCESS': return 'text-emerald-300';
      default: return 'text-gray-200';
    }
  };

  const getLogBg = (type: string) => {
    switch(type) {
      case 'ERROR': return 'bg-rose-500/20 border-l-2 border-rose-400';
      case 'WARN': return 'bg-amber-400/10 border-l-2 border-amber-400/60';
      default: return 'border-l-2 border-transparent';
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(88,90,94)] text-gray-100 font-sans p-4 md:p-8 flex flex-col gap-6 selection:bg-blue-500/40 relative">
      
      <StarField />

      {/* Header - Glassmorphic */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-between pb-4 border-b border-white/20 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="flex items-center gap-4">
          <div className="relative p-2.5 bg-black/20 rounded-xl border border-white/20 shadow-lg">
            <Shield className="w-6 h-6 text-blue-300" />
            <motion.div 
              animate={{ opacity: [0.3, 0.7, 0.3] }} 
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute inset-0 bg-blue-400/20 rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-md">
              AEGIS<span className="text-blue-300 font-light">SENTINEL</span>
            </h1>
            <p className="text-[11px] text-gray-200 font-mono uppercase tracking-[0.2em] flex items-center gap-2 mt-0.5">
              <Server className="w-3 h-3" /> Ontomorph Integrated Microservice
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full border border-white/20 shadow-inner">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <span className="text-emerald-300 text-xs font-mono font-bold tracking-wide drop-shadow-sm">SYSTEM ONLINE</span>
        </div>
      </motion.header>

      <motion.main 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 max-w-[1600px] w-full mx-auto relative z-10"
      >
        
        {/* Left Column (Controls & Profile) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Profile Card */}
          <motion.section variants={cardVariant} className="bg-black/20 border border-white/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:bg-blue-400/20" />
            
            <div className="flex items-center gap-3 mb-6 text-white pb-4 border-b border-white/20">
              <div className="p-1.5 bg-black/30 rounded-lg border border-white/20">
                <User className="w-4 h-4 text-blue-300" />
              </div>
              <h2 className="font-semibold tracking-wide text-sm drop-shadow-sm">Live Digital Twin Profile</h2>
            </div>
            
            <div className="space-y-5 font-mono text-[13px]">
              <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/10 shadow-inner">
                <span className="text-gray-200">Twin ID</span>
                <span className="text-blue-200 bg-blue-500/20 px-2 py-1 rounded text-xs font-bold truncate max-w-[150px] border border-blue-400/30" title={twinInfo.twinId}>
                  {twinInfo.twinId}
                </span>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-gray-200">SDK Auth</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1.5 drop-shadow-sm">
                  <Zap className="w-3 h-3" /> {twinInfo.authMode}
                </span>
              </div>
              
              <div className="pt-2">
                <span className="text-gray-200 mb-3 block text-xs uppercase tracking-wider font-bold">Active Regimen (RxNorm)</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {twinInfo.medications.length === 0 ? (
                     <div className="text-gray-300 text-xs italic bg-black/30 p-3 rounded-lg border border-white/10 text-center shadow-inner">
                       No active medications on file
                     </div>
                  ) : (
                    twinInfo.medications.map((med, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={index} 
                        className="flex items-center gap-3 bg-black/30 p-2.5 rounded-lg border border-white/10 hover:border-blue-400/40 transition-colors shadow-sm"
                      >
                        <div className="p-1.5 bg-black/40 rounded-md border border-white/10">
                          <Syringe className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
                        </div>
                        <div className="truncate">
                          <div className="text-white text-sm truncate font-sans font-semibold drop-shadow-sm">{med.name}</div>
                          <div className="text-[10px] text-gray-300 font-mono mt-0.5">{med.code}</div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Injector Form */}
          <motion.section variants={cardVariant} className="bg-black/20 border border-white/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl relative">
            <div className="flex items-center gap-3 mb-6 text-white pb-4 border-b border-white/20">
              <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <Activity className="w-4 h-4 text-blue-300" />
              </div>
              <h2 className="font-semibold tracking-wide text-sm drop-shadow-sm">Lab Event Injector</h2>
            </div>

            <form onSubmit={handleSimulate} className="space-y-5">
              <div>
                <label className="block text-[11px] font-mono text-gray-200 mb-1.5 uppercase tracking-wider font-bold">Triggering System</label>
                <input 
                  type="text" 
                  value={labData.system}
                  onChange={e => setLabData({...labData, system: e.target.value})}
                  className="w-full bg-black/30 border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all shadow-inner"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-gray-200 mb-1.5 uppercase tracking-wider font-bold">LOINC Code</label>
                  <input 
                    type="text" 
                    value={labData.code}
                    onChange={e => setLabData({...labData, code: e.target.value})}
                    className="w-full bg-black/30 border border-white/20 rounded-lg p-2.5 text-sm font-mono text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-gray-200 mb-1.5 uppercase tracking-wider font-bold">Unit</label>
                  <input 
                    type="text" 
                    value={labData.unit}
                    onChange={e => setLabData({...labData, unit: e.target.value})}
                    className="w-full bg-black/30 border border-white/20 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-200 mb-1.5 uppercase tracking-wider font-bold">Result Value</label>
                <input 
                  type="text" 
                  value={labData.value}
                  onChange={e => setLabData({...labData, value: e.target.value})}
                  className="w-full bg-black/50 border border-white/30 rounded-lg p-3 text-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/60 shadow-inner transition-all"
                />
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isInjecting}
                className={`w-full mt-2 py-3.5 rounded-lg font-bold text-sm tracking-widest transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg
                  ${isInjecting 
                    ? 'bg-black/50 border border-white/10 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-300/50'
                  }`}
              >
                {!isInjecting && (
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-30 group-hover:animate-shine" />
                )}
                
                {isInjecting ? (
                  <span className="animate-pulse flex items-center gap-2">
                    <Cpu className="w-4 h-4 animate-spin-slow" /> PROCESSING
                  </span>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    INJECT PAYLOAD
                  </>
                )}
              </motion.button>
            </form>
          </motion.section>
        </div>

        {/* Right Column (Terminal) */}
        <motion.div variants={cardVariant} className="lg:col-span-8 bg-black/30 border border-white/20 rounded-2xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative backdrop-blur-xl">
          {/* Terminal Header */}
          <div className="bg-black/40 px-5 py-3.5 border-b border-white/10 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <TerminalSquare className="w-4 h-4 text-gray-300" />
              <h2 className="font-mono text-xs tracking-[0.2em] text-white uppercase font-bold drop-shadow-sm">Aegis Telemetry Stream</h2>
            </div>
            {/* Fake Window Controls */}
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm" />
            </div>
          </div>
          
          {/* Terminal Body */}
          <div className="flex-1 p-5 font-mono text-[13px] overflow-y-auto bg-black/20 shadow-inner relative custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-gray-300 font-bold italic mt-2 animate-pulse drop-shadow-sm">Awaiting network telemetry...</div>
            ) : (
              <div className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id} 
                      variants={logVariant}
                      initial="hidden"
                      animate="show"
                      className={`flex gap-4 p-2.5 rounded leading-relaxed ${getLogBg(log.type)} transition-colors duration-300 shadow-sm`}
                    >
                      <span className="text-gray-300 select-none flex-shrink-0 font-semibold drop-shadow-sm">[{log.timestamp}]</span>
                      <span className={`w-20 flex-shrink-0 font-extrabold tracking-wider drop-shadow-sm ${getLogColor(log.type)}`}>
                        {log.type}
                      </span>
                      <span className={`flex-1 break-words font-medium drop-shadow-sm ${
                        log.type === 'ERROR' ? 'text-rose-200 font-bold' :
                        log.type === 'WARN' ? 'text-amber-100' :
                        'text-white'
                      }`}>
                        {log.message}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={logEndRef} className="h-4" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine {
          100% { left: 125%; }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.15);
          border-left: 1px solid rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.25);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}} />
    </div>
  );
}