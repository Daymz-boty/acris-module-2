// ============================================================================
// Wildfire.js — ACRIS MODULE 1 · Wildfire Intelligence Dashboard
// Rethemed to match ACRIS design system. All core functionality retained.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Rectangle, useMap, LayersControl } from "react-leaflet";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Area, AreaChart, CartesianGrid } from "recharts";
import { jsPDF } from "jspdf";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ── Theme — matches desertification dashboard ─────────────────────────────────
const T = {
  bg:        "#0a0f0a",
  bgPanel:   "#0f1a0f",
  bgCard:    "#111d11",
  bgHover:   "#162016",
  border:    "#1e3a1e",
  green:     "#22c55e",
  greenDim:  "#16a34a",
  greenGlow: "rgba(34,197,94,0.15)",
  red:       "#ef4444",
  redDim:    "#dc2626",
  orange:    "#f97316",
  yellow:    "#fbbf24",
  white:     "#f0fdf0",
  muted:     "#86efac",
  textSub:   "#6b7280",
  blue:      "#3b82f6",
};

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE   = "http://localhost/climate_system/api/get_wildfiresPstGIS.php";
const REFRESH_MS = 3 * 60 * 60 * 1000;
const AFRICA_CENTER = [2.0, 20.0];
const AFRICA_ZOOM   = 4;
const MAX_POINTS    = 3000;

// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html,body,#root { height:100%; background:#0a0f0a; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:#0a0f0a; }
  ::-webkit-scrollbar-thumb { background:#1e3a1e; border-radius:2px; }
  .leaflet-container { background:#0a0f0a !important; }
  .leaflet-tile { filter:brightness(0.85) saturate(0.7); }
  .leaflet-control-layers,.leaflet-bar a { background:#111d11 !important; border-color:#1e3a1e !important; color:#f0fdf0 !important; }
  .leaflet-control-layers-base label,.leaflet-control-layers-overlays label { color:#f0fdf0 !important; }
  .wf-tt { background:#111d11 !important; border:1px solid #1e3a1e !important; color:#f0fdf0 !important; font-family:'JetBrains Mono',monospace; font-size:11px; border-radius:6px; padding:6px 10px; }
  .wf-tt::before { display:none; }
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
  @keyframes slideRight { from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;} }
  @keyframes pulse   { 0%,100%{opacity:1;}50%{opacity:0.35;} }
  @keyframes spin    { to{transform:rotate(360deg);} }
`;

// ── Country coordinates ───────────────────────────────────────────────────────
const COUNTRY_COORDS = {
  "Nigeria":[9.08,8.68],"Angola":[-11.2,17.87],"Zambia":[-13.13,27.85],"Mozambique":[-18.67,35.53],
  "Tanzania":[-6.37,34.89],"Democratic Republic of the Congo":[-4.03,21.76],"South Africa":[-30.56,22.94],
  "Ethiopia":[9.15,40.49],"Kenya":[-0.02,37.91],"Sudan":[12.86,30.22],"South Sudan":[6.88,31.57],
  "Somalia":[5.15,46.20],"Chad":[15.45,18.73],"Niger":[17.61,8.08],"Mali":[17.57,-3.99],
  "Mauritania":[21.01,-10.94],"Senegal":[14.50,-14.45],"Ghana":[7.95,-1.02],"Cameroon":[3.85,11.50],
  "Central African Republic":[6.61,20.94],"Republic of the Congo":[-.23,15.83],"Gabon":[-0.80,11.61],
  "Namibia":[-22.96,18.49],"Botswana":[-22.33,24.68],"Zimbabwe":[-19.02,29.15],"Malawi":[-13.25,34.30],
  "Uganda":[1.37,32.29],"Rwanda":[-1.94,29.87],"Burundi":[-3.37,29.92],"Madagascar":[-18.77,46.87],
  "Ivory Coast":[7.54,-5.55],"Burkina Faso":[12.36,-1.54],"Libya":[26.34,17.23],"Egypt":[26.82,30.80],
  "Algeria":[28.03,1.66],"Morocco":[31.79,-7.09],"Guinea":[11.0,-10.0],
};
const COUNTRY_FLAGS = {
  "Nigeria":"🇳🇬","Angola":"🇦🇴","Zambia":"🇿🇲","Mozambique":"🇲🇿","Tanzania":"🇹🇿",
  "Democratic Republic of the Congo":"🇨🇩","South Africa":"🇿🇦","Ethiopia":"🇪🇹","Kenya":"🇰🇪",
  "Sudan":"🇸🇩","South Sudan":"🇸🇸","Somalia":"🇸🇴","Chad":"🇹🇩","Niger":"🇳🇪","Mali":"🇲🇱",
  "Mauritania":"🇲🇷","Senegal":"🇸🇳","Ghana":"🇬🇭","Cameroon":"🇨🇲","Gabon":"🇬🇦",
  "Namibia":"🇳🇦","Botswana":"🇧🇼","Zimbabwe":"🇿🇼","Malawi":"🇲🇼","Uganda":"🇺🇬",
  "Rwanda":"🇷🇼","Burundi":"🇧🇮","Madagascar":"🇲🇬","Ivory Coast":"🇨🇮","Libya":"🇱🇾",
  "Egypt":"🇪🇬","Algeria":"🇩🇿","Morocco":"🇲🇦","Guinea":"🇬🇳","Angola":"🇦🇴",
};
function getCountryCoords(name) { if (!name) return null; return COUNTRY_COORDS[name] || null; }
function getCountryFlag(name) { if (!name) return "🌍"; return COUNTRY_FLAGS[name] || "🌍"; }

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(iso) { if (!iso) return "—"; try { return new Date(iso).toLocaleString("en-GB",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"}); } catch { return iso; } }
function fmtDay(d) { if (!d) return ""; try { return new Date(d).toLocaleDateString("en-GB",{month:"short",day:"2-digit"}); } catch { return d; } }
function fmtNum(n) { return Number(n||0).toLocaleString(); }

function brightnessToColor(b) {
  const r = Math.min(Math.max((b-290)/210,0),1);
  if (r<0.33) return `rgba(255,${Math.round(215-(r/0.33)*75)},0,0.82)`;
  if (r<0.66) return `rgba(255,${Math.round(140-((r-0.33)/0.33)*140)},0,0.82)`;
  const t=(r-0.66)/0.34; return `rgba(255,${Math.round(t*80)},${Math.round(t*60)},0.88)`;
}
function brightnessToRadius(b) { return 3+Math.min(Math.max((b-290)/210,0),1)*9; }

const CLUSTER_COLORS=["#ff6a1a","#ffc840","#40e0d0","#e040fb","#00e676","#2979ff","#ff4081","#69f0ae","#ffab40","#40c4ff"];
function clusterColor(id) { if (id===null||id===undefined||id<0) return "rgba(120,140,155,0.5)"; return CLUSTER_COLORS[Number(id)%CLUSTER_COLORS.length]; }
function heatColor(intensity,maxI) {
  const r=Math.min(intensity/maxI,1);
  if (r<0.25) return `rgba(255,220,0,${(0.18+r*0.3).toFixed(2)})`;
  if (r<0.5)  return `rgba(255,140,0,${(0.3+r*0.3).toFixed(2)})`;
  if (r<0.75) return `rgba(255,60,0,${(0.45+r*0.25).toFixed(2)})`;
  return               `rgba(220,0,0,${(0.6+r*0.35).toFixed(2)})`;
}
function intensityTier(avg) {
  if (avg>=440) return {label:"EXTREME",color:T.red};
  if (avg>=380) return {label:"HIGH",   color:T.orange};
  if (avg>=330) return {label:"MOD",    color:T.yellow};
  return               {label:"LOW",    color:T.green};
}
function confidenceLabel(d) {
  const n=parseInt(d||0); if (n<7) return "insufficient"; if (n<30) return "low"; if (n<90) return "moderate"; return "high";
}
function anomalyMeta(z,conf) {
  if (!conf||conf==="insufficient"||z===null||z===undefined) return {show:false,label:"—",color:T.textSub};
  const zn=parseFloat(z); if (isNaN(zn)) return {show:false,label:"—",color:T.textSub};
  const prefix=zn>0?"+":""; const label=`${prefix}${zn.toFixed(1)}σ`;
  if (conf==="low")      return {show:true,label:`~${label}`,color:T.textSub};
  if (Math.abs(zn)<=1)   return {show:true,label,color:T.green};
  if (Math.abs(zn)<=2)   return {show:true,label,color:T.yellow};
  if (Math.abs(zn)<=3)   return {show:true,label,color:T.orange};
  return                        {show:true,label,color:T.red};
}

// Land cover config
const LC_CONFIG = {
  "tree cover":  {color:"#22c55e",ring:"rgba(255,255,255,0.9)",concern:"HIGH",    weight:1.8,dash:null},
  "shrubland":   {color:"#a3e635",ring:"rgba(255,255,255,0.4)",concern:"MOD",     weight:1,  dash:"3,3"},
  "grassland":   {color:"#facc15",ring:"rgba(255,255,255,0.3)",concern:"LOW",     weight:1,  dash:"3,3"},
  "cropland":    {color:"#fb923c",ring:"rgba(255,200,0,0.25)", concern:"LOW",     weight:0.5,dash:null},
  "built-up":    {color:"#f87171",ring:"rgba(255,80,80,0.9)",  concern:"CRITICAL",weight:2.2,dash:null},
  "trees":       {color:"#22c55e",ring:"rgba(255,255,255,0.9)",concern:"HIGH",    weight:1.8,dash:null},
  "forest":      {color:"#22c55e",ring:"rgba(255,255,255,0.9)",concern:"HIGH",    weight:1.8,dash:null},
  "water":       {color:"#60a5fa",ring:"rgba(255,255,255,0.2)",concern:"LOW",     weight:0.5,dash:null},
  "wetland":     {color:"#34d399",ring:"rgba(255,255,255,0.3)",concern:"MOD",     weight:0.5,dash:null},
  "bare":        {color:"#d4d4aa",ring:"rgba(255,255,255,0.2)",concern:"LOW",     weight:0.5,dash:null},
  "mangrove":    {color:"#059669",ring:"rgba(255,255,255,0.7)",concern:"HIGH",    weight:1.5,dash:null},
};
const LC_DEFAULT={color:"rgba(160,180,190,0.4)",ring:"rgba(255,255,255,0.15)",concern:"UNKNOWN",weight:0.5,dash:null};
const _lcCache=new Map();
function getLcConfig(lc) {
  if (!lc) return LC_DEFAULT;
  const cached=_lcCache.get(lc); if (cached) return cached;
  const lower=lc.toLowerCase().trim();
  const stripped=lower.replace(/^\d+\s*/,"").trim();
  const cfg=LC_CONFIG[lower]||LC_CONFIG[stripped]||Object.values(LC_CONFIG).find((v,_,arr)=>{ const key=Object.keys(LC_CONFIG).find(k=>lower.includes(k)); return key&&LC_CONFIG[key]===v; })||LC_DEFAULT;
  _lcCache.set(lc,cfg); return cfg;
}
function lcPathOptions(brightness,landCover) {
  const lc=getLcConfig(landCover); const base=brightnessToColor(brightness);
  return {fillColor:base,fillOpacity:0.85,color:lc.ring,weight:lc.weight,dashArray:lc.dash||undefined};
}

// ── Map controller ────────────────────────────────────────────────────────────
function MapController({ flyToRef }) {
  const map=useMap();
  useEffect(() => {
    flyToRef.current=(coords,zoom=6)=>map.flyTo(coords,zoom,{animate:true,duration:1.4});
    const raf=requestAnimationFrame(()=>map.invalidateSize({animate:false}));
    let t; const onResize=()=>{ clearTimeout(t); t=setTimeout(()=>map.invalidateSize({animate:false}),120); };
    window.addEventListener("resize",onResize);
    return ()=>{ cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener("resize",onResize); };
  },[map,flyToRef]);
  return null;
}

// ── Safe authenticated fetch ──────────────────────────────────────────────────
function buildUrl(mode,start,end,extra={}) {
  const p=new URLSearchParams({mode});
  if (start) p.append("start_date",start);
  if (end)   p.append("end_date",end);
  Object.entries(extra).forEach(([k,v])=>p.append(k,v));
  return `${API_BASE}?${p}`;
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Spinner() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:80}}><div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.green,animation:"spin 0.8s linear infinite"}}/></div>;
}
function SectionTitle({children,style={}}) {
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:T.green,marginBottom:8,marginTop:4,textTransform:"uppercase",...style}}>{children}</div>;
}
function StatCard({label,value,accent=T.white,sub}) {
  return (
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px"}}>
      <div style={{fontSize:9,color:T.textSub,marginBottom:4,letterSpacing:1,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{label}</div>
      <div style={{fontSize:18,fontWeight:800,color:accent,fontFamily:"'JetBrains Mono',monospace"}}>{value}</div>
      {sub && <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{sub}</div>}
    </div>
  );
}
function DarkTooltip({active,payload,label}) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>
      <div style={{color:T.muted,marginBottom:4}}>{fmtDay(label)}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0}}/>
          <span style={{color:T.white}}>{Number(p.value).toFixed(p.name==="avg_intensity"?1:0)}</span>
          <span style={{color:T.textSub}}>{p.name==="fire_count"?"fires":"avg K"}</span>
        </div>
      ))}
    </div>
  );
}

// ── Country detail drawer ─────────────────────────────────────────────────────
function CountryDrawer({country,intensityData,start,end,onClose,authFetch}) {
  const [temporal,setTemporal]=useState([]);
  const [lcData,setLcData]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const row=intensityData.find(r=>r.country?.toLowerCase()===country?.toLowerCase());

  useEffect(()=>{
    if (!country) return;
    const ctrl=new AbortController();
    setLoading(true); setError(null); setTemporal([]); setLcData([]);
    const doFetch=async()=>{
      try {
        const [jt,jl]=await Promise.all([
          authFetch(buildUrl("temporal_country",start,end,{country})).then(r=>r?.json()),
          authFetch(buildUrl("land_cover_stats",start,end,{country})).then(r=>r?.json()),
        ]);
        if (ctrl.signal.aborted) return;
        if (jt?.success) setTemporal(jt.data.map(d=>({...d,fire_count:parseInt(d.fire_count),avg_intensity:parseFloat(d.avg_intensity)})));
        else setError("No data for this country.");
        if (jl?.success) setLcData(jl.data);
      } catch { if (!ctrl.signal.aborted) setError("Network error"); }
      finally  { if (!ctrl.signal.aborted) setLoading(false); }
    };
    doFetch();
    return ()=>ctrl.abort();
  },[country,start,end]);

  const tier=row?intensityTier(parseFloat(row.avg_intensity)):null;
  const totalFires=temporal.reduce((s,d)=>s+d.fire_count,0);
  const peakDay=temporal.length?[...temporal].sort((a,b)=>b.fire_count-a.fire_count)[0]:null;
  const trend=temporal.length>=2?temporal[temporal.length-1].fire_count-temporal[0].fire_count:0;

  return (
    <div style={{position:"fixed",top:0,right:0,width:380,height:"100vh",background:T.bgPanel,borderLeft:`1px solid ${T.border}`,zIndex:2000,display:"flex",flexDirection:"column",transform:country?"translateX(0)":"translateX(100%)",transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",boxShadow:country?"-8px 0 32px rgba(0,0,0,0.6)":"none"}}>
      {country && <>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{getCountryFlag(country)}</span>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:T.white}}>{country}</div>
              <div style={{fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>FIRE INTELLIGENCE REPORT</div>
            </div>
            {tier && <span style={{marginLeft:8,padding:"3px 8px",borderRadius:4,background:`${tier.color}22`,border:`1px solid ${tier.color}44`,color:tier.color,fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{tier.label}</span>}
          </div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,color:T.textSub,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✕</button>
        </div>
        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            <StatCard label="Total Detections"  value={row?fmtNum(parseInt(row.fire_count)):"—"} accent={T.red} />
            <StatCard label="Avg Brightness K"  value={row?parseFloat(row.avg_intensity).toFixed(1):"—"} accent={T.orange} />
            <StatCard label="Peak Brightness K" value={row?parseFloat(row.max_intensity).toFixed(1):"—"} accent={T.yellow} />
            <StatCard label="Active Days"        value={temporal.length} />
          </div>

          {/* Land cover */}
          {lcData.length>0 && <>
            <SectionTitle>Fire Type Composition</SectionTitle>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",marginBottom:8}}>
                {lcData.map((d,i)=>{const lc=getLcConfig(d.land_cover);const pct=parseFloat(d.pct_of_total||0);return pct>0.5?<div key={i} style={{width:`${pct}%`,background:lc.color}} title={`${d.land_cover}: ${pct}%`}/>:null;})}
              </div>
              {lcData.slice(0,5).map((d,i)=>{const lc=getLcConfig(d.land_cover);const pct=parseFloat(d.pct_of_total||0);return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <div style={{width:8,height:8,borderRadius:2,background:lc.color,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:11,color:T.muted}}>{d.land_cover||"Unknown"}</span>
                  <span style={{fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>{pct.toFixed(1)}%</span>
                  <span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:`${CONCERN_COLOR[lc.concern]||T.border}22`,color:CONCERN_COLOR[lc.concern]||T.textSub,fontWeight:700}}>{lc.concern}</span>
                </div>
              );})}
            </div>
          </>}

          {loading && <Spinner />}
          {error && <div style={{padding:"10px 12px",background:`${T.red}11`,border:`1px solid ${T.red}33`,borderRadius:6,fontSize:12,color:T.red,marginBottom:12}}>⚠ {error}</div>}

          {!loading && temporal.length>0 && <>
            <SectionTitle>Daily Fires &amp; Brightness</SectionTitle>
            <div style={{marginBottom:16}}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={temporal} margin={{top:4,right:4,left:-22,bottom:0}}>
                  <defs>
                    <linearGradient id="wfFireGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity={0.3}/><stop offset="95%" stopColor={T.red} stopOpacity={0.02}/></linearGradient>
                    <linearGradient id="wfBrightGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.yellow} stopOpacity={0.2}/><stop offset="95%" stopColor={T.yellow} stopOpacity={0.02}/></linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="day" tickFormatter={fmtDay} tick={{fill:T.textSub,fontSize:8,fontFamily:"'JetBrains Mono',monospace"}} tickLine={false} axisLine={false} interval={Math.max(1,Math.floor(temporal.length/7))}/>
                  <YAxis yAxisId="fires" tick={{fill:T.textSub,fontSize:8}} tickLine={false} axisLine={false}/>
                  <YAxis yAxisId="bright" orientation="right" tick={{fill:T.textSub,fontSize:8}} tickLine={false} axisLine={false} domain={["auto","auto"]}/>
                  <Tooltip content={<DarkTooltip/>} cursor={{stroke:"rgba(239,68,68,0.15)",strokeWidth:1}}/>
                  <Area yAxisId="fires"  type="monotone" dataKey="fire_count"    stroke={T.red}    strokeWidth={1.5} fill="url(#wfFireGrad)"   dot={false} name="fire_count"/>
                  <Area yAxisId="bright" type="monotone" dataKey="avg_intensity" stroke={T.yellow} strokeWidth={1.5} fill="url(#wfBrightGrad)" dot={false} name="avg_intensity"/>
                </AreaChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:16,marginTop:6,justifyContent:"center"}}>
                {[{c:T.red,l:"Daily Fires"},{c:T.yellow,l:"Avg Brightness (K)"}].map(x=>(
                  <div key={x.l} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:T.textSub}}><div style={{width:8,height:2,background:x.c,borderRadius:1}}/>{x.l}</div>
                ))}
              </div>
            </div>

            <SectionTitle>Intelligence Insights</SectionTitle>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {[
                {icon:"📅",title:"Peak Activity",body:peakDay?`${fmtDay(peakDay.day)} — ${fmtNum(peakDay.fire_count)} detections`:"—"},
                {icon:"🌡",title:"Thermal Profile",body:row?`Avg ${parseFloat(row.avg_intensity).toFixed(1)} K · Max ${parseFloat(row.max_intensity).toFixed(1)} K`:"—"},
                {icon:"📈",title:"Activity Trend",body:trend>0?`Escalating — +${trend} fires first to last day`:trend<0?`Declining — ${Math.abs(trend)} fewer fires`:"Stable across recorded period"},
                {icon:"🛰",title:"Coverage",body:`${temporal.length} recorded days · ${fmtNum(totalFires)} total events`},
              ].map(c=>(
                <div key={c.title} style={{display:"flex",gap:10,padding:"10px 12px",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8}}>
                  <span style={{fontSize:16,flexShrink:0}}>{c.icon}</span>
                  <div><div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:2}}>{c.title}</div><div style={{fontSize:11,color:T.textSub,lineHeight:1.5}}>{c.body}</div></div>
                </div>
              ))}
            </div>

            <SectionTitle>Top 5 Fire Days</SectionTitle>
            <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",padding:"7px 12px",borderBottom:`1px solid ${T.border}`}}>
                {["Date","Fires","Avg K"].map(h=><span key={h} style={{fontSize:9,fontWeight:700,color:T.textSub,letterSpacing:1,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{h}</span>)}
              </div>
              {[...temporal].sort((a,b)=>b.fire_count-a.fire_count).slice(0,5).map((d,i)=>(
                <div key={d.day} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",padding:"7px 12px",background:i%2===0?T.bgCard:"transparent",borderBottom:i<4?`1px solid ${T.border}`:"none"}}>
                  <span style={{fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>{fmtDay(d.day)}</span>
                  <span style={{fontSize:11,fontWeight:700,color:T.red,fontFamily:"'JetBrains Mono',monospace"}}>{fmtNum(d.fire_count)}</span>
                  <span style={{fontSize:11,color:T.yellow,fontFamily:"'JetBrains Mono',monospace"}}>{d.avg_intensity.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </>}
        </div>
      </>}
    </div>
  );
}

const CONCERN_COLOR={"HIGH":T.green,"CRITICAL":T.red,"MOD":T.yellow,"LOW":T.textSub,"UNKNOWN":T.textSub};

const TABS=[
  {id:"overview",icon:"◈",label:"Overview"},
  {id:"trends",  icon:"◬",label:"Trends"},
  {id:"intel",   icon:"◉",label:"Intel"},
  {id:"layers",  icon:"⬡",label:"Layers"},
];

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({points,countryStats,totalCount,startDate,endDate,onStartChange,onEndChange,onApply,onClear,loading,onCountryClick,lcStats,anomalies,baselineDays}) {
  const total=points.length;
  const avgBright=total?(points.reduce((s,e)=>s+parseFloat(e.brightness),0)/total).toFixed(1):"—";
  const maxBright=total?Math.max(...points.map(e=>parseFloat(e.brightness))).toFixed(1):"—";
  const top7=countryStats.slice(0,7);
  const maxCount=top7[0]?.fire_count||1;
  const confLabel=confidenceLabel(baselineDays);
  const alerts=(anomalies||[]).filter(a=>{const z=parseFloat(a.avg_z_score??a.z_score);return !isNaN(z)&&z>=2&&a.data_confidence!=="insufficient";}).slice(0,5);

  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <SectionTitle>Date Range Filter</SectionTitle>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input type="date" value={startDate} onChange={e=>onStartChange(e.target.value)} style={{flex:1,padding:"7px 8px",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,color:T.white,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}/>
        <input type="date" value={endDate}   onChange={e=>onEndChange(e.target.value)}   style={{flex:1,padding:"7px 8px",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,color:T.white,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}/>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        <button onClick={onApply} disabled={loading} style={{flex:1,padding:"8px 0",borderRadius:6,background:T.greenGlow,border:`1px solid ${T.green}`,color:T.green,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>Apply</button>
        <button onClick={onClear} disabled={loading} style={{padding:"8px 12px",borderRadius:6,background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,fontSize:11,cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>Clear</button>
      </div>

      <SectionTitle>Overview</SectionTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <StatCard label="Active Fires"      value={fmtNum(totalCount)}          accent={T.red}    sub={`${fmtNum(points.length)} on map`}/>
        <StatCard label="Avg Brightness"    value={`${avgBright} K`}            accent={T.orange} />
        <StatCard label="Peak Brightness"   value={`${maxBright} K`}            accent={T.yellow} />
        <StatCard label="Baseline Conf."    value={confLabel.toUpperCase()}     accent={confLabel==="high"?T.green:confLabel==="moderate"?T.yellow:T.textSub}/>
      </div>

      {alerts.length>0 && <>
        <SectionTitle>Anomaly Alerts</SectionTitle>
        <div style={{marginBottom:16}}>
          {alerts.map(a=>{const z=parseFloat(a.avg_z_score??a.z_score);const meta=anomalyMeta(z,a.data_confidence);return(
            <div key={a.country} onClick={()=>onCountryClick(a.country)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:4,borderRadius:6,background:T.bgCard,border:`1px solid ${T.border}`,cursor:"pointer"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:meta.color,flexShrink:0,animation:"pulse 2s infinite"}}/>
              <span style={{flex:1,fontSize:11,fontWeight:600,color:T.white}}>{a.country}</span>
              <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:meta.color}}>{meta.label}</span>
            </div>
          );})}
        </div>
      </>}

      <SectionTitle>Top Countries</SectionTitle>
      {top7.map(r=>{
        const barW=(parseInt(r.fire_count)/maxCount*100).toFixed(1);
        const tier=intensityTier(parseFloat(r.avg_intensity||0));
        return(
          <div key={r.country} onClick={()=>onCountryClick(r.country)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:3,borderRadius:6,background:T.bgCard,border:`1px solid ${T.border}`,cursor:"pointer"}}>
            <span style={{width:18,fontSize:14}}>{getCountryFlag(r.country)}</span>
            <span style={{flex:1,fontSize:11,fontWeight:600,color:T.white,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.country||"Unknown"}</span>
            <div style={{width:60,height:3,background:T.border,borderRadius:2,flexShrink:0}}>
              <div style={{height:"100%",borderRadius:2,width:`${barW}%`,background:tier.color}}/>
            </div>
            <span style={{fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{fmtNum(parseInt(r.fire_count))}</span>
          </div>
        );
      })}

      {lcStats.length>0 && <>
        <SectionTitle style={{marginTop:16}}>Land Cover Breakdown</SectionTitle>
        <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",marginBottom:8}}>
          {lcStats.map((d,i)=>{const lc=getLcConfig(d.land_cover);const pct=parseFloat(d.pct_of_total||0);return pct>0.5?<div key={i} style={{width:`${pct}%`,background:lc.color}} title={`${d.land_cover}: ${pct}%`}/>:null;})}
        </div>
        {lcStats.slice(0,5).map((d,i)=>{const lc=getLcConfig(d.land_cover);const pct=parseFloat(d.pct_of_total||0);return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <div style={{width:8,height:8,borderRadius:2,background:lc.color,flexShrink:0}}/>
            <span style={{flex:1,fontSize:11,color:T.muted}}>{d.land_cover||"Unknown"}</span>
            <span style={{fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>{pct.toFixed(1)}%</span>
          </div>
        );})}
      </>}
    </div>
  );
}

// ── Trends Tab ────────────────────────────────────────────────────────────────
function TrendsTab({trends,loading}) {
  if (loading) return <Spinner/>;
  if (!trends.length) return <div style={{padding:24,textAlign:"center",fontSize:12,color:T.textSub}}>No trend data in range.</div>;
  const parsed=trends.map(d=>({...d,fire_count:parseInt(d.fire_count),avg_intensity:parseFloat(d.avg_intensity)}));
  const peak=[...parsed].sort((a,b)=>b.fire_count-a.fire_count)[0];
  const total=parsed.reduce((s,d)=>s+d.fire_count,0);
  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <StatCard label="Total in Period" value={fmtNum(total)} accent={T.red}/>
        <StatCard label="Peak Day"        value={peak?fmtDay(peak.day):"—"} accent={T.orange} sub={peak?fmtNum(peak.fire_count)+" fires":""}/>
      </div>
      <SectionTitle>Daily Fire Count</SectionTitle>
      <div style={{marginBottom:16}}>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={parsed} margin={{top:4,right:4,left:-22,bottom:0}}>
            <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity={0.3}/><stop offset="95%" stopColor={T.red} stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="day" tickFormatter={fmtDay} tick={{fill:T.textSub,fontSize:8,fontFamily:"'JetBrains Mono',monospace"}} tickLine={false} axisLine={false} interval={Math.max(1,Math.floor(parsed.length/7))}/>
            <YAxis tick={{fill:T.textSub,fontSize:8}} tickLine={false} axisLine={false}/>
            <Tooltip content={<DarkTooltip/>}/>
            <Area type="monotone" dataKey="fire_count" stroke={T.red} strokeWidth={1.5} fill="url(#trendGrad)" dot={false} name="fire_count"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <SectionTitle>Top 5 Peak Days</SectionTitle>
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
        {[...parsed].sort((a,b)=>b.fire_count-a.fire_count).slice(0,5).map((d,i)=>(
          <div key={d.day} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:i%2===0?T.bgCard:"transparent",borderBottom:i<4?`1px solid ${T.border}`:"none"}}>
            <span style={{width:18,fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace",textAlign:"right"}}>#{i+1}</span>
            <span style={{flex:1,fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>{fmtDay(d.day)}</span>
            <div style={{width:60,height:3,background:T.border,borderRadius:2}}>
              <div style={{height:"100%",borderRadius:2,width:`${(d.fire_count/peak.fire_count*100).toFixed(1)}%`,background:T.red}}/>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:T.red,fontFamily:"'JetBrains Mono',monospace"}}>{fmtNum(d.fire_count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Intel Tab ─────────────────────────────────────────────────────────────────
function IntelTab({intensity,anomalies,loading,onCountryClick}) {
  const [sort,setSort]=useState("avg_intensity");
  if (loading) return <Spinner/>;
  if (!intensity.length) return <div style={{padding:24,textAlign:"center",fontSize:12,color:T.textSub}}>No intensity data in range.</div>;
  const sorted=[...intensity].sort((a,b)=>parseFloat(b[sort])-parseFloat(a[sort]));
  const maxAvg=Math.max(...intensity.map(d=>parseFloat(d.avg_intensity)));
  const anomalyMap={};
  (anomalies||[]).forEach(a=>{if(a.country)anomalyMap[a.country.toLowerCase()]=a;});
  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <SectionTitle>Country Intensity</SectionTitle>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[{key:"avg_intensity",label:"Avg K"},{key:"max_intensity",label:"Max K"},{key:"fire_count",label:"Count"}].map(s=>(
          <button key={s.key} onClick={()=>setSort(s.key)} style={{flex:1,padding:"5px 0",borderRadius:6,background:sort===s.key?T.greenGlow:"transparent",border:`1px solid ${sort===s.key?T.green:T.border}`,color:sort===s.key?T.green:T.textSub,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>{s.label}</button>
        ))}
      </div>
      {/* Table header */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 60px 50px",padding:"6px 10px",borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
        {["Country","Avg K","Max K","Fires","Anom"].map(h=><span key={h} style={{fontSize:9,fontWeight:700,color:T.textSub,letterSpacing:1,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase"}}>{h}</span>)}
      </div>
      {sorted.map((row,i)=>{
        const tier=intensityTier(parseFloat(row.avg_intensity));
        const anom=anomalyMap[row.country?.toLowerCase()];
        const anomMeta=anomalyMeta(anom?.avg_z_score??anom?.z_score,anom?.data_confidence);
        return(
          <div key={row.country||i} onClick={()=>onCountryClick(row.country)} style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 60px 50px",padding:"8px 10px",borderRadius:6,background:i%2===0?T.bgCard:"transparent",cursor:"pointer",marginBottom:2,border:`1px solid transparent`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
              <span style={{padding:"2px 5px",borderRadius:3,background:`${tier.color}22`,color:tier.color,fontSize:8,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{tier.label}</span>
              <span style={{fontSize:11,color:T.white,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.country||"Unknown"}</span>
            </div>
            <div style={{fontSize:11,color:T.orange,fontFamily:"'JetBrains Mono',monospace",position:"relative"}}>
              <div style={{position:"absolute",bottom:0,left:0,height:2,borderRadius:1,width:`${(parseFloat(row.avg_intensity)/maxAvg*100).toFixed(0)}%`,background:tier.color,opacity:0.4}}/>
              {parseFloat(row.avg_intensity).toFixed(1)}
            </div>
            <span style={{fontSize:11,color:T.yellow,fontFamily:"'JetBrains Mono',monospace"}}>{parseFloat(row.max_intensity).toFixed(1)}</span>
            <span style={{fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>{fmtNum(parseInt(row.fire_count))}</span>
            <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:anomMeta.color}}>{anomMeta.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Layers Tab ────────────────────────────────────────────────────────────────
function LayersTab({layers,onToggle,clusterData,heatmapData,loading}) {
  const clustered=clusterData.filter(d=>d.cluster_id!==null&&Number(d.cluster_id)>=0).length;
  const uniqueClusters=[...new Set(clusterData.map(d=>d.cluster_id))].filter(id=>id!==null&&Number(id)>=0).length;
  const maxHeat=heatmapData.length?Math.max(...heatmapData.map(d=>parseFloat(d.total_intensity))):1;
  const layerDefs=[
    {id:"points",  icon:"●",label:"Fire Points",    desc:"Raw FIRMS satellite detections",          color:T.red},
    {id:"clusters",icon:"⬡",label:"DBSCAN Clusters",desc:"PostGIS spatial clustering (ε=0.2°, n≥5)",color:"#40e0d0"},
    {id:"heatmap", icon:"▦",label:"Intensity Heatmap",desc:"0.1° grid aggregated brightness",      color:T.yellow},
  ];
  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <SectionTitle>Map Overlay Controls</SectionTitle>
      {layerDefs.map(l=>(
        <div key={l.id} onClick={()=>onToggle(l.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6,borderRadius:8,background:layers[l.id]?T.bgHover:T.bgCard,border:`1px solid ${layers[l.id]?l.color+"44":T.border}`,cursor:"pointer",transition:"all 0.15s"}}>
          <span style={{fontSize:16,color:l.color,flexShrink:0}}>{l.icon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:layers[l.id]?T.white:T.muted}}>{l.label}</div>
            <div style={{fontSize:10,color:T.textSub,marginTop:1}}>{l.desc}</div>
          </div>
          <div style={{width:32,height:18,borderRadius:9,background:layers[l.id]?T.green:T.border,position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:layers[l.id]?14:2,width:14,height:14,borderRadius:7,background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.4)"}}/>
          </div>
        </div>
      ))}

      <SectionTitle style={{marginTop:16}}>Cluster Analysis</SectionTitle>
      {loading?<Spinner/>:clusterData.length?(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <StatCard label="Total Points"  value={fmtNum(clusterData.length)}/>
          <StatCard label="Clusters"      value={uniqueClusters} accent={T.green}/>
          <StatCard label="Clustered"     value={fmtNum(clustered)}/>
          <StatCard label="Noise"         value={fmtNum(clusterData.length-clustered)} accent={T.textSub}/>
        </div>
      ):<div style={{fontSize:11,color:T.textSub,padding:"8px 0"}}>Enable Clusters layer to load data.</div>}

      <SectionTitle>Heatmap Grid</SectionTitle>
      {heatmapData.length?(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <StatCard label="Grid Cells"   value={fmtNum(heatmapData.length)}/>
          <StatCard label="Max Intensity" value={parseFloat(maxHeat).toFixed(0)} accent={T.orange}/>
        </div>
      ):<div style={{fontSize:11,color:T.textSub,padding:"8px 0"}}>Enable Heatmap layer to load data.</div>}

      <SectionTitle>Intensity Scale</SectionTitle>
      <div style={{height:8,borderRadius:4,background:"linear-gradient(90deg,rgba(255,220,0,0.6),rgba(255,140,0,0.8),rgba(255,60,0,0.9),rgba(220,0,0,1))",marginBottom:4}}/>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>
        {["Low","Moderate","High","Extreme"].map(l=><span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
export default function WildfireDashboard() {
  const {authFetch,logout,user}=useAuth();
  const navigate=useNavigate();

  const [points,      setPoints]      =useState([]);
  const [totalCount,  setTotalCount]  =useState(0);
  const [countryStats,setCountryStats]=useState([]);
  const [trends,      setTrends]      =useState([]);
  const [intensity,   setIntensity]   =useState([]);
  const [clusterData, setClusterData] =useState([]);
  const [heatmapData, setHeatmapData] =useState([]);
  const [lcStats,     setLcStats]     =useState([]);
  const [anomalies,   setAnomalies]   =useState([]);
  const [baselineDays,setBaselineDays]=useState(0);
  const [loading,     setLoading]     =useState(true);
  const [layerLoad,   setLayerLoad]   =useState(false);
  const [error,       setError]       =useState(null);
  const [lastFetch,   setLastFetch]   =useState(null);
  const [activeTab,   setActiveTab]   =useState("overview");
  const [layers,      setLayers]      =useState({points:true,clusters:false,heatmap:false});
  const layersRef=useRef(layers);
  useEffect(()=>{layersRef.current=layers;},[layers]);
  const [startDate,    setStartDate]    =useState("");
  const [endDate,      setEndDate]      =useState("");
  const [appliedStart, setAppliedStart] =useState("");
  const [appliedEnd,   setAppliedEnd]   =useState("");
  const [selectedCountry,setSelectedCountry]=useState(null);
  const flyToRef=useRef(null);
  const appliedStartRef=useRef(""); const appliedEndRef=useRef("");
  useEffect(()=>{appliedStartRef.current=appliedStart;},[appliedStart]);
  useEffect(()=>{appliedEndRef.current=appliedEnd;},[appliedEnd]);
  const fetchControllerRef=useRef(null);

  const selectCountry=useCallback((name)=>{
    setSelectedCountry(name);
    if (name&&flyToRef.current) { const coords=getCountryCoords(name); if (coords) flyToRef.current(coords,6); }
  },[]);

  const fetchCore=useCallback(async(start="",end="")=>{
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    const controller=new AbortController(); fetchControllerRef.current=controller;
    setLoading(true); setError(null);
    try {
      const j=await Promise.all([
        authFetch(buildUrl("points",start,end)).then(r=>r?.json()),
        authFetch(buildUrl("country_stats",start,end)).then(r=>r?.json()),
        authFetch(buildUrl("daily_trends",start,end)).then(r=>r?.json()),
        authFetch(buildUrl("intensity",start,end)).then(r=>r?.json()),
        authFetch(buildUrl("land_cover_stats",start,end)).then(r=>r?.json()),
        authFetch(buildUrl("anomaly",start,end)).then(r=>r?.json()),
        authFetch(buildUrl("baselines","","")).then(r=>r?.json()),
      ]);
      if (controller.signal.aborted) return;
      let ok=false;
      if (j[0]?.success) { const all=j[0].data; setTotalCount(all.length); setPoints(all.slice(0,MAX_POINTS)); ok=true; }
      if (j[1]?.success) { setCountryStats(j[1].data); ok=true; }
      if (j[2]?.success) { setTrends(j[2].data); ok=true; }
      if (j[3]?.success) { setIntensity(j[3].data); ok=true; }
      if (j[4]?.success) { setLcStats(j[4].data); ok=true; }
      if (j[5]?.success) { setAnomalies(j[5].data); ok=true; }
      if (j[6]?.success&&j[6].data.length>0) { setBaselineDays(Math.min(...j[6].data.map(b=>parseInt(b.sample_days||0)))); }
      if (!ok) setError("Could not load data. Check your connection.");
      else setLastFetch(new Date());
      const cur=layersRef.current;
      const overlays=[];
      if (cur.clusters) overlays.push(authFetch(buildUrl("cluster",start,end)).then(r=>r?.json()).then(jc=>{if(jc?.success)setClusterData(jc.data);}));
      if (cur.heatmap)  overlays.push(authFetch(buildUrl("heatmap",start,end)).then(r=>r?.json()).then(jh=>{if(jh?.success)setHeatmapData(jh.data);}));
      if (overlays.length) await Promise.all(overlays);
    } finally { if (!controller.signal.aborted) setLoading(false); }
  },[authFetch]);

  useEffect(()=>{
    fetchCore("","");
    const id=setInterval(()=>fetchCore(appliedStartRef.current,appliedEndRef.current),REFRESH_MS);
    return ()=>{ clearInterval(id); if (fetchControllerRef.current) fetchControllerRef.current.abort(); };
  },[]); // eslint-disable-line

  const toggleLayer=useCallback(async(id)=>{
    const start=appliedStartRef.current,end=appliedEndRef.current;
    setLayers(prev=>{
      const next={...prev,[id]:!prev[id]}; layersRef.current=next;
      if (id==="clusters"&&!prev.clusters&&clusterData.length===0) { setLayerLoad(true); authFetch(buildUrl("cluster",start,end)).then(r=>r?.json()).then(j=>{if(j?.success)setClusterData(j.data);}).finally(()=>setLayerLoad(false)); }
      if (id==="heatmap" &&!prev.heatmap &&heatmapData.length===0) { setLayerLoad(true); authFetch(buildUrl("heatmap",start,end)).then(r=>r?.json()).then(j=>{if(j?.success)setHeatmapData(j.data);}).finally(()=>setLayerLoad(false)); }
      return next;
    });
  },[clusterData.length,heatmapData.length,authFetch]);

  function handleApply() { setAppliedStart(startDate); setAppliedEnd(endDate); setClusterData([]); setHeatmapData([]); setLcStats([]); fetchCore(startDate,endDate); }
  function handleClear() { setStartDate(""); setEndDate(""); setAppliedStart(""); setAppliedEnd(""); setClusterData([]); setHeatmapData([]); setLcStats([]); fetchCore("",""); }

  const maxHeatIntensity=heatmapData.length?Math.max(...heatmapData.map(d=>parseFloat(d.total_intensity))):1;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{display:"flex",flexDirection:"column",height:"100vh",width:"100vw",background:T.bg,fontFamily:"'Syne',sans-serif",color:T.white,overflow:"hidden"}}>

        {/* Top bar */}
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:52,background:T.bgPanel,borderBottom:`1px solid ${T.border}`,flexShrink:0,zIndex:1000}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:28,height:28,borderRadius:6,background:`linear-gradient(135deg,${T.red},${T.redDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:T.bg}}>A</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,letterSpacing:1,color:T.red}}>ACRIS</div>
              <div style={{fontSize:9,color:T.textSub,letterSpacing:2,marginTop:-2,fontFamily:"'JetBrains Mono',monospace"}}>MODULE 1 · WILDFIRE INTELLIGENCE</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {lastFetch&&<span style={{fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>Synced {lastFetch.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>}
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:T.green,animation:"pulse 2s infinite"}}/>
              LIVE
            </div>
            <button onClick={()=>navigate("/")} style={{padding:"4px 12px",borderRadius:6,background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>← Home</button>
            <button onClick={()=>{logout();navigate("/login");}} style={{padding:"4px 12px",borderRadius:6,background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Sign Out</button>
          </div>
        </header>

        {/* Body */}
        <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative"}}>

          {/* Sidebar */}
          <aside style={{width:300,flexShrink:0,background:T.bgPanel,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden",zIndex:10}}>

            {/* Tab bar */}
            <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:"10px 4px",background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:0.5,fontFamily:"'Syne',sans-serif",color:activeTab===t.id?T.red:T.textSub,borderBottom:activeTab===t.id?`2px solid ${T.red}`:"2px solid transparent",transition:"color 0.2s"}}>
                  <div style={{fontSize:14,marginBottom:2}}>{t.icon}</div>
                  {t.label}
                </button>
              ))}
            </div>

            {error&&(
              <div style={{margin:8,padding:"8px 10px",background:`${T.red}11`,border:`1px solid ${T.red}33`,borderRadius:6,fontSize:11,color:T.red,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>⚠ {error}</span>
                <button onClick={()=>fetchCore(appliedStart,appliedEnd)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:10,textDecoration:"underline"}}>Retry</button>
              </div>
            )}

            <div style={{flex:1,overflowY:"auto",padding:12}}>
              {activeTab==="overview"&&<OverviewTab points={points} countryStats={countryStats} totalCount={totalCount} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onApply={handleApply} onClear={handleClear} loading={loading} onCountryClick={selectCountry} lcStats={lcStats} anomalies={anomalies} baselineDays={baselineDays}/>}
              {activeTab==="trends"  &&<TrendsTab trends={trends} loading={loading}/>}
              {activeTab==="intel"   &&<IntelTab  intensity={intensity} anomalies={anomalies} loading={loading} onCountryClick={selectCountry}/>}
              {activeTab==="layers"  &&<LayersTab layers={layers} onToggle={toggleLayer} clusterData={clusterData} heatmapData={heatmapData} loading={layerLoad}/>}
            </div>

            {/* Footer */}
            <div style={{padding:"10px 14px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <span style={{fontSize:9,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>NASA FIRMS MODIS / VIIRS</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:loading||layerLoad?T.yellow:T.green,animation:loading||layerLoad?"pulse 1s infinite":"none"}}/>
                <span style={{fontSize:9,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>{loading||layerLoad?"Syncing…":"Live"}</span>
              </div>
            </div>
          </aside>

          {/* Map */}
          <div style={{flex:1,position:"relative"}}>
            {(loading||layerLoad)&&(
              <div style={{position:"absolute",top:12,right:12,zIndex:999,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 12px",fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace",display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:10,height:10,borderRadius:"50%",border:`1.5px solid ${T.border}`,borderTopColor:T.red,animation:"spin 0.8s linear infinite"}}/>
                Loading satellite data…
              </div>
            )}
            <MapContainer center={AFRICA_CENTER} zoom={AFRICA_ZOOM} style={{height:"100%",width:"100%"}} zoomControl>
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Dark">
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© CARTO © OpenStreetMap" maxZoom={19}/>
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="© Esri" maxZoom={19}/>
                </LayersControl.BaseLayer>
              </LayersControl>
              <MapController flyToRef={flyToRef}/>

              {/* Heatmap */}
              {layers.heatmap&&heatmapData.map((cell,i)=>{const lat=parseFloat(cell.lat_bin),lon=parseFloat(cell.lon_bin);return(<Rectangle key={`h-${i}`} bounds={[[lat-0.05,lon-0.05],[lat+0.05,lon+0.05]]} pathOptions={{fillColor:heatColor(parseFloat(cell.total_intensity),maxHeatIntensity),fillOpacity:0.72,color:"transparent",weight:0}}><Popup><div style={{background:T.bgCard,padding:"8px 10px",borderRadius:6,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.white}}><strong style={{color:T.yellow}}>▦ Heatmap Cell</strong><br/>Intensity: {parseFloat(cell.total_intensity).toFixed(1)}<br/>Fires: {parseInt(cell.fire_count)}</div></Popup></Rectangle>);})}

              {/* Clusters */}
              {layers.clusters&&clusterData.map(ev=>(<CircleMarker key={`c-${ev.id}`} center={[parseFloat(ev.latitude),parseFloat(ev.longitude)]} radius={5} pathOptions={{fillColor:clusterColor(ev.cluster_id),fillOpacity:0.78,color:"rgba(255,255,255,0.15)",weight:0.5}}><Popup><div style={{background:T.bgCard,padding:"8px 10px",borderRadius:6,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.white}}><strong style={{color:clusterColor(ev.cluster_id)}}>⬡ Cluster {ev.cluster_id!==null&&Number(ev.cluster_id)>=0?`#${ev.cluster_id}`:"Noise"}</strong><br/>{ev.country||"—"}<br/>Brightness: {parseFloat(ev.brightness).toFixed(1)} K</div></Popup></CircleMarker>))}

              {/* Points */}
              {layers.points&&points.map(ev=>{const lc=getLcConfig(ev.land_cover);return(<CircleMarker key={`p-${ev.id}`} center={[parseFloat(ev.latitude),parseFloat(ev.longitude)]} radius={brightnessToRadius(parseFloat(ev.brightness))} pathOptions={lcPathOptions(parseFloat(ev.brightness),ev.land_cover)}><Popup><div style={{background:T.bgCard,padding:"8px 10px",borderRadius:6,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.white,minWidth:180}}><strong style={{color:T.red}}>🔥 Wildfire Event</strong><br/><span style={{color:T.muted,cursor:"pointer"}} onClick={()=>selectCountry(ev.country)}>{ev.country||"—"} ›</span><br/>Land: <span style={{color:lc.color}}>{ev.land_cover||"Unknown"}</span><br/>Brightness: {parseFloat(ev.brightness).toFixed(1)} K<br/>FRP: {ev.frp?parseFloat(ev.frp).toFixed(1):"—"}<br/>{fmt(ev.acq_time)}</div></Popup></CircleMarker>);})}
            </MapContainer>

            {/* Overlays */}
            <div style={{position:"absolute",bottom:16,left:12,zIndex:999,background:`${T.bgCard}ee`,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",backdropFilter:"blur(8px)"}}>
              <div style={{fontSize:9,color:T.textSub,letterSpacing:1,marginBottom:6,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>BRIGHTNESS SCALE</div>
              <div style={{height:6,borderRadius:3,background:"linear-gradient(90deg,rgba(255,215,0,0.7),rgba(255,100,0,0.85),rgba(255,40,40,1))",marginBottom:4,width:140}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.textSub,fontFamily:"'JetBrains Mono',monospace",width:140}}>
                <span>290K</span><span>400K</span><span>500K+</span>
              </div>
            </div>
            <div style={{position:"absolute",top:12,left:12,zIndex:999}}>
              <div style={{background:`${T.bgCard}ee`,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 12px",display:"inline-flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18,fontWeight:800,color:T.red,fontFamily:"'JetBrains Mono',monospace"}}>{fmtNum(points.length)}</span>
                <span style={{fontSize:10,color:T.textSub}}>fires on map</span>
              </div>
            </div>
            <button style={{position:"absolute",bottom:16,right:12,zIndex:999,padding:"6px 12px",borderRadius:6,background:T.bgCard,border:`1px solid ${T.border}`,color:T.muted,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}} onClick={()=>{if(flyToRef.current)flyToRef.current(AFRICA_CENTER,AFRICA_ZOOM);}}>⊙ Africa</button>
          </div>
        </div>

        {/* Country drawer */}
        {selectedCountry&&<div style={{position:"fixed",inset:0,zIndex:1999,background:"rgba(0,0,0,0.4)"}} onClick={()=>setSelectedCountry(null)}/>}
        <CountryDrawer country={selectedCountry} intensityData={intensity} start={appliedStart} end={appliedEnd} onClose={()=>setSelectedCountry(null)} authFetch={authFetch}/>
      </div>
    </>
  );
}
