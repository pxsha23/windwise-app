import { useState, useEffect, useRef } from "react";
import "./App.css"; // ✅ added

const TurbineSVG = () => (
  <svg width="360" height="380" viewBox="0 0 400 420" className="turbine-svg">
    {/* Tower */}
    <polygon points="196,170 204,170 220,420 180,420" fill="rgba(0,212,170,0.15)" stroke="rgba(0,212,170,0.35)" strokeWidth="1"/>
    {/* Hub */}
    <circle cx="200" cy="160" r="14" fill="rgba(0,212,170,0.25)" stroke="rgba(0,212,170,0.6)" strokeWidth="1.5"/>
    {/* Blades */}
    <g className="blade-group">
      {/* Blade 1 */}
      <path d="M200 160 L212 80 L205 78 Z" fill="rgba(0,212,170,0.2)" stroke="rgba(0,212,170,0.5)" strokeWidth="1.2"/>
      {/* Blade 2 */}
      <path d="M200 160 L270 208 L268 200 Z" fill="rgba(0,212,170,0.2)" stroke="rgba(0,212,170,0.5)" strokeWidth="1.2"/>
      {/* Blade 3 */}
      <path d="M200 160 L130 208 L132 200 Z" fill="rgba(0,212,170,0.2)" stroke="rgba(0,212,170,0.5)" strokeWidth="1.2"/>
    </g>
    {/* Glow */}
    <circle cx="200" cy="160" r="30" fill="none" stroke="rgba(0,212,170,0.08)" strokeWidth="20"/>
    {/* Ground line */}
    <line x1="140" y1="420" x2="260" y2="420" stroke="rgba(0,212,170,0.2)" strokeWidth="1"/>
    {/* Data floats */}
    <text x="240" y="100" fill="rgba(0,212,170,0.4)" fontSize="11" fontFamily="Space Mono">92.4%</text>
    <text x="30" y="200" fill="rgba(0,212,170,0.35)" fontSize="11" fontFamily="Space Mono">±1.3 MAE</text>
    <text x="250" y="260" fill="rgba(0,212,170,0.3)" fontSize="11" fontFamily="Space Mono">PPO</text>
    <text x="60" y="320" fill="rgba(0,212,170,0.25)" fontSize="11" fontFamily="Space Mono">LSTM</text>
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
 
const HOURS = ["00", "03", "06", "09", "12", "15", "18", "21", "24"];
const BASE_BARS = [42, 55, 61, 78, 85, 92, 87, 74, 58];
 
export default function WindWise() {
  const [activeSection, setActiveSection] = useState("home");
  const [bars, setBars] = useState(BASE_BARS);
  const [power, setPower] = useState(74.2);
  const [stability, setStability] = useState(91.5);
  const [accuracy, setAccuracy] = useState(92.4);
  const [efficiency, setEfficiency] = useState(87.0);
  const animRef = useRef(null);
 
  useEffect(() => {
    animRef.current = setInterval(() => {
      setBars(prev => prev.map(v => Math.max(30, Math.min(100, v + (Math.random() - 0.48) * 8))));
      setPower(p => Math.max(60, Math.min(98, p + (Math.random() - 0.5) * 3)));
      setStability(s => Math.max(85, Math.min(99, s + (Math.random() - 0.5) * 1.5)));
    }, 2000);
    return () => clearInterval(animRef.current);
  }, []);
 
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
          <li><a href="#about">About</a></li>
        </ul>
        <button className="nav-cta">View Paper</button>
      </nav>
 
      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-tag">// Intelligent Wind Energy System</div>
        <h1 className="hero-h1">
          Predict.<br />
          <span>Schedule.</span><br />
          Optimize.
        </h1>
        <p className="hero-sub">
          A two-phase hybrid framework combining Physics-CNN-LSTM-XGBoost forecasting with
          Deep Reinforcement Learning grid scheduling for next-generation wind energy management.
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={() => document.getElementById('how').scrollIntoView({behavior:'smooth'})}>
            Explore Framework
          </button>
          <button className="btn-outline" onClick={() => document.getElementById('demo').scrollIntoView({behavior:'smooth'})}>
            Live Demo →
          </button>
        </div>
 
        <div className="turbine-wrap">
          <TurbineSVG />
        </div>
      </section>
 
      {/* STATS */}
      <div className="stats-bar">
        {[
          { num: "92.4%", label: "Forecast Accuracy" },
          { num: "±1.3", label: "MAE Improvement" },
          { num: "2-Phase", label: "Architecture" },
          { num: "PPO + SAC", label: "DRL Algorithms" },
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
              {["Physics Model", "CNN", "LSTM", "XGBoost"].map(t => (
                <span className="tech-tag" key={t}>{t}</span>
              ))}
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
              {["PPO", "SAC", "MDP", "Real-Time"].map(t => (
                <span className="tech-tag" key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
 
      {/* PIPELINE */}
      <section className="section pipeline-section" id="pipeline">
        <div className="section-tag">// Model Pipeline</div>
        <h2 className="section-h2">End-to-End<br />Data Flow</h2>
        <p className="section-desc">
          Raw atmospheric data flows through five sequential stages — each stage refined by the last —
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
          WindWise's integrated framework addresses energy challenges across the entire value chain
          — from offshore farm planning to urban smart-grid dispatch.
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
 
      {/* LIVE DEMO */}
      <section className="section demo-section" id="demo">
        <div className="section-tag">// Simulated Dashboard</div>
        <h2 className="section-h2">Live System<br />Monitor</h2>
        <p className="section-desc">
          Real-time simulation of the WindWise prediction and scheduling system.
          Values update every 2 seconds to reflect dynamic wind conditions.
        </p>
 
        <div className="demo-card">
          <div className="demo-grid">
            <div>
              <div className="demo-label">Current Power Output</div>
              <div className="demo-val">{power.toFixed(1)}%</div>
              <div className="demo-sub">of rated capacity · updating live</div>
 
              <div className="meter-wrap">
                {[
                  { label: "Forecast Accuracy", val: accuracy, set: setAccuracy },
                  { label: "Grid Stability", val: stability, set: setStability },
                  { label: "Scheduling Efficiency", val: efficiency, set: setEfficiency },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="meter-label">
                      <span>{m.label}</span>
                      <span>{m.val.toFixed(1)}%</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${m.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
 
            <div>
              <div className="demo-label">24-Hour Forecast (MW)</div>
              <div className="forecast-chart">
                <div className="chart-bars">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className={`bar${i === 4 ? " active" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="chart-labels">
                  {HOURS.map((h, i) => <span key={i}>{h}h</span>)}
                </div>
              </div>
 
              <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Algorithm", val: "PPO + SAC" },
                  { label: "Horizon", val: "24 hrs" },
                  { label: "Model Stage", val: "XGBoost" },
                  { label: "Grid State", val: "Optimal" },
                ].map((kv, i) => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.3)", padding: "14px 16px", border: "1px solid rgba(0,212,170,0.1)" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--mist)", fontFamily: "Space Mono", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{kv.label}</div>
                    <div style={{ fontFamily: "Bebas Neue", fontSize: "1.1rem", letterSpacing: 2, color: "var(--teal)" }}>{kv.val}</div>
                  </div>
                ))}
              </div>
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
          <p style={{ color: "var(--mist)", fontSize: "0.9rem", lineHeight: 1.75, maxWidth: 460 }}>
            By tightly coupling a stacked multi-model forecaster with a DRL-based scheduling engine,
            the system achieves superior performance over standalone approaches — reducing prediction
            errors, lowering operational costs, and improving grid reliability under high wind energy penetration.
          </p>
        </div>
        <div className="about-visual">
          {[
            { num: "4", label: "Model Stages" },
            { num: "2", label: "DRL Algorithms" },
            { num: "6", label: "Applications" },
            { num: "92%", label: "Accuracy" },
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
          <a href="#about">About</a>
        </div>
      </footer>
    </div>
  );
}
