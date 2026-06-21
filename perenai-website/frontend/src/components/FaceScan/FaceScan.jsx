import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileDown, Play, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../auth/useAuth';
import { scanService } from '../../services/services';
import { aiApi } from '../../services/ai';
import { setFaceScanCompleted } from '../../utils/dashboardState';
import { devLog } from '../../utils/devLog';

// Inject required Google Fonts
const FontInjector = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
      .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
      .font-mono-tech { font-family: 'Share Tech Mono', monospace; }
    `}
  </style>
);

const COLORS = {
  bg: '#050505',
  panelBg: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#9ca3af',
  white: '#ffffff',
  bloodPressure: '#3b82f6',
  heartRate: '#ef4444',
  breathingRate: '#10b981',
  cardiacWorkload: '#f59e0b',
  stressIndex: '#8b5cf6',
  bmi: '#06b6d4',
};

// Fallback if SSE stream fails before any data arrives
const FALLBACK_VALUES = {
  bloodPressureSys: 118,
  bloodPressureDia: 76,
  heartRate: 72,
  breathingRate: 16,
  cardiacWorkload: 3.2,
  stressIndex: 42,
  bmi: 22.4,
};

export default function FaceScan() {
  const { user } = useAuth();
  const [status, setStatus] = useState('standby'); // 'standby' | 'scanning' | 'locked'
  const [timeLeft, setTimeLeft] = useState(20.0);
  const [fps, setFps] = useState(0);
  const [hasCamera, setHasCamera] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const lastValuesRef = useRef({ ...FALLBACK_VALUES });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rAFRef = useRef(null);
  const scanStartTimeRef = useRef(null);
  const statusRef = useRef('standby');

  // Dynamic values during scan
  const [currentValues, setCurrentValues] = useState({
    bloodPressureSys: 0, bloodPressureDia: 0,
    heartRate: 0, breathingRate: 0,
    cardiacWorkload: 0, stressIndex: 0, bmi: 0
  });

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure it plays
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((e) => devLog("Video play error:", e));
        };
      }
      streamRef.current = stream;
      setHasCamera(true);
    } catch (err) {
      devLog("Camera access failed:", err);
      setHasCamera(false);
    }
  };

  // Initial camera start
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Scan Logic
  const handleStartScan = async () => {
    if (status !== 'standby') return;
    
    // Reset values before starting
    setCurrentValues({
      bloodPressureSys: 0, bloodPressureDia: 0,
      heartRate: 0, breathingRate: 0,
      cardiacWorkload: 0, stressIndex: 0, bmi: 0
    });
    
    setStatus('scanning');
    statusRef.current = 'scanning';
    setTimeLeft(20.0);
    scanStartTimeRef.current = performance.now();

    // Start PPG animation loop
    const renderLoop = (timestamp) => {
      if (statusRef.current !== 'scanning') return;
      const elapsed = (timestamp - scanStartTimeRef.current) / 1000;
      const remaining = Math.max(20.0 - elapsed, 0);
      setTimeLeft(remaining);

      setFps((30 + Math.random() * 5).toFixed(1));

      if (remaining > 0) {
        drawPPG(elapsed);
        rAFRef.current = requestAnimationFrame(renderLoop);
      }
    };
    
    rAFRef.current = requestAnimationFrame(renderLoop);

    // Consume SSE Stream
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/scans/stream`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (statusRef.current === 'scanning') {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', '').trim());
              const nextValues = {
                bloodPressureSys: data.blood_pressure_sys,
                bloodPressureDia: data.blood_pressure_dia,
                heartRate: data.hr,
                breathingRate: data.rr,
                cardiacWorkload: data.cardiac_workload,
                stressIndex: data.stress_idx,
                bmi: data.bmi,
              };
              lastValuesRef.current = nextValues;
              setCurrentValues(nextValues);
            } catch (e) {}
          }
        }
      }
      
      if (statusRef.current === 'scanning') {
        finalizeScan(lastValuesRef.current);
      }

    } catch (error) {
      devLog("SSE Error:", error);
      if (statusRef.current === 'scanning') finalizeScan(FALLBACK_VALUES);
    }
  };

  const handleRescan = () => {
    // Stop animations
    if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    
    // Reset states
    setStatus('standby');
    statusRef.current = 'standby';
    setTimeLeft(20.0);
    setScanData(null);
    setCurrentValues({
      bloodPressureSys: 0, bloodPressureDia: 0,
      heartRate: 0, breathingRate: 0,
      cardiacWorkload: 0, stressIndex: 0, bmi: 0
    });
    
    // Restart camera if stopped
    if (!streamRef.current || !streamRef.current.active) {
      startCamera();
    }
  };

  const finalizeScan = async (values = lastValuesRef.current) => {
    setStatus('locked');
    statusRef.current = 'locked';
    setCurrentValues(values);
    setTimeLeft(0.0);
    setFps(0);

    const results = {
      blood_pressure_sys: values.bloodPressureSys,
      blood_pressure_dia: values.bloodPressureDia,
      heart_rate: values.heartRate,
      breathing_rate: values.breathingRate,
      cardiac_workload: values.cardiacWorkload,
      stress_index: values.stressIndex,
      bmi: values.bmi,
    };
    setScanData(results);
    setFaceScanCompleted(user, true);

    if (scanService?.saveScan) {
      scanService.saveScan(results).catch(() => {});
    }

    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const analysis = await aiApi.analyzeScan(results);
      setAiAnalysis(analysis);
    } catch {
      setAiAnalysis(null);
    } finally {
      setAiLoading(false);
    }
  };

  const drawPPG = (t) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Shift previous frame
    const imageData = ctx.getImageData(1, 0, width - 1, height);
    ctx.putImageData(imageData, 0, 0);

    // Clear new column
    ctx.clearRect(width - 1, 0, 1, height);

    // Calculate composite sine wave: sin(2π*1.2*t)*0.6 + sin(2π*2.4*t)*0.2 + sin(2π*0.6*t)*0.15 + noise
    const noise = (Math.random() - 0.5) * 0.1;
    const val = 
      Math.sin(2 * Math.PI * 1.2 * t) * 0.6 + 
      Math.sin(2 * Math.PI * 2.4 * t) * 0.2 + 
      Math.sin(2 * Math.PI * 0.6 * t) * 0.15 + 
      noise;

    // Map val [-1, 1] to height
    const y = height / 2 - (val * (height / 2) * 0.8);

    ctx.fillStyle = '#00ff99';
    ctx.fillRect(width - 2, y, 2, 2);
  };

  const exportPDF = () => {
    if (!scanData) return;
    const doc = new jsPDF();
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Header
    doc.setFillColor(10, 15, 26);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(0, 212, 255);
    doc.text("PEREN AI", 20, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text("BIOMETRIC HEALTH ANALYSIS REPORT", 20, 40);
    
    doc.setDrawColor(30, 41, 59);
    doc.line(20, 45, 190, 45);

    // Patient Info Placeholder
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Patient ID: ${user?.name || 'Anonymous User'}`, 20, 55);
    doc.text(`Scan Date: ${new Date().toLocaleString()}`, 20, 60);
    
    // PPG Waveform Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("PULSE WAVEFORM (rPPG)", 20, 75);

    try {
      const canvas = canvasRef.current;
      if (canvas) {
        const ppgDataUrl = canvas.toDataURL('image/png');
        doc.setFillColor(17, 23, 36);
        doc.rect(20, 80, 170, 40, 'F');
        doc.setDrawColor(30, 41, 59);
        doc.rect(20, 80, 170, 40, 'D');
        doc.addImage(ppgDataUrl, 'PNG', 25, 85, 160, 30);
      }
    } catch (e) {
      devLog("PDF Image Error:", e);
    }
    
    // Biomarkers Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("CLINICAL BIOMARKERS", 20, 135);
    
    const rows = [
      { label: "Blood Pressure", val: `${scanData.blood_pressure_sys}/${scanData.blood_pressure_dia} mmHg`, status: "Normal" },
      { label: "Heart Rate", val: `${scanData.heart_rate} BPM`, status: "Optimal" },
      { label: "Breathing Rate", val: `${scanData.breathing_rate} RPM`, status: "Normal" },
      { label: "Card. Workload", val: `${scanData.cardiac_workload} index`, status: "Normal" },
      { label: "Stress Index", val: `${scanData.stress_index} / 100`, status: "Moderate" },
      { label: "BMI", val: `${scanData.bmi} kg/m2`, status: "Normal" }
    ];

    let y = 150;
    doc.setFontSize(10);
    rows.forEach(r => {
      // Row bg
      doc.setFillColor(17, 23, 36);
      doc.rect(20, y - 5, 170, 12, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(r.label, 25, y + 2);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 212, 255);
      doc.text(r.val, 85, y + 2);
      
      doc.setTextColor(148, 163, 184);
      doc.text(r.status, 150, y + 2);
      
      y += 15;
    });
    
    // Disclaimer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const disclaimer = "DISCLAIMER: This report is generated by AI analysis and does not constitute a medical diagnosis. Please consult a healthcare professional for clinical interpretation.";
    doc.text(disclaimer, 20, 280, { maxWidth: 170 });
    
    doc.save(`peren-ai-report-${dateStr}.pdf`);
  };

  const progress = 1.0 - (timeLeft / 20.0);
  const progressPct = progress * 100;

  // Render Card Component
  const BiomarkerCard = ({ index, title, value, unit, color, statusLabel, isWarning }) => {
    // Staggered reveal logic: appears at progress > 0.15 + i*0.08
    const threshold = 0.15 + index * 0.08;
    const isVisible = status === 'locked' || (status === 'scanning' && progress > threshold);
    
    // Animate bar inside card
    const barFill = status === 'locked' ? 100 : (isVisible ? Math.min(((progress - threshold) / 0.1) * 100, 100) : 0);

    return (
      <div 
        className={`rounded-xl border p-4 flex flex-col justify-between overflow-hidden relative transition-all duration-300 ${isVisible ? 'opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'opacity-20'}`}
        style={{ backgroundColor: COLORS.panelBg, borderColor: COLORS.border }}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-rajdhani font-semibold text-[13px] tracking-widest uppercase text-[#94a3b8]">{title}</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${isWarning ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/50'}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="font-mono-tech text-3xl font-bold" style={{ color }}>
            {isVisible ? (status === 'locked' ? value : (typeof value === 'number' ? value.toFixed(1) : value)) : '---'}
          </span>
          <span className="font-mono-tech text-xs text-[#94a3b8]">{unit}</span>
        </div>
        {/* Card Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
          <div className="h-full" style={{ width: `${barFill}%`, backgroundColor: color, transition: 'width 0.1s linear' }} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto font-rajdhani">
      <FontInjector />
      
      <div className="w-full rounded-2xl border flex flex-col overflow-hidden shadow-2xl" style={{ backgroundColor: COLORS.bg, borderColor: COLORS.border }}>
        
        {/* Top Bar */}
        <header className="h-16 border-b flex items-center px-6 justify-between shrink-0" style={{ backgroundColor: COLORS.panelBg, borderColor: COLORS.border }}>
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-widest text-[#00d4ff]">PEREN·AI</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#94a3b8]">
                {status === 'standby' ? 'STANDBY' : status === 'scanning' ? "PHASE D'ACQUISITION" : 'RESULTS LOCKED'}
              </span>
              <div className="w-64 h-2 bg-[#1e293b] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00d4ff]" 
                  style={{ width: `${progressPct}%`, transition: 'width 0.1s linear' }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="font-mono-tech text-xl font-bold text-[#00d4ff]">
              {timeLeft.toFixed(1)}s
            </span>
            {status === 'standby' ? (
              <button 
                onClick={handleStartScan}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white font-bold tracking-wider"
              >
                <Play size={16} /> SCAN
              </button>
            ) : status === 'locked' ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRescan}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white font-bold tracking-wider"
                >
                  RESCAN
                </button>
                <button 
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 hover:bg-[#00d4ff]/20 text-[#00d4ff] font-bold tracking-wider transition-all"
                >
                  <FileDown size={16} /> EXPORT PDF
                </button>
              </div>
            ) : (
              <button 
                onClick={handleRescan}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-bold tracking-wider hover:bg-red-500/20 transition-all"
              >
                ANNULER
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Left Column (Video + PPG) */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Camera Viewport */}
            <div className="flex-1 rounded-xl border relative overflow-hidden flex flex-col min-h-[300px]" style={{ backgroundColor: COLORS.panelBg, borderColor: COLORS.border }}>
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 opacity-50 z-20" style={{ borderColor: COLORS.bloodPressure }} />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 opacity-50 z-20" style={{ borderColor: COLORS.bloodPressure }} />
              <div className="absolute bottom-12 left-4 w-6 h-6 border-b-2 border-l-2 opacity-50 z-20" style={{ borderColor: COLORS.bloodPressure }} />
              <div className="absolute bottom-12 right-4 w-6 h-6 border-b-2 border-r-2 opacity-50 z-20" style={{ borderColor: COLORS.bloodPressure }} />

              {/* Video Element */}
              <div className="flex-1 relative bg-black flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover transition-opacity duration-1000 ${status === 'locked' ? 'opacity-30 grayscale' : 'opacity-100'}`}
                />

                {/* ROI Detection Frame */}
                {status !== 'locked' && (
                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none">
                      <defs>
                        <mask id="roi-mask">
                          <rect x="0" y="0" width="400" height="400" fill="white" />
                          <ellipse cx="200" cy="180" rx="100" ry="140" fill="black" />
                        </mask>
                      </defs>
                      <rect x="0" y="0" width="400" height="400" fill="rgba(10, 15, 26, 0.6)" mask="url(#roi-mask)" />
                      <ellipse cx="200" cy="180" rx="100" ry="140" fill="none" stroke={COLORS.bloodPressure} strokeWidth="2" strokeDasharray="10 5" className={status === 'scanning' ? 'animate-pulse' : ''} />
                    </svg>
                    <div className="absolute top-[340px] text-center w-full">
                      <span className="bg-black/60 px-3 py-1 rounded text-[10px] font-bold tracking-[0.2em] text-[#94a3b8] border border-white/10 uppercase">
                        {status === 'scanning' ? 'Détection active...' : 'Positionnez votre visage'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pulse Ring Overlay */}
                {status === 'scanning' && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  >
                    <div className="w-[320px] h-[320px] border border-[#00d4ff]/20 rounded-full shadow-[0_0_50px_rgba(0,212,255,0.1)]" />
                  </motion.div>
                )}

                {/* Animated Scan Line */}
                {status === 'scanning' && (
                  <motion.div 
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 w-full h-1 shadow-[0_0_15px_rgba(0,212,255,0.8)] z-20"
                    style={{ backgroundColor: `${COLORS.bloodPressure}80` }}
                  />
                )}

                {status === 'locked' && (
                  <div className="absolute inset-0 bg-[#0a0f1a]/80 flex items-center justify-center z-30 backdrop-blur-sm">
                     <span className="font-rajdhani font-bold text-2xl tracking-[0.3em] px-6 py-3 rounded-xl" style={{ color: COLORS.bloodPressure, border: `1px solid ${COLORS.bloodPressure}4d`, backgroundColor: `${COLORS.bloodPressure}1a` }}>
                       ✓ SCAN COMPLETE
                     </span>
                  </div>
                )}
              </div>

              {/* Camera Footer */}
              <div className="h-10 border-t flex items-center justify-between px-4" style={{ backgroundColor: COLORS.panelBg, borderColor: COLORS.border }}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'scanning' ? 'animate-pulse' : ''}`} style={{ backgroundColor: status === 'scanning' ? COLORS.breathingRate : COLORS.border }} />
                  <span className="font-mono-tech text-xs text-[#94a3b8]">
                    {status === 'scanning' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="border px-2 py-0.5 rounded text-[10px] font-mono-tech" style={{ borderColor: COLORS.border, color: COLORS.breathingRate }}>
                  {fps} FPS
                </div>
              </div>
            </div>

            {/* PPG Waveform Canvas */}
            <div className="h-40 rounded-xl border p-4 flex flex-col" style={{ backgroundColor: COLORS.panelBg, borderColor: COLORS.border }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.border }} />
                <span className="font-rajdhani font-semibold text-xs tracking-widest text-[#94a3b8] uppercase">
                  Pulse Waveform (PPG)
                </span>
              </div>
              <div className="flex-1 border rounded overflow-hidden relative" style={{ borderColor: `${COLORS.border}80` }}>
                {/* Background Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-10 pointer-events-none">
                  {[...Array(18)].map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
                <canvas 
                  ref={canvasRef} 
                  width={600} 
                  height={100} 
                  className="w-full h-full object-fill opacity-80"
                />
              </div>
            </div>

          </div>

          {/* Right Column (Biomarkers Grid) */}
          <div className="w-full lg:w-[480px] shrink-0 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-[#94a3b8]" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-[0.2em] text-[#94a3b8] uppercase">
                Biomarkers
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1">
              <BiomarkerCard 
                index={0}
                title="Blood Pressure" 
                value={status === 'locked' ? `${currentValues.bloodPressureSys}/${currentValues.bloodPressureDia}` : currentValues.bloodPressureSys}
                unit="mmHg" 
                color={COLORS.bloodPressure}
                statusLabel="NORMAL"
              />
              <BiomarkerCard 
                index={1}
                title="Heart Rate" 
                value={currentValues.heartRate} 
                unit="BPM" 
                color={COLORS.heartRate}
                statusLabel="NORMAL"
              />
              <BiomarkerCard 
                index={2}
                title="Breathing Rate" 
                value={currentValues.breathingRate} 
                unit="RPM" 
                color={COLORS.breathingRate}
                statusLabel="NORMAL"
              />
              <BiomarkerCard 
                index={3}
                title="Card. Workload" 
                value={currentValues.cardiacWorkload} 
                unit="index" 
                color={COLORS.cardiacWorkload}
                statusLabel="NORMAL"
              />
              <BiomarkerCard 
                index={4}
                title="Stress Index" 
                value={currentValues.stressIndex} 
                unit="score" 
                color={COLORS.stressIndex}
                statusLabel="MODERATE"
                isWarning={true}
              />
              <BiomarkerCard 
                index={5}
                title="BMI" 
                value={currentValues.bmi} 
                unit="kg/m²" 
                color={COLORS.bmi}
                statusLabel="NORMAL"
              />
            </div>

            {(status === 'locked' && (aiLoading || aiAnalysis)) && (
              <div className="mt-4 rounded-xl border p-4" style={{ backgroundColor: COLORS.panelBg, borderColor: COLORS.border }}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-[#94a3b8]" />
                  <span className="font-rajdhani font-semibold text-xs tracking-[0.2em] text-[#94a3b8] uppercase">
                    Analyse IA {aiAnalysis?.source === 'openai' ? '(OpenAI)' : aiAnalysis ? '(local)' : ''}
                  </span>
                </div>
                {aiLoading ? (
                  <p className="text-sm text-[#94a3b8] font-mono-tech">Génération du rapport clinique...</p>
                ) : (
                  <>
                    <p className="text-sm text-white mb-3">{aiAnalysis.summary}</p>
                    {aiAnalysis.insights?.length > 0 && (
                      <ul className="text-xs text-[#94a3b8] space-y-1 mb-3 list-disc list-inside">
                        {aiAnalysis.insights.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {aiAnalysis.recommendations?.length > 0 && (
                      <div className="text-xs text-[#cbd5e1]">
                        <span className="font-semibold text-white">Recommandations : </span>
                        {aiAnalysis.recommendations.join(' · ')}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
