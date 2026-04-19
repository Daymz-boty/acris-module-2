// ============================================================================
// LoginPage.jsx — ACRIS · Authentication Gateway
// ============================================================================
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AUTH_API = "http://localhost/climate_system/api/auth_login.php";

const T = {
  bg:        "#0a0f0a",
  bgPanel:   "#0f1a0f",
  bgCard:    "#111d11",
  border:    "#1e3a1e",
  green:     "#22c55e",
  greenDim:  "#16a34a",
  greenGlow: "rgba(34,197,94,0.12)",
  red:       "#ef4444",
  white:     "#f0fdf0",
  muted:     "#86efac",
  textSub:   "#6b7280",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0f0a; }
  ::-webkit-scrollbar-thumb { background: #1e3a1e; border-radius: 2px; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
  @keyframes spin     { to { transform:rotate(360deg); } }
  @keyframes scanline { 0%{transform:translateY(-100%);}100%{transform:translateY(100vh);} }
`;

function GridBackground() {
  return (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", opacity:0.06 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22c55e" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const redirect      = params.get("redirect") || "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [fieldErr, setFieldErr] = useState({ email: false, password: false });

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated()) navigate(redirect, { replace: true });
  }, []); // eslint-disable-line

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Client-side validation
    const errs = { email: !email.trim(), password: !password.trim() };
    setFieldErr(errs);
    if (errs.email || errs.password) { setError("Please enter your email and password."); return; }

    setLoading(true);
    try {
      const res  = await fetch(AUTH_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        login(data.token, data.user);
        navigate(redirect, { replace: true });
      } else {
        setError(data.error || "Authentication failed. Please try again.");
      }
    } catch {
      setError("Cannot reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasErr) => ({
    width: "100%",
    padding: "12px 14px",
    background: T.bgCard,
    border: `1px solid ${hasErr ? T.red : T.border}`,
    borderRadius: 8,
    color: T.white,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  });

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", position: "relative", overflow: "hidden" }}>

        <GridBackground />

        {/* Scanline effect */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.03) 50%)", backgroundSize:"100% 4px", zIndex:1, opacity:0.3 }} />

        {/* Card */}
        <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:440, margin:"0 24px", animation:"fadeUp 0.5s ease" }}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:52, height:52, borderRadius:14, background:`linear-gradient(135deg,${T.green},${T.greenDim})`, marginBottom:16, boxShadow:`0 0 24px ${T.greenGlow}` }}>
              <span style={{ fontSize:22, fontWeight:800, color:T.bg, letterSpacing:-1 }}>A</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, color:T.white, letterSpacing:2, marginBottom:6 }}>ACRIS</h1>
            <p style={{ fontSize:11, color:T.textSub, letterSpacing:3, textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>African Climate Risk Intelligence System</p>
          </div>

          {/* Form card */}
          <div style={{ background:T.bgPanel, border:`1px solid ${T.border}`, borderRadius:16, padding:32, boxShadow:`0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.05)` }}>

            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:18, fontWeight:700, color:T.white, marginBottom:4 }}>Intelligence Access</div>
              <div style={{ fontSize:12, color:T.textSub, fontFamily:"'JetBrains Mono',monospace" }}>Authorised personnel only</div>
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErr(p=>({...p,email:false})); setError(""); }}
                  placeholder="analyst@acris.africa"
                  autoComplete="email"
                  disabled={loading}
                  style={inputStyle(fieldErr.email)}
                  onFocus={e => e.target.style.borderColor = T.green}
                  onBlur={e  => e.target.style.borderColor = fieldErr.email ? T.red : T.border}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>
                  Password
                </label>
                <div style={{ position:"relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErr(p=>({...p,password:false})); setError(""); }}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    style={{ ...inputStyle(fieldErr.password), paddingRight:44 }}
                    onFocus={e => e.target.style.borderColor = T.green}
                    onBlur={e  => e.target.style.borderColor = fieldErr.password ? T.red : T.border}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.textSub, fontSize:14, padding:4 }}
                    tabIndex={-1}
                  >
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div style={{ marginBottom:16, padding:"10px 12px", background:`${T.red}11`, border:`1px solid ${T.red}33`, borderRadius:8, fontSize:12, color:T.red, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.5 }}>
                  ⚠ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{ width:"100%", padding:"13px 0", borderRadius:10, background:loading?T.bgCard:`linear-gradient(135deg,${T.green},${T.greenDim})`, border:`1px solid ${loading?T.border:T.green}`, color:loading?T.textSub:T.bg, fontSize:14, fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:1, cursor:loading?"wait":"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:loading?"none":`0 0 20px rgba(34,197,94,0.25)` }}
              >
                {loading ? (
                  <>
                    <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${T.border}`, borderTopColor:T.green, animation:"spin 0.8s linear infinite" }} />
                    Authenticating…
                  </>
                ) : (
                  <>Enter System</>
                )}
              </button>

            </form>

            {/* Status footer */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:T.green, animation:"pulse 2s infinite" }} />
              <span style={{ fontSize:10, color:T.textSub, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          {/* Back to landing */}
          <div style={{ textAlign:"center", marginTop:20 }}>
            <Link to="/" style={{ fontSize:11, color:T.textSub, fontFamily:"'JetBrains Mono',monospace", textDecoration:"none" }}>
              ← Return to ACRIS Home
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
