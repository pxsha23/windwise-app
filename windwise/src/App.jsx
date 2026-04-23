import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const API = "http://localhost:5000";

const MONTH_NAMES = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function approxTheoreticalPower(ws) {
  if (ws < 3.5 || ws > 25) return 0;
  return Math.min(0.5 * 1.225 * 5026 * Math.pow(ws, 3) / 1000, 3600);
}

const TurbineSVG = ({ spinning = false }) => (
  <svg width="360" height="380" viewBox="0 0 400 420" className="turbine-svg">
    <polygon points="196,170 204,170 220,420 180,420" fill="rgba(0,212,170,0.15)" stroke="rgba(0,212,170,0.35)" strokeWidth="1"/>
    <circle cx="200" cy="160" r="14" fill="rgba(0,212,170,0.25)" stroke="rgba(0,212,170,0.6)" strokeWidth="1.5"/>
    <g className={spinning ? "blade-group spinning" : "blade-group"}>
      <path d="M200 160 L212 80 L205 78 Z" fill="rgba(0,212,170,0.2)" stroke="rgba(0,212,170,0.5)" strokeWidth="1.2"/>
      <path d="M200 160 L270 208 L268 200 Z" fill="rgba(0,212,170,0.2)" stroke="rgba(0,212,170,0.5)" strokeWidth="1.2"/>
      <path d="M200 160 L130 208 L132 200 Z" fill="rgba(0,212,170,0.2)" stroke="rgba(0,212,170,0.5)" strokeWidth="1.2"/>
    </g>
    <circle cx="200" cy="160" r="30" fill="none" stroke="rgba(0,212,170,0.08)" strokeWidth="20"/>
    <line x1="140" y1="420" x2="260" y2="420" stroke="rgba(0,212,170,0.2)" strokeWidth="1"/>
    <text x="240" y="100" fill="rgba(0,212,170,0.4)" fontSize="11" fontFamily="Space Mono">R²=0.972</text>
    <text x="30" y="200" fill="rgba(0,212,170,0.35)" fontSize="11" fontFamily="Space Mono">XGBoost</text>
    <text x="250" y="260" fill="rgba(0,212,170,0.3)" fontSize="11" fontFamily="Space Mono">50K rows</text>
    <text x="60" y="320" fill="rgba(0,212,170,0.25)" fontSize="11" fontFamily="Space Mono">SCADA</text>
  </svg>
);

const PIPELINE_STEPS = [
  { icon: "🌬️", name: "Physics Model", note: "Atmospheric conditions, fluid dynamics, turbine mechanics" },
  { icon: "🧠", name: "CNN Layer", note: "Spatial wind pattern extraction & short-term fluctuations" },
  { icon: "⏱️", name: "LSTM Layer", note: "Temporal dependencies & long-range sequence modeling" },
  { icon: "⚡", name: "XGBoost", note: "Residual error correction & nonlinear refinement" },
  { icon: "🤖", name: "DRL Agent", note: "PPO & SAC algorithms for real-time grid scheduling" },
];

const APPS = [
  { icon: "🏭", title: "Utility Wind Farms", desc: "Accurate day-ahead forecasting for large-scale wind and solar generation assets." },
  { icon: "🔋", title: "Microgrids & VPPs", desc: "Dynamic energy management for mixed-source virtual power plants and microgrids." },
  { icon: "📈", title: "Energy Trading", desc: "Reduce bidding uncertainty in electricity markets with layered stacked forecasts." },
  { icon: "⚖️", title: "Frequency Regulation", desc: "Sub-hourly prediction for grid stability as inverter-based sources displace generators." },
  { icon: "🏙️", title: "Smart City Grids", desc: "Multi-asset dispatch across rooftop solar, EVs, and district heating networks." },
  { icon: "🌊", title: "Offshore Wind", desc: "CNN spatial analysis on satellite data for optimal turbine placement & capacity assessment." },
];

const HOURS = ["00","03","06","09","12","15","18","21","24"];
const BASE_BARS = [42, 55, 61, 78, 85, 92, 87, 74, 58];

// ─── Power Curve Chart ────────────────────────────────────────────────────────
function PowerCurveChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const PAD = { top: 20, right: 20, bottom: 48, left: 60 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    const maxWS = 26, maxPW = 4000;
    const xScale = (v) => PAD.left + (v / maxWS) * chartW;
    const yScale = (v) => PAD.top + chartH - (v / maxPW) * chartH;

    // Grid lines
    ctx.strokeStyle = "rgba(0,212,170,0.08)";
    ctx.lineWidth = 1;
    [0, 1000, 2000, 3000, 4000].forEach((pw) => {
      ctx.beginPath();
      ctx.moveTo(PAD.left, yScale(pw));
      ctx.lineTo(PAD.left + chartW, yScale(pw));
      ctx.stroke();
    });
    [0, 5, 10, 15, 20, 25].forEach((ws) => {
      ctx.beginPath();
      ctx.moveTo(xScale(ws), PAD.top);
      ctx.lineTo(xScale(ws), PAD.top + chartH);
      ctx.stroke();
    });

    // Theoretical curve
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,212,170,0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    data.forEach((d, i) => {
      if (i === 0) ctx.moveTo(xScale(d.wind_speed), yScale(d.theoretical));
      else ctx.lineTo(xScale(d.wind_speed), yScale(d.theoretical));
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual curve
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,212,170,0.9)";
    ctx.lineWidth = 2.5;
    data.forEach((d, i) => {
      if (i === 0) ctx.moveTo(xScale(d.wind_speed), yScale(d.actual));
      else ctx.lineTo(xScale(d.wind_speed), yScale(d.actual));
    });
    ctx.stroke();

    // Scatter dots
    data.forEach((d) => {
      ctx.beginPath();
      ctx.arc(xScale(d.wind_speed), yScale(d.actual), 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,212,170,0.7)";
      ctx.fill();
    });

    // Axes labels
    ctx.fillStyle = "rgba(0,212,170,0.5)";
    ctx.font = "11px Space Mono, monospace";
    ctx.textAlign = "center";
    [0, 5, 10, 15, 20, 25].forEach((ws) => {
      ctx.fillText(`${ws}`, xScale(ws), PAD.top + chartH + 18);
    });
    ctx.fillText("Wind Speed (m/s)", PAD.left + chartW / 2, H - 6);

    ctx.textAlign = "right";
    [0, 1000, 2000, 3000, 4000].forEach((pw) => {
      ctx.fillText(`${pw}`, PAD.left - 8, yScale(pw) + 4);
    });
    ctx.save();
    ctx.translate(14, PAD.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Power (kW)", 0, 0);
    ctx.restore();

    // Cut-in annotation
    ctx.strokeStyle = "rgba(255,180,0,0.4)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xScale(3.5), PAD.top);
    ctx.lineTo(xScale(3.5), PAD.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,180,0,0.7)";
    ctx.font = "10px Space Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("cut-in 3.5 m/s", xScale(3.5) + 4, PAD.top + 14);

    // Legend
    ctx.fillStyle = "rgba(0,212,170,0.9)";
    ctx.fillRect(PAD.left + chartW - 130, PAD.top + 4, 16, 3);
    ctx.fillStyle = "rgba(0,212,170,0.5)";
    ctx.font = "10px Space Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Actual power", PAD.left + chartW - 108, PAD.top + 10);

    ctx.strokeStyle = "rgba(0,212,170,0.35)";
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(PAD.left + chartW - 130, PAD.top + 22);
    ctx.lineTo(PAD.left + chartW - 114, PAD.top + 22);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText("Theoretical", PAD.left + chartW - 108, PAD.top + 26);
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={680}
      height={280}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
}

// ─── Heatmap Chart ────────────────────────────────────────────────────────────
function HeatmapChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));

  const cell = (month, hour) => {
    const d = data.find((x) => x.month === month && x.hour === hour);
    if (!d) return 0;
    const t = (d.value - minVal) / (maxVal - minVal);
    return { t, value: d.value };
  };

  const tealAlpha = (t) => `rgba(0,212,170,${(0.08 + t * 0.85).toFixed(2)})`;
  const textColor = (t) => t > 0.55 ? "rgba(0,40,30,0.9)" : "rgba(0,212,170,0.8)";

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `48px repeat(24, 1fr)`, gap: 1, minWidth: 600 }}>
        {/* Header row */}
        <div style={{ fontSize: 9, color: "rgba(0,212,170,0.4)", display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>Month</div>
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{ fontSize: 9, color: "rgba(0,212,170,0.4)", textAlign: "center", paddingBottom: 4, fontFamily: "Space Mono" }}>
            {h % 6 === 0 ? `${h}h` : ""}
          </div>
        ))}
        {/* Rows */}
        {Array.from({ length: 12 }, (_, mi) => {
          const month = mi + 1;
          return [
            <div key={`label-${month}`} style={{ fontSize: 10, color: "rgba(0,212,170,0.6)", display: "flex", alignItems: "center", fontFamily: "Space Mono" }}>
              {MONTH_NAMES[month]}
            </div>,
            ...Array.from({ length: 24 }, (_, hour) => {
              const c = cell(month, hour);
              return (
                <div
                  key={`${month}-${hour}`}
                  title={`${MONTH_NAMES[month]} ${hour}:00 → ${c.value?.toFixed(0)} kW`}
                  style={{
                    height: 22,
                    background: tealAlpha(c.t),
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              );
            }),
          ];
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 10, color: "rgba(0,212,170,0.5)", fontFamily: "Space Mono" }}>Low ({minVal.toFixed(0)} kW)</span>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "linear-gradient(to right, rgba(0,212,170,0.08), rgba(0,212,170,0.93))" }} />
        <span style={{ fontSize: 10, color: "rgba(0,212,170,0.5)", fontFamily: "Space Mono" }}>High ({maxVal.toFixed(0)} kW)</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WindWise() {
  const [bars, setBars]           = useState(BASE_BARS);
  const [power, setPower]         = useState(74.2);
  const [stability, setStability] = useState(91.5);
  const [accuracy]                = useState(92.4);
  const [efficiency]              = useState(87.0);
  const animRef                   = useRef(null);

  // API status
  const [apiOnline, setApiOnline] = useState(null);

  // Single prediction
  const [windSpeed,     setWindSpeed]     = useState(8.5);
  const [windDirection, setWindDirection] = useState(60);
  const [predResult,    setPredResult]    = useState(null);
  const [predLoading,   setPredLoading]   = useState(false);
  const [predError,     setPredError]     = useState(null);

  // Power curve
  const [pcData,      setPcData]      = useState(null);
  const [pcLoading,   setPcLoading]   = useState(false);

  // Heatmap
  const [hmData,      setHmData]      = useState(null);
  const [hmLoading,   setHmLoading]   = useState(false);

  // Batch upload
  const [batchFile,     setBatchFile]     = useState(null);
  const [batchLoading,  setBatchLoading]  = useState(false);
  const [batchResult,   setBatchResult]   = useState(null);
  const [batchError,    setBatchError]    = useState(null);
  const fileInputRef = useRef(null);

  // Active analytics tab
  const [analyticsTab, setAnalyticsTab] = useState("powercurve");

  // Check API health on mount; load chart data
  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false));
  }, []);

  // Load power curve when tab activated
  useEffect(() => {
    if (analyticsTab === "powercurve" && !pcData && !pcLoading) {
      setPcLoading(true);
      fetch(`${API}/data/powercurve`)
        .then(r => r.json())
        .then(d => { setPcData(d); setPcLoading(false); })
        .catch(() => setPcLoading(false));
    }
    if (analyticsTab === "heatmap" && !hmData && !hmLoading) {
      setHmLoading(true);
      fetch(`${API}/data/heatmap`)
        .then(r => r.json())
        .then(d => { setHmData(d); setHmLoading(false); })
        .catch(() => setHmLoading(false));
    }
  }, [analyticsTab]);

  // Animated bars
  useEffect(() => {
    animRef.current = setInterval(() => {
      setBars(prev => prev.map(v => Math.max(30, Math.min(100, v + (Math.random() - 0.48) * 8))));
      if (!predResult) setPower(p => Math.max(60, Math.min(98, p + (Math.random() - 0.5) * 3)));
      setStability(s => Math.max(85, Math.min(99, s + (Math.random() - 0.5) * 1.5)));
    }, 2000);
    return () => clearInterval(animRef.current);
  }, [predResult]);

  // Single prediction handler
  const handlePredict = useCallback(async () => {
    setPredLoading(true);
    setPredError(null);
    setPredResult(null);
    try {
      const now   = new Date();
      const month = now.getMonth() + 1;
      const hour  = now.getHours();
      const week  = Math.ceil(((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);

      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wind_speed:        windSpeed,
          wind_direction:    windDirection,
          theoretical_power: approxTheoreticalPower(windSpeed),
          month, hour, week,
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setPredResult(data);
      setPower(data.capacity_pct);
    } catch (err) {
      setPredError(err.message);
    } finally {
      setPredLoading(false);
    }
  }, [windSpeed, windDirection]);

  // Batch upload handler
  const handleBatchUpload = useCallback(async () => {
    if (!batchFile) return;
    setBatchLoading(true);
    setBatchError(null);
    setBatchResult(null);
    try {
      const formData = new FormData();
      formData.append("file", batchFile);
      const res = await fetch(`${API}/predict/batch`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setBatchResult(url);
    } catch (err) {
      setBatchError(err.message);
    } finally {
      setBatchLoading(false);
    }
  }, [batchFile]);

  const ApiBadge = () => (
    <div style={{ marginBottom: 20 }}>
      {apiOnline === null && <span style={{ fontSize: "0.75rem", color: "rgba(0,212,170,0.5)", fontFamily: "Space Mono" }}>checking backend…</span>}
      {apiOnline === true  && <span style={{ fontSize: "0.75rem", color: "#00d4aa", fontFamily: "Space Mono" }}>● Flask API online · localhost:5000</span>}
      {apiOnline === false && <span style={{ fontSize: "0.75rem", color: "#ff6b6b", fontFamily: "Space Mono" }}>● Flask API offline — run <code style={{ background: "rgba(255,107,107,0.1)", padding: "2px 6px" }}>python app.py</code></span>}
    </div>
  );

  const tabStyle = (active) => ({
    padding: "8px 20px",
    fontFamily: "Bebas Neue, sans-serif",
    fontSize: "0.9rem",
    letterSpacing: 2,
    border: active ? "1px solid rgba(0,212,170,0.6)" : "1px solid rgba(0,212,170,0.15)",
    color: active ? "#00d4aa" : "rgba(0,212,170,0.5)",
    background: active ? "rgba(0,212,170,0.1)" : "transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  });

  return (
    <div className="ww-root">

      {/* NAV */}
      <nav>
        <div className="nav-logo">WindWise</div>
        <ul className="nav-links">
          <li><a href="#how">How It Works</a></li>
          <li><a href="#pipeline">Pipeline</a></li>
          <li><a href="#applications">Applications</a></li>
          <li><a href="#demo">Live Demo</a></li>
          <li><a href="#analytics">Analytics</a></li>
          <li><a href="#batch">Batch</a></li>
          <li><a href="#about">About</a></li>
        </ul>
        <button className="nav-cta">View Paper</button>
      </nav>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-tag">// Intelligent Wind Energy System</div>
        <h1 className="hero-h1">Predict.<br /><span>Schedule.</span><br />Optimize.</h1>
        <p className="hero-sub">
          A two-phase hybrid framework combining Physics-CNN-LSTM-XGBoost forecasting with
          Deep Reinforcement Learning grid scheduling for next-generation wind energy management.
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })}>
            Explore Framework
          </button>
          <button className="btn-outline" onClick={() => document.getElementById("demo").scrollIntoView({ behavior: "smooth" })}>
            Live Demo →
          </button>
        </div>
        <div className="turbine-wrap">
          <TurbineSVG spinning={predLoading} />
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        {[
          { num: "97.2%", label: "Model R²" },
          { num: "218 kW", label: "RMSE" },
          { num: "50,530", label: "SCADA Rows" },
          { num: "3,600 kW", label: "Rated Capacity" },
        ].map((s, i) => (
          <div className="stat-item" key={i}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-tag">// Framework</div>
        <h2 className="section-h2">Two-Phase<br />Architecture</h2>
        <p className="section-desc">
          WindWise couples a stacked hybrid forecaster with an intelligent DRL scheduling agent —
          enabling the grid to adapt in real-time despite weather uncertainty.
        </p>
        <div className="phases">
          <div className="phase-card">
            <div className="phase-num">01</div>
            <div className="phase-badge">Phase 1</div>
            <h3 className="phase-title">Hybrid Stacked Forecasting</h3>
            <p className="phase-desc">
              A physics-informed foundation captures atmospheric and turbine dynamics.
              CNN layers extract spatial wind patterns; LSTM models temporal evolution.
              XGBoost finalizes predictions by correcting residual errors from earlier stages.
            </p>
            <div className="tech-tags">
              {["Physics Model","CNN","LSTM","XGBoost"].map(t => <span className="tech-tag" key={t}>{t}</span>)}
            </div>
          </div>
          <div className="phase-card">
            <div className="phase-num">02</div>
            <div className="phase-badge">Phase 2</div>
            <h3 className="phase-title">DRL Grid Scheduling</h3>
            <p className="phase-desc">
              Forecast outputs feed directly into a Deep Reinforcement Learning agent.
              Using PPO and SAC algorithms, the agent learns optimal power distribution,
              storage dispatch, and stability control under real-world uncertainty.
            </p>
            <div className="tech-tags">
              {["PPO","SAC","MDP","Real-Time"].map(t => <span className="tech-tag" key={t}>{t}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="section pipeline-section" id="pipeline">
        <div className="section-tag">// Model Pipeline</div>
        <h2 className="section-h2">End-to-End<br />Data Flow</h2>
        <p className="section-desc">
          Raw atmospheric data flows through five sequential stages — each refined by the last —
          culminating in real-time grid scheduling decisions.
        </p>
        <div className="pipeline">
          {PIPELINE_STEPS.map((s, i) => (
            <div className="pipe-step" key={i}>
              <div className="pipe-box">
                <div className="pipe-icon">{s.icon}</div>
                <div className="pipe-name">{s.name}</div>
                <div className="pipe-note">{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* APPLICATIONS */}
      <section className="section" id="applications">
        <div className="section-tag">// Use Cases</div>
        <h2 className="section-h2">Real-World<br />Applications</h2>
        <p className="section-desc">
          WindWise's integrated framework addresses energy challenges across the entire value chain.
        </p>
        <div className="apps-grid">
          {APPS.map((a, i) => (
            <div className="app-card" key={i}>
              <span className="app-icon">{a.icon}</span>
              <div className="app-title">{a.title}</div>
              <div className="app-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE DEMO ──────────────────────────────────────────────────────── */}
      <section className="section demo-section" id="demo">
        <div className="section-tag">// Live Prediction</div>
        <h2 className="section-h2">Real Model<br />Prediction</h2>
        <p className="section-desc">
          XGBoost model trained on 50,530 SCADA records (R²&nbsp;=&nbsp;0.972).
          Adjust wind conditions and hit <em>Predict</em> to get an actual kW estimate with confidence interval.
        </p>
        <ApiBadge />

        <div className="demo-card">
          <div className="demo-grid">

            {/* LEFT — inputs + result */}
            <div>
              <div className="demo-label">Wind Speed (m/s)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <input type="range" min="0" max="25" step="0.5" value={windSpeed}
                  onChange={e => { setWindSpeed(parseFloat(e.target.value)); setPredResult(null); }}
                  style={{ flex: 1, accentColor: "#00d4aa" }} />
                <span style={{ fontFamily: "Bebas Neue", fontSize: "1.4rem", color: "#00d4aa", minWidth: 60 }}>
                  {windSpeed.toFixed(1)} m/s
                </span>
              </div>

              <div className="demo-label">Wind Direction (°)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                <input type="range" min="0" max="360" step="5" value={windDirection}
                  onChange={e => { setWindDirection(parseFloat(e.target.value)); setPredResult(null); }}
                  style={{ flex: 1, accentColor: "#00d4aa" }} />
                <span style={{ fontFamily: "Bebas Neue", fontSize: "1.4rem", color: "#00d4aa", minWidth: 60 }}>
                  {windDirection}°
                </span>
              </div>

              <button onClick={handlePredict} disabled={predLoading || apiOnline === false}
                style={{
                  width: "100%", padding: "14px 0",
                  background: predLoading ? "rgba(0,212,170,0.08)" : "rgba(0,212,170,0.15)",
                  border: "1px solid rgba(0,212,170,0.5)", color: "#00d4aa",
                  fontFamily: "Bebas Neue", fontSize: "1.05rem", letterSpacing: 3,
                  cursor: predLoading || apiOnline === false ? "not-allowed" : "pointer",
                }}>
                {predLoading ? "Predicting…" : "⚡  Run Prediction"}
              </button>

              {predError && (
                <div style={{ marginTop: 12, color: "#ff6b6b", fontSize: "0.8rem", fontFamily: "Space Mono" }}>
                  Error: {predError}
                </div>
              )}

              {predResult && (
                <div style={{ marginTop: 24 }}>
                  <div className="demo-label">Predicted Power Output</div>
                  <div className="demo-val">{predResult.predicted_power_kw.toFixed(0)} kW</div>
                  <div className="demo-sub">{predResult.capacity_pct}% of rated · {predResult.season}</div>

                  {/* Capacity bar */}
                  <div className="meter-track" style={{ marginTop: 10, marginBottom: 16 }}>
                    <div className="meter-fill" style={{ width: `${Math.min(predResult.capacity_pct, 100)}%`, transition: "width 0.8s ease" }} />
                  </div>

                  {/* Confidence interval */}
                  <div style={{ background: "rgba(0,0,0,0.25)", padding: "12px 16px", border: "1px solid rgba(0,212,170,0.12)", marginTop: 4 }}>
                    <div style={{ fontSize: "0.65rem", color: "rgba(0,212,170,0.5)", fontFamily: "Space Mono", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                      95% Confidence Interval
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                      <span style={{ fontFamily: "Bebas Neue", fontSize: "1rem", color: "rgba(0,212,170,0.6)" }}>
                        {predResult.ci_lower_kw.toFixed(0)} kW
                      </span>
                      <div style={{ flex: 1, margin: "0 10px", height: 4, background: "rgba(0,212,170,0.08)", borderRadius: 2, position: "relative" }}>
                        <div style={{
                          position: "absolute",
                          left: `${(predResult.ci_lower_kw / 3600 * 100).toFixed(1)}%`,
                          width: `${((predResult.ci_upper_kw - predResult.ci_lower_kw) / 3600 * 100).toFixed(1)}%`,
                          height: "100%", background: "rgba(0,212,170,0.4)", borderRadius: 2,
                        }} />
                        <div style={{
                          position: "absolute",
                          left: `${(predResult.predicted_power_kw / 3600 * 100).toFixed(1)}%`,
                          width: 8, height: 8, borderRadius: "50%",
                          background: "#00d4aa", top: -2, transform: "translateX(-50%)",
                        }} />
                      </div>
                      <span style={{ fontFamily: "Bebas Neue", fontSize: "1rem", color: "rgba(0,212,170,0.6)" }}>
                        {predResult.ci_upper_kw.toFixed(0)} kW
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!predResult && (
                <div style={{ marginTop: 20 }}>
                  <div className="demo-label">Simulated Output</div>
                  <div className="demo-val">{power.toFixed(1)}%</div>
                  <div className="demo-sub">of rated capacity · simulated</div>
                  <div className="meter-wrap">
                    {[
                      { label: "Forecast Accuracy", val: accuracy },
                      { label: "Grid Stability",    val: stability },
                      { label: "Scheduling Eff.",   val: efficiency },
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="meter-label"><span>{m.label}</span><span>{m.val.toFixed(1)}%</span></div>
                        <div className="meter-track"><div className="meter-fill" style={{ width: `${m.val}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — forecast bars + meta */}
            <div>
              <div className="demo-label">24-Hour Forecast (MW)</div>
              <div className="forecast-chart">
                <div className="chart-bars">
                  {bars.map((h, i) => (
                    <div key={i} className={`bar${i === 4 ? " active" : ""}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="chart-labels">
                  {HOURS.map((h, i) => <span key={i}>{h}h</span>)}
                </div>
              </div>

              <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Algorithm",    val: "XGBoost" },
                  { label: "Training R²",  val: "0.972" },
                  { label: "SCADA Rows",   val: "50,530" },
                  { label: "Turbine Cap.", val: "3,600 kW" },
                ].map((kv, i) => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.3)", padding: "14px 16px", border: "1px solid rgba(0,212,170,0.1)" }}>
                    <div style={{ fontSize: "0.65rem", color: "rgba(0,212,170,0.4)", fontFamily: "Space Mono", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{kv.label}</div>
                    <div style={{ fontFamily: "Bebas Neue", fontSize: "1.1rem", letterSpacing: 2, color: "#00d4aa" }}>{kv.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ANALYTICS — Power Curve + Heatmap ─────────────────────────────── */}
      <section className="section" id="analytics">
        <div className="section-tag">// Dataset Analytics</div>
        <h2 className="section-h2">Visualize<br />Real SCADA Data</h2>
        <p className="section-desc">
          Charts rendered from all 50,530 records — power curve and temporal heatmap
          derived directly from the turbine's operational history.
        </p>
        <ApiBadge />

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button style={tabStyle(analyticsTab === "powercurve")} onClick={() => setAnalyticsTab("powercurve")}>
            Power Curve
          </button>
          <button style={tabStyle(analyticsTab === "heatmap")} onClick={() => setAnalyticsTab("heatmap")}>
            Monthly Heatmap
          </button>
        </div>

        <div className="demo-card">
          {analyticsTab === "powercurve" && (
            <div>
              <div className="demo-label" style={{ marginBottom: 16 }}>
                Actual vs Theoretical Power Curve · Wind Speed → Power Output
              </div>
              {pcLoading && <div style={{ color: "rgba(0,212,170,0.5)", fontFamily: "Space Mono", fontSize: "0.8rem" }}>Loading data…</div>}
              {pcData && <PowerCurveChart data={pcData} />}
              {!pcLoading && !pcData && apiOnline === false && (
                <div style={{ color: "#ff6b6b", fontFamily: "Space Mono", fontSize: "0.8rem" }}>Start Flask API to load chart data.</div>
              )}
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Cut-in speed", val: "3.5 m/s" },
                  { label: "Rated speed",  val: "~12 m/s" },
                  { label: "Rated power",  val: "3,600 kW" },
                ].map((kv, i) => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.25)", padding: "12px 14px", border: "1px solid rgba(0,212,170,0.1)" }}>
                    <div style={{ fontSize: "0.6rem", color: "rgba(0,212,170,0.4)", fontFamily: "Space Mono", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{kv.label}</div>
                    <div style={{ fontFamily: "Bebas Neue", fontSize: "1.1rem", letterSpacing: 2, color: "#00d4aa" }}>{kv.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyticsTab === "heatmap" && (
            <div>
              <div className="demo-label" style={{ marginBottom: 16 }}>
                Average Power Output (kW) by Month × Hour · Full Year 2018
              </div>
              {hmLoading && <div style={{ color: "rgba(0,212,170,0.5)", fontFamily: "Space Mono", fontSize: "0.8rem" }}>Loading data…</div>}
              {hmData && <HeatmapChart data={hmData} />}
              {!hmLoading && !hmData && apiOnline === false && (
                <div style={{ color: "#ff6b6b", fontFamily: "Space Mono", fontSize: "0.8rem" }}>Start Flask API to load chart data.</div>
              )}
              <div style={{ marginTop: 16, fontSize: "0.78rem", color: "rgba(0,212,170,0.5)", fontFamily: "Space Mono", lineHeight: 1.7 }}>
                Insight: Peak production in Mar & Aug. Night hours (20h–04h) consistently outperform daytime — thermal boundary layer lowers turbulence at night.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── BATCH PREDICTION ─────────────────────────────────────────────────── */}
      <section className="section" id="batch">
        <div className="section-tag">// Batch Processing</div>
        <h2 className="section-h2">Predict From<br />Your CSV</h2>
        <p className="section-desc">
          Upload a CSV with wind readings — get back predicted power for every row as a download.
          Required columns: <code>Wind Speed (m/s)</code>, <code>Wind Direction (°)</code>, <code>Theoretical_Power_Curve (KWh)</code>.
        </p>
        <ApiBadge />

        <div className="demo-card">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed rgba(0,212,170,${batchFile ? "0.6" : "0.25"})`,
                borderRadius: 4, padding: "32px 24px", textAlign: "center",
                cursor: "pointer", transition: "border-color 0.2s",
                background: batchFile ? "rgba(0,212,170,0.05)" : "transparent",
              }}
            >
              <div style={{ fontFamily: "Bebas Neue", fontSize: "1rem", letterSpacing: 2, color: "#00d4aa", marginBottom: 6 }}>
                {batchFile ? `📄 ${batchFile.name}` : "Click to select CSV"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(0,212,170,0.4)", fontFamily: "Space Mono" }}>
                {batchFile ? `${(batchFile.size / 1024).toFixed(1)} KB · ready to process` : "CSV with wind speed, direction, theoretical power"}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={e => {
                  setBatchFile(e.target.files[0]);
                  setBatchResult(null);
                  setBatchError(null);
                }}
              />
            </div>

            <button
              onClick={handleBatchUpload}
              disabled={!batchFile || batchLoading || apiOnline === false}
              style={{
                padding: "14px 0",
                background: batchLoading ? "rgba(0,212,170,0.08)" : "rgba(0,212,170,0.15)",
                border: "1px solid rgba(0,212,170,0.5)", color: "#00d4aa",
                fontFamily: "Bebas Neue", fontSize: "1rem", letterSpacing: 3,
                cursor: !batchFile || batchLoading || apiOnline === false ? "not-allowed" : "pointer",
              }}
            >
              {batchLoading ? "Processing…" : "⚡  Run Batch Prediction"}
            </button>

            {batchError && (
              <div style={{ color: "#ff6b6b", fontSize: "0.8rem", fontFamily: "Space Mono" }}>
                Error: {batchError}
              </div>
            )}

            {batchResult && (
              <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.3)", padding: "16px", borderRadius: 4 }}>
                <div style={{ fontFamily: "Bebas Neue", fontSize: "1rem", letterSpacing: 2, color: "#00d4aa", marginBottom: 8 }}>
                  Predictions ready
                </div>
                <a
                  href={batchResult}
                  download="predictions.csv"
                  style={{
                    display: "inline-block", padding: "10px 24px",
                    background: "rgba(0,212,170,0.2)", border: "1px solid rgba(0,212,170,0.5)",
                    color: "#00d4aa", fontFamily: "Bebas Neue", fontSize: "0.9rem",
                    letterSpacing: 2, textDecoration: "none",
                  }}
                >
                  Download predictions.csv
                </a>
              </div>
            )}

            <div style={{ fontSize: "0.72rem", color: "rgba(0,212,170,0.35)", fontFamily: "Space Mono", lineHeight: 1.8, marginTop: 4 }}>
              Optional columns: Month (1–12), Hour (0–23), Week (1–52)<br />
              Output adds: Predicted_Power_kW, Capacity_pct
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-section" id="about">
        <div>
          <div className="section-tag">// Project</div>
          <h2 className="section-h2">About<br />WindWise</h2>
          <p className="section-desc" style={{ marginBottom: 28 }}>
            WindWise is a research-driven framework developed to address the dual challenges of
            wind power prediction accuracy and intelligent grid resource scheduling.
          </p>
          <p style={{ color: "rgba(0,212,170,0.5)", fontSize: "0.9rem", lineHeight: 1.75, maxWidth: 460 }}>
            By tightly coupling a stacked multi-model forecaster with a DRL-based scheduling engine,
            the system achieves superior performance over standalone approaches — reducing prediction
            errors, lowering operational costs, and improving grid reliability.
          </p>
        </div>
        <div className="about-visual">
          {[
            { num: "4", label: "Model Stages" },
            { num: "2", label: "DRL Algorithms" },
            { num: "6", label: "Applications" },
            { num: "97%", label: "R² Score" },
          ].map((t, i) => (
            <div className="about-tile" key={i}>
              <div className="about-tile-num">{t.num}</div>
              <div className="about-tile-label">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">WindWise</div>
        <div className="footer-copy">© 2025 WindWise Research Project · All rights reserved</div>
        <div className="footer-links">
          <a href="#how">Framework</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#demo">Demo</a>
          <a href="#analytics">Analytics</a>
          <a href="#batch">Batch</a>
          <a href="#about">About</a>
        </div>
      </footer>

    </div>
  );
}
