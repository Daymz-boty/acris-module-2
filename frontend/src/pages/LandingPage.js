// ============================================================================
// LandingPage.js — ACRIS · Mission Control Home
// ============================================================================
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const modules = [
    {
      to:      "/wildfire",
      icon:    "🔥",
      label:   "MODULE 1",
      title:   "Wildfire Intelligence",
      desc:    "Monitor active fires, thermal anomalies, DBSCAN clusters, and brightness hotspots across Africa in near-real-time.",
      active:  true,
      color:   "#ef4444",
    },
    {
      to:      "/desertification",
      icon:    "🌿",
      label:   "MODULE 2",
      title:   "Desertification & Forest Intelligence",
      desc:    "Track vegetation health, NDVI anomalies, forest cluster status, land degradation risk, and fire-vegetation causality.",
      active:  true,
      color:   "#22c55e",
    },
    {
      icon:    "🌵",
      label:   "MODULE 3",
      title:   "Drought Intelligence",
      desc:    "Coming Soon",
      active:  false,
      color:   "#6b7280",
    },
    {
      icon:    "🌊",
      label:   "MODULE 4",
      title:   "Flood Risk",
      desc:    "Coming Soon",
      active:  false,
      color:   "#6b7280",
    },
    {
      icon:    "🌾",
      label:   "MODULE 5",
      title:   "Crop Failure",
      desc:    "Coming Soon",
      active:  false,
      color:   "#6b7280",
    },
  ];

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
    html, body { height: 100%; overflow-y: auto; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:#0a0f0a; }
    ::-webkit-scrollbar-thumb { background:#1e3a1e; border-radius:2px; }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
    @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
    .module-card { transition: transform 0.2s, box-shadow 0.2s; }
    .module-card:hover { transform: translateY(-3px); }
    .module-link { text-decoration:none; }
    .stat-num { font-family:'JetBrains Mono',monospace; }
  `;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ background:"#0a0f0a", color:"#f0fdf0", minHeight:"100vh", overflowY:"auto", fontFamily:"'Syne',sans-serif" }}>

        {/* Nav */}
        <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", height:56, background:"#0f1a0f", borderBottom:"1px solid #1e3a1e", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#22c55e,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#0a0f0a" }}>A</div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, letterSpacing:2, color:"#22c55e" }}>ACRIS</div>
              <div style={{ fontSize:8, color:"#6b7280", letterSpacing:2, marginTop:-2, fontFamily:"'JetBrains Mono',monospace" }}>CLIMATE RISK INTELLIGENCE</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {isAuthenticated() ? (
              <>
                <span style={{ fontSize:11, color:"#86efac", fontFamily:"'JetBrains Mono',monospace" }}>
                  {user?.name || user?.email}
                </span>
                <button onClick={handleLogout} style={{ padding:"6px 14px", borderRadius:6, background:"transparent", border:"1px solid #1e3a1e", color:"#6b7280", fontSize:11, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" style={{ padding:"6px 16px", borderRadius:6, background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#0a0f0a", fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", textDecoration:"none" }}>
                Sign In
              </Link>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign:"center", padding:"80px 24px 60px", animation:"fadeUp 0.6s ease" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"4px 14px", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:20, marginBottom:24 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:10, color:"#22c55e", fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>LIVE INTELLIGENCE PLATFORM</span>
          </div>
          <h1 style={{ fontSize:"clamp(36px,6vw,64px)", fontWeight:800, letterSpacing:3, marginBottom:16, lineHeight:1.1 }}>
            <span style={{ color:"#22c55e" }}>ACRIS</span>
          </h1>
          <p style={{ fontSize:"clamp(16px,2.5vw,20px)", color:"#86efac", maxWidth:600, margin:"0 auto 12px", lineHeight:1.6 }}>
            African Climate Risk Intelligence System
          </p>
          <p style={{ fontSize:14, color:"#6b7280", maxWidth:520, margin:"0 auto", lineHeight:1.7 }}>
            Transforming satellite data into actionable environmental intelligence. Real-time monitoring of wildfire, desertification, and ecosystem health across the African continent.
          </p>

          {/* Stats strip */}
          <div style={{ display:"flex", justifyContent:"center", gap:48, marginTop:48, flexWrap:"wrap" }}>
            {[
              { val:"566",    label:"Forest Clusters Tracked" },
              { val:"54",     label:"African Countries" },
              { val:"0.1°",   label:"Grid Resolution" },
              { val:"NASA",   label:"FIRMS Satellite Data" },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <div className="stat-num" style={{ fontSize:28, fontWeight:800, color:"#22c55e" }}>{s.val}</div>
                <div style={{ fontSize:10, color:"#6b7280", letterSpacing:1, marginTop:2, textTransform:"uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section style={{ padding:"40px 24px", background:"#0f1a0f", borderTop:"1px solid #1e3a1e", borderBottom:"1px solid #1e3a1e" }}>
          <div style={{ maxWidth:800, margin:"0 auto", textAlign:"center" }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:"#f0fdf0", marginBottom:12, letterSpacing:1 }}>What is ACRIS?</h2>
            <p style={{ color:"#6b7280", lineHeight:1.8, fontSize:14 }}>
              ACRIS integrates NASA FIRMS satellite data, Hansen Global Forest Change datasets, GPM IMERG rainfall rasters, and PostGIS spatial analytics to deliver real-time environmental risk intelligence across Africa. Each module provides policymakers, NGOs, and environmental agencies with the data they need to act before conditions become irreversible.
            </p>
          </div>
        </section>

        {/* Dashboards */}
        <section style={{ padding:"64px 24px" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <h2 style={{ fontSize:22, fontWeight:700, letterSpacing:2, color:"#f0fdf0", marginBottom:8 }}>Intelligence Modules</h2>
            <p style={{ fontSize:12, color:"#6b7280", fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>SELECT A MODULE TO ENTER THE DASHBOARD</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, maxWidth:980, margin:"0 auto" }}>
            {modules.map((m, i) => {
              const card = (
                <div className="module-card" style={{ background:"#111d11", border:`1px solid ${m.active ? m.color + "44" : "#1e3a1e"}`, borderRadius:14, padding:24, cursor:m.active?"pointer":"not-allowed", opacity:m.active?1:0.5, position:"relative", overflow:"hidden", boxShadow:m.active?`0 0 0 1px ${m.color}11`:"none" }}>
                  {m.active && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${m.color}66,transparent)` }} />}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <span style={{ fontSize:22 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize:9, color:m.active?m.color:"#6b7280", fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, fontWeight:700 }}>{m.label}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#f0fdf0", marginTop:1 }}>{m.title}</div>
                    </div>
                    {m.active && (
                      <div style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%", background:m.color, animation:"pulse 2.5s infinite", flexShrink:0 }} />
                    )}
                  </div>
                  <p style={{ fontSize:12, color:"#6b7280", lineHeight:1.6 }}>{m.desc}</p>
                  {m.active && (
                    <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:6, fontSize:11, color:m.color, fontFamily:"'JetBrains Mono',monospace" }}>
                      <span>ENTER MODULE</span>
                      <span>→</span>
                    </div>
                  )}
                </div>
              );

              return m.active
                ? <Link key={i} to={m.to} className="module-link">{card}</Link>
                : <div key={i}>{card}</div>;
            })}
          </div>
        </section>

        {/* Why it matters */}
        <section style={{ padding:"48px 24px", background:"#0f1a0f", borderTop:"1px solid #1e3a1e" }}>
          <div style={{ maxWidth:760, margin:"0 auto", textAlign:"center" }}>
            <h2 style={{ fontSize:20, fontWeight:700, marginBottom:12, color:"#f0fdf0" }}>Why It Matters</h2>
            <p style={{ color:"#6b7280", lineHeight:1.8, fontSize:14 }}>
              Africa faces compounding climate risks — wildfires destroying forest cover, desertification advancing from the Sahel, and vegetation collapse threatening food systems. ACRIS provides the intelligence layer between satellite observation and informed decision-making, giving frontline agencies the situational awareness to intervene before crises escalate.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign:"center", padding:"24px", borderTop:"1px solid #1e3a1e" }}>
          <div style={{ fontSize:10, color:"#6b7280", fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>
            © 2026 ACRIS · AFRICAN CLIMATE RISK INTELLIGENCE SYSTEM · DATA: NASA FIRMS · ESA WorldCover · Hansen GFC · GPM IMERG
          </div>
        </footer>

      </div>
    </>
  );
}
