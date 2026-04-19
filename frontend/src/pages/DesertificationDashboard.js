// ============================================================================
// DesertificationDashboard.js — ACRIS MODULE 2 · Desertification & Forest Intelligence
// v4 — Forest Clusters tab with health status + fire linkage + JWT auth on all fetches
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  MapContainer, TileLayer, LayersControl,
  FeatureGroup, useMap, GeoJSON, Polygon,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ── API ───────────────────────────────────────────────────────────────────────
const API = "http://localhost/climate_system/api/get_desertification.php";

// ── Theme ─────────────────────────────────────────────────────────────────────
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
  white:     "#f0fdf0",
  muted:     "#86efac",
  textSub:   "#6b7280",
  yellow:    "#fbbf24",
  orange:    "#f97316",
  blue:      "#3b82f6",
  amber:     "#d97706",
};

// ── Health status config ──────────────────────────────────────────────────────
const HEALTH_CONFIG = {
  "Regenerating": { color: T.green,  icon: "🟢", bg: "rgba(34,197,94,0.12)"  },
  "Stable":       { color: T.yellow, icon: "🟡", bg: "rgba(251,191,36,0.12)" },
  "Declining":    { color: T.red,    icon: "🔴", bg: "rgba(239,68,68,0.12)"  },
  "Unknown":      { color: T.textSub,icon: "⚪", bg: "rgba(107,114,128,0.10)"},
};
function healthCfg(status) { return HEALTH_CONFIG[status] || HEALTH_CONFIG["Unknown"]; }

// ── Land cover colours ────────────────────────────────────────────────────────
const LC_COLOR_MAP = {
  "water":"#3b82f6","water bodies":"#3b82f6","wetland":"#60a5fa","wetlands":"#60a5fa",
  "forest":"#15803d","dense forest":"#166534","closed forest":"#14532d","tropical forest":"#166534",
  "broadleaf forest":"#15803d","tree cover":"#15803d","tree covers":"#15803d",
  "open forest":"#22c55e","sparse forest":"#4ade80","degraded forest":"#84cc16",
  "savanna":"#65a30d","woodland":"#4d7c0f","wooded grassland":"#84cc16",
  "shrubland":"#a16207","shrub":"#a16207","sparse shrub":"#ca8a04",
  "grassland":"#bef264","grass":"#bef264","herbaceous":"#d9f99d",
  "cropland":"#f59e0b","agriculture":"#f59e0b",
  "built-up":"#92400e","urban":"#92400e","built up":"#92400e",
  "bare / sparse":"#d4c49a","barren":"#d4c49a","bare soil":"#d4c49a",
  "desert":"#e5d3a8","sparse vegetation":"#e7c98b","rock":"#9ca3af",
};
const LC_FALLBACK=["#8b5cf6","#06b6d4","#ec4899","#14b8a6","#f43f5e","#0ea5e9","#a78bfa"];
// Normalise features from the API: geometry may arrive as a JSON string (PDO
// returns ::json columns as strings). Parse it, and accept any geometry type
// Leaflet supports (Polygon, MultiPolygon, GeometryCollection).
function normalizeFeatures(features) {
  if (!Array.isArray(features)) return [];
  return features.reduce((acc, f) => {
    if (!f) return acc;
    let geom = f.geometry;
    // If geometry is a string (double-encoded), parse it
    if (typeof geom === 'string') {
      try { geom = JSON.parse(geom); } catch { return acc; }
    }
    if (!geom || !geom.type) return acc;
    // Leaflet supports: Point, MultiPoint, LineString, MultiLineString,
    // Polygon, MultiPolygon, GeometryCollection
    const supported = ['Point','MultiPoint','LineString','MultiLineString',
                       'Polygon','MultiPolygon','GeometryCollection'];
    if (!supported.includes(geom.type)) return acc;
    acc.push({ ...f, geometry: geom });
    return acc;
  }, []);
}


function getLcColor(t,i) {
  if (!t) return LC_FALLBACK[i%LC_FALLBACK.length];
  return LC_COLOR_MAP[t.toLowerCase().trim()]||LC_FALLBACK[i%LC_FALLBACK.length];
}

// ── Risk helpers ──────────────────────────────────────────────────────────────
const riskColor=(s)=>{if(!s)return"#374151";if(s>=4.5)return T.red;if(s>=4.0)return T.orange;if(s>=3.0)return T.yellow;if(s>=2.0)return T.greenDim;return T.green;};
const riskLabelColor=(l)=>({Critical:T.red,High:T.orange,Elevated:T.yellow,Moderate:T.greenDim,Low:T.green}[l]||T.textSub);

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt=(v,d=2)=>v!=null?Number(v).toFixed(d):"—";
const pct=(v)=>v!=null?`${Number(v).toFixed(1)}%`:"—";
const fmtNum=(n)=>Number(n||0).toLocaleString();
function fmtDate(iso){if(!iso)return"—";try{return new Date(iso).toLocaleDateString("en-GB",{year:"numeric",month:"short",day:"2-digit"});}catch{return iso;}}

// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: #0a0f0a; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0f0a; }
  ::-webkit-scrollbar-thumb { background: #1e3a1e; border-radius: 2px; }
  .leaflet-container { background: #0a0f0a !important; }
  .leaflet-tile { filter: brightness(0.85) saturate(0.7) hue-rotate(5deg); }
  .leaflet-control-layers, .leaflet-bar a {
    background: #111d11 !important; border-color: #1e3a1e !important; color: #f0fdf0 !important;
  }
  .leaflet-control-layers-base label, .leaflet-control-layers-overlays label { color: #f0fdf0 !important; }
  .acris-tt {
    background: #111d11 !important; border: 1px solid #1e3a1e !important;
    color: #f0fdf0 !important; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; border-radius: 6px; padding: 6px 10px;
  }
  .acris-tt::before { display: none; }
  @keyframes slideInRight { from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
  @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
  @keyframes spin { to{transform:rotate(360deg);} }
  .leaflet-draw-draw-rectangle {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2322c55e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='6' width='18' height='12' rx='2'/%3E%3C/svg%3E") !important;
    background-repeat:no-repeat !important; background-position:center !important; background-size:16px !important;
  }
  .leaflet-draw-draw-polygon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2322c55e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5'/%3E%3C/svg%3E") !important;
    background-repeat:no-repeat !important; background-position:center !important; background-size:16px !important;
  }
  .leaflet-draw-toolbar a { background-color:#111d11 !important; border-color:#1e3a1e !important; }
  .leaflet-draw-toolbar a:hover { background-color:#162016 !important; }
  .leaflet-draw-toolbar a.leaflet-draw-toolbar-button-enabled { background-color:rgba(34,197,94,0.15) !important; }
`;

// ── Shared small components ───────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:100}}>
      <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.green,animation:"spin 0.8s linear infinite"}}/>
    </div>
  );
}
function Badge({label,color}) {
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,background:`${color}22`,color,border:`1px solid ${color}44`}}>{label}</span>;
}
function SectionTitle({children,style={}}) {
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:T.green,marginBottom:8,marginTop:4,textTransform:"uppercase",...style}}>{children}</div>;
}
function DrawerSection({title,children}) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:T.green,marginBottom:8,textTransform:"uppercase",paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{title}</div>
      {children}
    </div>
  );
}
function KpiGrid({items}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
      {items.map(item=>(
        <div key={item.label} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:9,color:T.textSub,marginBottom:4,letterSpacing:1,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{item.label}</div>
          <div style={{fontSize:item.large?18:14,fontWeight:800,color:item.accent||T.white,fontFamily:"'JetBrains Mono',monospace"}}>{item.value}</div>
          {item.sub&&<div style={{fontSize:10,color:T.textSub,marginTop:2}}>{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── FlyToCountry ──────────────────────────────────────────────────────────────
function FlyToCountry({target}) {
  const map=useMap();
  useEffect(()=>{if(target)map.flyTo(target.center,target.zoom,{duration:1.4});},[target,map]);
  return null;
}

// ── Canvas grid layer (unchanged from original) ───────────────────────────────
const AcrisCanvasLayer=L.Layer.extend({
  initialize(cells,mapLayer,popup){this._cells=cells;this._mapLayer=mapLayer;this._popup=popup;this._rafId=null;},
  onAdd(map){
    this._map=map;this._canvas=document.createElement("canvas");
    this._canvas.style.cssText="position:absolute;top:0;left:0;pointer-events:none;z-index:400;";
    map.getPanes().overlayPane.appendChild(this._canvas);
    this._onMove=this._onMove.bind(this);this._onResize=this._scheduleRedraw.bind(this);this._onHover=this._onHover.bind(this);
    map.on("moveend zoomend",this._onMove);map.on("resize",this._onResize);
    map.getContainer().addEventListener("mousemove",this._onHover);
    this._scheduleRedraw();return this;
  },
  onRemove(map){
    if(this._canvas?.parentNode)this._canvas.parentNode.removeChild(this._canvas);
    map.off("moveend zoomend",this._onMove);map.off("resize",this._onResize);
    map.getContainer().removeEventListener("mousemove",this._onHover);
    if(this._rafId)cancelAnimationFrame(this._rafId);this._canvas=null;
  },
  setCells(c){this._cells=c;this._scheduleRedraw();},
  setMapLayer(m){this._mapLayer=m;this._scheduleRedraw();},
  _onMove(){this._scheduleRedraw();},
  _scheduleRedraw(){if(this._rafId)cancelAnimationFrame(this._rafId);this._rafId=requestAnimationFrame(()=>this._redraw());},
  _redraw(){
    if(!this._canvas||!this._map)return;
    const map=this._map,canvas=this._canvas,size=map.getSize();
    canvas.width=size.x;canvas.height=size.y;
    L.DomUtil.setPosition(canvas,map.containerPointToLayerPoint([0,0]));
    const ctx=canvas.getContext("2d"),cells=this._cells,mode=this._mapLayer;
    if(!cells?.length)return;
    const RADIUS=3.5;ctx.clearRect(0,0,size.x,size.y);
    const buckets={};
    for(let i=0;i<cells.length;i++){
      const cell=cells[i],val=mode==="ndvi"?cell.current_ndvi:cell.risk_score;
      const color=mode==="ndvi"?(val>0.5?T.green:val>0.3?T.yellow:T.red):riskColor(val);
      if(!buckets[color])buckets[color]=[];buckets[color].push(i);
    }
    for(const[color,indices]of Object.entries(buckets)){
      ctx.beginPath();ctx.fillStyle=color+"bf";
      for(const ii of indices){const pt=map.latLngToContainerPoint([cells[ii].lat_bin,cells[ii].lon_bin]);ctx.moveTo(pt.x+RADIUS,pt.y);ctx.arc(pt.x,pt.y,RADIUS,0,Math.PI*2);}
      ctx.fill();
    }
    this._screenPts=cells.map(c=>{const pt=map.latLngToContainerPoint([c.lat_bin,c.lon_bin]);return{x:pt.x,y:pt.y};});
  },
  _onHover(e){
    if(!this._screenPts||!this._cells)return;
    const rect=this._map.getContainer().getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const DIST2=144;let best=-1,bestD=Infinity;
    for(let i=0;i<this._screenPts.length;i++){const{x,y}=this._screenPts[i];const d=(x-mx)*(x-mx)+(y-my)*(y-my);if(d<DIST2&&d<bestD){bestD=d;best=i;}}
    if(best===-1){this._map.closePopup(this._popup);return;}
    const cell=this._cells[best];
    this._popup.setLatLng(this._map.containerPointToLatLng([mx,my]))
      .setContent(`<div style="line-height:1.7;color:#f0fdf0"><b style="color:#22c55e">${cell.country||"—"}</b><br/>Risk: <span style="color:${riskLabelColor(cell.risk_label)}">${cell.risk_label||"—"}</span> (${fmt(cell.risk_score)})<br/>NDVI: ${fmt(cell.current_ndvi,3)}<br/>Trend: ${cell.trend_direction||"—"}<br/>Cover: ${cell.land_cover||"—"}</div>`)
      .openOn(this._map);
  },
});

function CanvasGridLayer({cells,mapLayer}){
  const map=useMap(),layerRef=useRef(null),popupRef=useRef(null);
  useEffect(()=>{
    if(!popupRef.current)popupRef.current=L.popup({closeButton:false,className:"acris-tt",autoPan:false,maxWidth:220,offset:[0,-4]});
    const layer = new AcrisCanvasLayer([], "risk", popupRef.current);
layer.addTo(map);
layerRef.current = layer;
    return()=>{layer.remove();layerRef.current=null;};
  },[map]);
  useEffect(()=>{if(layerRef.current)layerRef.current.setCells(cells);},[cells]);
  useEffect(()=>{if(layerRef.current)layerRef.current.setMapLayer(mapLayer);},[mapLayer]);
  return null;
}

// ── Country centres ───────────────────────────────────────────────────────────
const CC={
  "Niger":{center:[17.6,8.0],zoom:6},"Mali":{center:[17.0,-4.0],zoom:6},"Chad":{center:[15.0,18.7],zoom:6},
  "Nigeria":{center:[9.1,8.7],zoom:6},"Ethiopia":{center:[9.1,40.5],zoom:6},"Sudan":{center:[15.5,32.5],zoom:6},
  "Angola":{center:[-11.2,17.9],zoom:6},"Dem. Rep. Congo":{center:[-4.0,21.8],zoom:5},"Congo":{center:[-0.2,15.8],zoom:7},
  "Mozambique":{center:[-18.7,35.5],zoom:6},"Tanzania":{center:[-6.4,34.9],zoom:6},"Kenya":{center:[0.0,38.0],zoom:6},
  "South Africa":{center:[-29.0,25.0],zoom:5},"Zambia":{center:[-13.5,28.0],zoom:6},"Zimbabwe":{center:[-19.0,29.5],zoom:7},
  "Cameroon":{center:[5.7,12.4],zoom:6},"Namibia":{center:[-22.0,18.0],zoom:6},"Botswana":{center:[-22.3,24.7],zoom:6},
  "Madagascar":{center:[-19.0,46.9],zoom:6},"Somalia":{center:[6.0,46.2],zoom:6},"Ghana":{center:[8.0,-1.2],zoom:7},
  "Gabon":{center:[-0.8,11.6],zoom:7},"Uganda":{center:[1.4,32.3],zoom:7},
};

// ── Shapefile helpers (preserved from original) ───────────────────────────────
async function parseShapefileOrGeoJSON(file){
  const name=file.name.toLowerCase();
  if(name.endsWith(".geojson")||name.endsWith(".json")){return JSON.parse(await file.text());}
  if(name.endsWith(".zip")){
    try{
      const shp=await import("shapefile");
      const buf=await file.arrayBuffer();const source=await shp.open(buf);
      const features=[];let result=await source.read();
      while(!result.done){if(result.value)features.push(result.value);result=await source.read();}
      return{type:"FeatureCollection",features};
    }catch(e){throw new Error("Shapefile parsing requires: npm install shapefile\nOr upload a .geojson file instead.");}
  }
  throw new Error("Unsupported file type. Upload .geojson or .zip.");
}
function geojsonToLeafletPositions(geojson){
  const positions=[];
  const extract=(geom)=>{
    if(!geom)return;
    if(geom.type==="Polygon")positions.push(geom.coordinates[0].map(([lng,lat])=>[lat,lng]));
    else if(geom.type==="MultiPolygon")geom.coordinates.forEach(p=>positions.push(p[0].map(([lng,lat])=>[lat,lng])));
  };
  if(geojson.type==="FeatureCollection")geojson.features.forEach(f=>extract(f.geometry));
  else if(geojson.type==="Feature")extract(geojson.geometry);
  else extract(geojson);
  return positions;
}
function buildCsv(data){
  if(!data)return"";
  const rows=[],push=(s,l,v)=>rows.push([s,l,v]);
  const s=data.summary||{};
  push("Summary","Mean NDVI",fmt(s.mean_ndvi,3));push("Summary","NDVI Anomaly",fmt(s.ndvi_anomaly,3));
  push("Summary","Risk Score",fmt(s.risk_score));push("Summary","Risk Level",s.risk_label||"—");
  push("Summary","NDVI Trend",s.trend_direction||"—");push("Summary","Forest Classification",s.forest_classification||"—");
  push("Summary","Forest Cover (%)",pct(s.forest_pct));push("Summary","Grid Cells",s.cell_count||"—");
  for(const r of(data.risk_distribution||[]))push("Risk Distribution",r.risk_label,`${r.percentage}%`);
  for(const lc of(data.land_cover_breakdown||[]))push("Land Cover",lc.type,`${lc.percentage}%`);
  const f=data.fire_activity||{};
  push("Fire Activity","Last 30 Days",f.fire_count_last_30d??"—");push("Fire Activity","Last 90 Days",f.fire_count_last_90d??"—");push("Fire Activity","Last 12 Months",f.fire_count_last_12m??"—");
  const fl=data.forest_loss||{};
  push("Forest Loss","Clusters Detected",fl.cluster_count??"—");push("Forest Loss","Total Loss Area",fl.total_loss_km2?`${fmt(fl.total_loss_km2,0)} km²`:"—");push("Forest Loss","Latest Loss Year",fl.latest_loss_year??"—");
  return"Section,Label,Value\n"+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
}
function timedSignal(sig,ms){
  if(typeof AbortSignal.timeout==="function"&&AbortSignal.any)return AbortSignal.any([sig,AbortSignal.timeout(ms)]);
  return sig;
}
function normaliseLandCover(raw){
  if(!raw?.length)return[];
  const sorted=[...raw].sort((a,b)=>b.percentage-a.percentage);
  const main=[];let otherSum=0;
  for(const item of sorted){if(item.percentage>=2.5)main.push(item);else otherSum+=Number(item.percentage)||0;}
  if(otherSum>0)main.push({type:"Other",percentage:+otherSum.toFixed(1)});
  return main;
}

// ── Left panel tabs ───────────────────────────────────────────────────────────
function RiskPanel({data,onSelect,selected}){
  const sorted=useMemo(()=>[...data].sort((a,b)=>b.avg_risk_score-a.avg_risk_score),[data]);
  return(
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <SectionTitle>Country Risk Ranking</SectionTitle>
      <p style={{fontSize:11,color:T.textSub,marginBottom:12,lineHeight:1.5}}>Composite desertification risk (1–5). Click to zoom and filter the map.</p>
      {sorted.map((c,i)=>(
        <div key={c.country} onClick={()=>onSelect(c)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",marginBottom:3,borderRadius:6,background:selected?.country===c.country?T.bgHover:T.bgCard,border:`1px solid ${selected?.country===c.country?T.greenDim:T.border}`,cursor:"pointer",transition:"all 0.15s"}}>
          <span style={{width:20,fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.textSub,textAlign:"right",flexShrink:0}}>{i+1}</span>
          <span style={{flex:1,fontSize:12,fontWeight:600,color:T.white}}>{c.country}</span>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
            <Badge label={c.dominant_risk_label||"—"} color={riskLabelColor(c.dominant_risk_label)}/>
            <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.textSub}}>{fmt(c.avg_risk_score)}</span>
          </div>
        </div>
      ))}
      <SectionTitle style={{marginTop:20}}>Top 10 Risk Scores</SectionTitle>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={sorted.slice(0,10)} layout="vertical" margin={{left:0,right:8,top:0,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false}/>
          <XAxis type="number" domain={[0,5]} tick={{fontSize:9,fill:T.textSub}}/>
          <YAxis type="category" dataKey="country" tick={{fontSize:9,fill:T.muted}} width={80}/>
          <RTooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,fontSize:11}} labelStyle={{color:T.green}} itemStyle={{color:T.white}}/>
          <Bar dataKey="avg_risk_score" name="Risk Score" radius={[0,3,3,0]}>
            {sorted.slice(0,10).map((e,i)=><Cell key={i} fill={riskColor(e.avg_risk_score)}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function NdviPanel({data,onSelect,selected}){
  const sorted=useMemo(()=>[...data].sort((a,b)=>(a.avg_ndvi_anomaly||0)-(b.avg_ndvi_anomaly||0)),[data]);
  return(
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <SectionTitle>NDVI Anomaly by Country</SectionTitle>
      <p style={{fontSize:11,color:T.textSub,marginBottom:12,lineHeight:1.5}}>Negative = below seasonal baseline. Scores deepen as data accumulates.</p>
      {sorted.map(c=>(
        <div key={c.country} onClick={()=>onSelect(c)} style={{padding:"8px 10px",marginBottom:4,borderRadius:6,background:selected?.country===c.country?T.bgHover:T.bgCard,border:`1px solid ${selected?.country===c.country?T.greenDim:T.border}`,cursor:"pointer",transition:"all 0.15s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,fontWeight:600,color:T.white}}>{c.country}</span>
            <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:(c.avg_ndvi_anomaly||0)<0?T.red:T.green}}>{fmt(c.avg_ndvi_anomaly,3)}</span>
          </div>
          <div style={{marginTop:4,height:3,background:T.border,borderRadius:2}}>
            <div style={{height:"100%",borderRadius:2,width:`${Math.min(Math.abs(c.avg_ndvi_anomaly||0)*100,100)}%`,background:(c.avg_ndvi_anomaly||0)<0?T.red:T.green,transition:"width 0.5s ease"}}/>
          </div>
          <div style={{fontSize:10,color:T.textSub,marginTop:3}}>Trend: {c.ndvi_trend||"—"} · Below normal: {pct(c.pct_below_normal)}</div>
        </div>
      ))}
    </div>
  );
}

function ForestPanel({data,clusters,onSelect,selected}){
  const withLoss=useMemo(()=>[...data].filter(c=>c.forest_loss_km2>0).sort((a,b)=>b.forest_loss_km2-a.forest_loss_km2),[data]);
  return(
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <SectionTitle>Forest Loss by Country</SectionTitle>
      <p style={{fontSize:11,color:T.textSub,marginBottom:12,lineHeight:1.5}}>Clustered forest loss 2019–2023. Toggle <span style={{color:T.muted,fontWeight:700}}>Forest Loss Hotspots (Legacy)</span> in the map layer control <span style={{color:T.muted}}>⊞</span> (top-right of map) to overlay cluster polygons.</p>
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",marginBottom:12}}>
        <div style={{fontSize:10,color:T.textSub,marginBottom:4}}>TOTAL CLUSTERS DETECTED</div>
        <div style={{fontSize:22,fontWeight:800,color:T.red,fontFamily:"'JetBrains Mono',monospace"}}>{clusters.length}</div>
      </div>
      {withLoss.slice(0,20).map(c=>(
        <div key={c.country} onClick={()=>onSelect(c)} style={{padding:"8px 10px",marginBottom:4,borderRadius:6,background:selected?.country===c.country?T.bgHover:T.bgCard,border:`1px solid ${selected?.country===c.country?T.greenDim:T.border}`,cursor:"pointer",transition:"all 0.15s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,fontWeight:600,color:T.white}}>{c.country}</span>
            <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:T.red}}>{fmt(c.forest_loss_km2,0)} km²</span>
          </div>
          <div style={{fontSize:10,color:T.textSub,marginTop:2}}>Latest loss year: {c.latest_loss_year||"—"}</div>
        </div>
      ))}
    </div>
  );
}

// ── NEW: Forest Clusters Panel ────────────────────────────────────────────────
function ForestClustersPanel({forestClusters,loadingClusters,selectedCluster,onSelectCluster,healthSummary}){
  const [filterHealth,setFilterHealth]=useState("All");
  const [sortBy,setSortBy]=useState("hotspot_rank");

  const filtered=useMemo(()=>{
    let arr=[...forestClusters];
    if(filterHealth!=="All")arr=arr.filter(f=>f.properties.health_status===filterHealth);
    arr.sort((a,b)=>{
      const pa=a.properties,pb=b.properties;
      if(sortBy==="hotspot_rank")return(pa.hotspot_rank||999)-(pb.hotspot_rank||999);
      if(sortBy==="fire_12m")return(pb.fire_12m||0)-(pa.fire_12m||0);
      if(sortBy==="loss_area")return(pb.total_loss_area_km2||0)-(pa.total_loss_area_km2||0);
      return 0;
    });
    return arr;
  },[forestClusters,filterHealth,sortBy]);

  if(loadingClusters)return<Spinner/>;
  if(!forestClusters.length)return(
    <div style={{padding:16,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>🌿</div>
      <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:6}}>No Clusters Loaded</div>
      <div style={{fontSize:11,color:T.textSub,lineHeight:1.6}}>Select a country from the <strong style={{color:T.muted}}>Risk</strong> or <strong style={{color:T.muted}}>Forest</strong> tab to load enriched cluster data for that region.</div>
    </div>
  );

  return(
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <SectionTitle>Forest Cluster Health · Africa</SectionTitle>

      {/* Health summary pills */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {["All","Regenerating","Stable","Declining"].map(h=>{
          const cfg=h==="All"?{color:T.green,icon:"🌍"}:healthCfg(h);
          const count=h==="All"?forestClusters.length:(healthSummary[h]||0);
          return(
            <button key={h} onClick={()=>setFilterHealth(h)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:filterHealth===h?`${cfg.color}22`:"transparent",border:`1px solid ${filterHealth===h?cfg.color:T.border}`,color:filterHealth===h?cfg.color:T.textSub,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",transition:"all 0.15s"}}>
              {h!=="All"&&<span>{cfg.icon}</span>}
              <span>{h}</span>
              <span style={{opacity:0.7}}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[{k:"hotspot_rank",l:"Rank"},{k:"fire_12m",l:"Fires"},{k:"loss_area",l:"Loss Area"}].map(s=>(
          <button key={s.k} onClick={()=>setSortBy(s.k)} style={{flex:1,padding:"5px 0",borderRadius:6,background:sortBy===s.k?T.greenGlow:"transparent",border:`1px solid ${sortBy===s.k?T.green:T.border}`,color:sortBy===s.k?T.green:T.textSub,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>{s.l}</button>
        ))}
      </div>

      {/* Cluster list */}
      {filtered.slice(0,60).map(feat=>{
        const p=feat.properties;
        const hcfg=healthCfg(p.health_status);
        const isSelected=selectedCluster?.properties?.cluster_id===p.cluster_id;
        return(
          <div key={p.cluster_id} onClick={()=>onSelectCluster(feat)} style={{padding:"10px 12px",marginBottom:5,borderRadius:8,background:isSelected?T.bgHover:T.bgCard,border:`1px solid ${isSelected?hcfg.color:T.border}`,cursor:"pointer",transition:"all 0.15s",boxShadow:isSelected?`0 0 0 1px ${hcfg.color}33`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:14}}>{hcfg.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:T.white,display:"flex",alignItems:"center",gap:6}}>
                  <span>#{p.hotspot_rank}</span>
                  <span style={{color:T.textSub,fontWeight:400}}>·</span>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.country||"Unknown"}</span>
                </div>
                <div style={{fontSize:10,color:hcfg.color,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",marginTop:1}}>{p.health_status}</div>
              </div>
              {p.fire_12m>0&&(
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:800,color:p.fire_12m>50?T.red:p.fire_12m>10?T.orange:T.yellow,fontFamily:"'JetBrains Mono',monospace"}}>{fmtNum(p.fire_12m)}</div>
                  <div style={{fontSize:9,color:T.textSub}}>fires/yr</div>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:12}}>
              <div style={{fontSize:10,color:T.textSub}}>
                Loss: <span style={{color:T.orange,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{fmt(p.total_loss_area_km2,0)} km²</span>
              </div>
              <div style={{fontSize:10,color:T.textSub}}>
                NDVI: <span style={{color:p.avg_ndvi_anomaly<0?T.red:T.green,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{p.avg_ndvi_anomaly!=null?fmt(p.avg_ndvi_anomaly,3):"—"}</span>
              </div>
            </div>
          </div>
        );
      })}
      {filtered.length===0&&(
        <div style={{padding:20,textAlign:"center",fontSize:12,color:T.textSub}}>No clusters match this filter.</div>
      )}
    </div>
  );
}

// ── Draw Panel ────────────────────────────────────────────────────────────────
function DrawPanel({onShapefileUpload,shapefileError,shapefileLoading,shapefileGeoJSON,onClearShapefile}){
  const fileInputRef=useRef(null);
  function handleFileChange(e){const file=e.target.files?.[0];if(file)onShapefileUpload(file);e.target.value="";}
  return(
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <SectionTitle>Area Analysis Tool</SectionTitle>
      <div style={{background:T.bgCard,border:`1px solid ${T.greenDim}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:T.green,marginBottom:8}}>Draw on Map</div>
        {[{step:"1",text:"Click the rectangle ▭ or polygon ⬡ tool in the top-left of the map."},{step:"2",text:"Draw your area of interest across any part of Africa."},{step:"3",text:"The analysis panel opens automatically with full intelligence report."}].map(s=>(
          <div key={s.step} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
            <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:T.green,color:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{s.step}</div>
            <p style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{s.text}</p>
          </div>
        ))}
      </div>
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:T.green,marginBottom:8}}>Upload Shapefile</div>
        <p style={{fontSize:11,color:T.textSub,marginBottom:12,lineHeight:1.5}}>Upload a <strong style={{color:T.muted}}>.geojson</strong> or <strong style={{color:T.muted}}>.zip</strong> shapefile to run the same spatial analysis on your own boundary.</p>
        <input ref={fileInputRef} type="file" accept=".geojson,.json,.zip" style={{display:"none"}} onChange={handleFileChange}/>
        {!shapefileGeoJSON?(
          <button onClick={()=>fileInputRef.current?.click()} disabled={shapefileLoading} style={{width:"100%",padding:"10px 0",borderRadius:6,background:shapefileLoading?"transparent":T.greenGlow,border:`1px solid ${shapefileLoading?T.border:T.green}`,color:shapefileLoading?T.textSub:T.green,fontSize:12,fontWeight:700,cursor:shapefileLoading?"wait":"pointer",fontFamily:"'Syne',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {shapefileLoading?<><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.green,animation:"spin 0.8s linear infinite"}}/>Parsing…</>:<><span style={{fontSize:16}}>⬆</span>Choose File (.geojson or .zip)</>}
          </button>
        ):(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:`${T.green}11`,border:`1px solid ${T.green}33`,borderRadius:6,marginBottom:8}}>
              <div style={{fontSize:11,color:T.green}}>✓ Shapefile loaded — analysis running</div>
              <button onClick={onClearShapefile} style={{background:"none",border:"none",cursor:"pointer",color:T.textSub,fontSize:14,padding:"0 4px"}}>×</button>
            </div>
            <button onClick={()=>fileInputRef.current?.click()} style={{width:"100%",padding:"8px 0",borderRadius:6,background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,fontSize:11,cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>Upload a different file</button>
          </div>
        )}
        {shapefileError&&<div style={{marginTop:10,padding:"8px 10px",background:`${T.red}11`,border:`1px solid ${T.red}33`,borderRadius:6,fontSize:11,color:T.red,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{shapefileError}</div>}
      </div>
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:12}}>
        <div style={{fontSize:11,color:T.textSub,marginBottom:6,fontWeight:600}}>ANALYSIS INCLUDES</div>
        {["Mean NDVI + anomaly score","3-month vegetation trend","Composite risk score + distribution","Land cover breakdown chart","Rainfall context — drought vs degradation","Fire activity (30d / 90d / 12m)","Forest loss cluster summary","Forest health classification"].map(item=>(
          <div key={item} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:T.green,flexShrink:0}}/>
            <span style={{fontSize:11,color:T.muted}}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Country card (bottom of panel) ───────────────────────────────────────────
function CountryCard({stats,onClose}){
  return(
    <div style={{background:T.bgPanel,borderTop:`1px solid ${T.border}`,padding:12,animation:"fadeIn 0.25s ease",flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:700,color:T.green}}>{stats.country}</div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.textSub,fontSize:18,lineHeight:1,padding:"0 4px"}}>×</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {[
          {label:"Risk Score",  value:fmt(stats.avg_risk_score)},
          {label:"Risk Label",  value:stats.dominant_risk_label||"—"},
          {label:"NDVI Anomaly",value:fmt(stats.avg_ndvi_anomaly,3)},
          {label:"NDVI Trend",  value:stats.ndvi_trend||"—"},
          {label:"% High Risk", value:pct(stats.pct_high_risk)},
          {label:"Forest Loss", value:stats.forest_loss_km2?`${fmt(stats.forest_loss_km2,0)} km²`:"—"},
        ].map(item=>(
          <div key={item.label} style={{background:T.bgCard,borderRadius:4,padding:"5px 8px"}}>
            <div style={{fontSize:9,color:T.textSub,marginBottom:2}}>{item.label}</div>
            <div style={{fontSize:12,fontWeight:600,color:T.white}}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NEW: Forest Cluster Detail Drawer ─────────────────────────────────────────
function ClusterDrawer({cluster,onClose}){
  if(!cluster)return null;
  const p=cluster.properties;
  const hcfg=healthCfg(p.health_status);

  const causalityColor=p.causality_label==="Fire as Driver"?T.red:p.causality_label==="Bidirectional"?T.orange:p.causality_label==="Fire as Symptom"?T.yellow:T.textSub;

  return(
    <div style={{position:"fixed",top:0,right:0,width:380,height:"100vh",background:T.bgPanel,borderLeft:`1px solid ${T.border}`,zIndex:2000,display:"flex",flexDirection:"column",animation:"slideInRight 0.3s ease",boxShadow:"-8px 0 32px rgba(0,0,0,0.6)"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:`${hcfg.color}08`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>{hcfg.icon}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.white}}>Cluster #{p.hotspot_rank} · {p.country}</div>
            <div style={{fontSize:10,marginTop:2,fontFamily:"'JetBrains Mono',monospace",color:hcfg.color,fontWeight:700,letterSpacing:1}}>{p.health_status?.toUpperCase()}</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,color:T.textSub,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>✕</button>
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:"auto",padding:16}}>

        {/* Health KPIs */}
        <DrawerSection title="Vegetation Health">
          <KpiGrid items={[
            {label:"Health Status",   value:p.health_status||"—",        accent:hcfg.color,large:true},
            {label:"Avg NDVI Anomaly",value:p.avg_ndvi_anomaly!=null?fmt(p.avg_ndvi_anomaly,3):"—", accent:p.avg_ndvi_anomaly<0?T.red:T.green},
            {label:"Avg NDVI",        value:p.avg_ndvi!=null?fmt(p.avg_ndvi,3):"—",               accent:T.muted},
            {label:"NDVI Trend 3M",   value:p.avg_ndvi_trend_3m!=null?fmt(p.avg_ndvi_trend_3m,4):"—",accent:T.muted},
            {label:"Dominant Trend",  value:p.dominant_trend||"—",        accent:p.dominant_trend==="Declining"?T.red:p.dominant_trend==="Improving"?T.green:T.yellow},
            {label:"Risk Label",      value:p.dominant_risk_label||"—",   accent:riskLabelColor(p.dominant_risk_label)},
          ]}/>
        </DrawerSection>

        {/* Forest loss */}
        <DrawerSection title="Forest Loss">
          <KpiGrid items={[
            {label:"Total Loss Area",  value:`${fmt(p.total_loss_area_km2,0)} km²`, accent:T.red,    large:true},
            {label:"Dominant Loss Year",value:p.dominant_year||"—",                 accent:T.orange},
            {label:"Avg Loss %",       value:pct((p.avg_loss_pct||0)*100),           accent:T.yellow},
            {label:"Grid Cells",       value:fmtNum(p.grid_cell_count),              accent:T.muted},
          ]}/>
        </DrawerSection>

        {/* Fire linkage */}
        <DrawerSection title="Fire Activity — Within Cluster">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            {[
              {label:"Last 30 Days", value:p.fire_30d||0, accent:p.fire_30d>0?T.red:T.textSub},
              {label:"Last 90 Days", value:p.fire_90d||0, accent:p.fire_90d>5?T.red:p.fire_90d>0?T.orange:T.textSub},
              {label:"Last 12M",     value:p.fire_12m||0, accent:p.fire_12m>20?T.red:p.fire_12m>5?T.orange:T.textSub},
            ].map(f=>(
              <div key={f.label} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 0",textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:800,color:f.accent,fontFamily:"'JetBrains Mono',monospace"}}>{fmtNum(f.value)}</div>
                <div style={{fontSize:9,color:T.textSub,marginTop:3}}>{f.label}</div>
              </div>
            ))}
          </div>
          {(p.avg_fire_brightness||p.avg_fire_frp)&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {p.avg_fire_brightness&&<div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:9,color:T.textSub,marginBottom:3}}>AVG BRIGHTNESS</div>
                <div style={{fontSize:14,fontWeight:700,color:T.orange,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(p.avg_fire_brightness,1)} K</div>
              </div>}
              {p.avg_fire_frp&&<div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:9,color:T.textSub,marginBottom:3}}>AVG FRP (MW)</div>
                <div style={{fontSize:14,fontWeight:700,color:T.yellow,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(p.avg_fire_frp,1)}</div>
              </div>}
            </div>
          )}
          {p.last_fire_detected&&(
            <div style={{marginTop:8,fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>
              Last detection: <span style={{color:T.muted}}>{fmtDate(p.last_fire_detected)}</span>
            </div>
          )}
        </DrawerSection>

        {/* Fire-NDVI causality */}
        {p.causality_label&&p.causality_label!=="Unknown"&&(
          <DrawerSection title="Fire–Vegetation Causality">
            <div style={{background:`${causalityColor}0f`,border:`1px solid ${causalityColor}33`,borderRadius:8,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:causalityColor,flexShrink:0}}/>
                <div style={{fontSize:13,fontWeight:700,color:causalityColor}}>{p.causality_label}</div>
              </div>
              <p style={{fontSize:11,color:T.muted,lineHeight:1.6}}>
                {p.causality_label==="Fire as Driver"&&"Fire activity increased before vegetation declined — fire is likely a primary cause of forest degradation in this cluster."}
                {p.causality_label==="Fire as Symptom"&&"Vegetation declined before fire activity increased — fire follows stress. Degradation is the primary driver."}
                {p.causality_label==="Bidirectional"&&"Fire and vegetation decline show mutual reinforcement — a feedback loop may be active in this cluster."}
              </p>
              {p.avg_fire_feedback_ratio!=null&&(
                <div style={{marginTop:8,fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>
                  Fire Feedback Ratio: <span style={{color:causalityColor}}>{fmt(p.avg_fire_feedback_ratio,3)}</span>
                  <span style={{color:T.textSub,marginLeft:6}}>({p.causality_confidence||"—"} confidence)</span>
                </div>
              )}
            </div>
          </DrawerSection>
        )}

        <div style={{fontSize:10,color:T.textSub,textAlign:"center",marginTop:8,fontFamily:"'JetBrains Mono',monospace"}}>
          Cluster ID {p.cluster_id} · ACRIS Module 2 · {new Date().toISOString().slice(0,10)}
        </div>
      </div>
    </div>
  );
}

// ── Area Analysis Drawer (preserved from original) ────────────────────────────
function AreaDrawer({loading,data,onClose,onDownloadPdf,onDownloadCsv,pdfLoading,drawerRef,drawerWrapRef}){
  const renderPieLabel=({cx,cy,midAngle,innerRadius,outerRadius,percentage})=>{
    if(percentage<5)return null;
    const RADIAN=Math.PI/180;
    const radius=innerRadius+(outerRadius-innerRadius)*0.55;
    const x=cx+radius*Math.cos(-midAngle*RADIAN);
    const y=cy+radius*Math.sin(-midAngle*RADIAN);
    return<text x={x} y={y} fill="#f0fdf0" textAnchor="middle" dominantBaseline="central" fontSize={9} fontFamily="'JetBrains Mono',monospace">{`${percentage}%`}</text>;
  };

  if(loading){return(
    <div style={{position:"fixed",top:0,right:0,width:420,height:"100vh",background:T.bgPanel,borderLeft:`1px solid ${T.border}`,zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.green,animation:"spin 0.8s linear infinite"}}/>
      <div style={{fontSize:13,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>Running spatial analysis…</div>
    </div>
  );}

  if(!data)return null;
  if(data.error){return(
    <div style={{position:"fixed",top:0,right:0,width:420,height:"100vh",background:T.bgPanel,borderLeft:`1px solid ${T.border}`,zIndex:2000,display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"flex-end",padding:12}}><button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,color:T.textSub,cursor:"pointer",padding:"4px 10px",fontSize:12}}>✕ Close</button></div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,padding:24}}>
        <div style={{fontSize:24}}>⚠</div>
        <div style={{fontSize:13,color:T.red,textAlign:"center",lineHeight:1.5}}>{data.error}</div>
      </div>
    </div>
  );}

  const s=data.summary||{},fire=data.fire_activity||{},forest=data.forest_loss||{},rc=data.rainfall_context;
  const lc=normaliseLandCover(data.land_cover_breakdown||[]);
  const lcColors=lc.map((item,i)=>getLcColor(item.type,i));
  const forestClsColor={["Stable Forest"]:T.green,["At Risk"]:T.yellow,["Degraded Forest"]:T.orange,["Non-Forest"]:T.textSub}[s.forest_classification]||T.textSub;

  return(
    <div style={{position:"fixed",top:0,right:0,width:420,height:"100vh",background:T.bgPanel,borderLeft:`1px solid ${T.border}`,zIndex:2000,display:"flex",flexDirection:"column",animation:"slideInRight 0.3s ease",boxShadow:"-8px 0 32px rgba(0,0,0,0.6)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.green}}>Area Intelligence Report</div>
          <div style={{fontSize:10,color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>{s.dominant_country||"Custom Area"}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={onDownloadCsv} style={{padding:"5px 10px",borderRadius:6,background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>CSV</button>
          <button onClick={onDownloadPdf} disabled={pdfLoading} style={{padding:"5px 10px",borderRadius:6,background:T.greenGlow,border:`1px solid ${T.green}`,color:T.green,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
            {pdfLoading?"…":"PDF"}
          </button>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,color:T.textSub,cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✕</button>
        </div>
      </div>
      <div ref={drawerRef} style={{flex:1,overflowY:"auto",padding:16}}>
        <div ref={drawerWrapRef}>
          <DrawerSection title="Vegetation Summary">
            <KpiGrid items={[
              {label:"Mean NDVI",           value:fmt(s.mean_ndvi,3),          accent:s.mean_ndvi>0.5?T.green:s.mean_ndvi>0.3?T.yellow:T.red,large:true},
              {label:"NDVI Anomaly",        value:fmt(s.ndvi_anomaly,3),        accent:s.ndvi_anomaly<0?T.red:T.green},
              {label:"Risk Score",          value:fmt(s.risk_score),            accent:riskColor(s.risk_score)},
              {label:"Risk Level",          value:s.risk_label||"—",            accent:riskLabelColor(s.risk_label)},
              {label:"Trend Direction",     value:s.trend_direction||"—",       accent:s.trend_direction==="Declining"?T.red:T.green},
              {label:"Forest Classification",value:s.forest_classification||"—",accent:forestClsColor},
            ]}/>
          </DrawerSection>

          {lc.length>0&&(
            <DrawerSection title="Land Cover Breakdown">
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {lc.map((item,i)=>(
                  <div key={item.type} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:10,height:10,borderRadius:2,background:lcColors[i],border:`1px solid ${lcColors[i]}88`,flexShrink:0}}/>
                    <span style={{fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>{item.type} <span style={{color:T.textSub}}>({item.percentage}%)</span></span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={lc} dataKey="percentage" nameKey="type" cx="50%" cy="50%" outerRadius={75} innerRadius={32} paddingAngle={2} labelLine={false} label={renderPieLabel}>
                    {lc.map((item,i)=><Cell key={item.type} fill={lcColors[i]}/>)}
                  </Pie>
                  <RTooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,fontSize:11}} itemStyle={{color:T.white}} formatter={(v,n)=>[`${v}%`,n]}/>
                </PieChart>
              </ResponsiveContainer>
            </DrawerSection>
          )}

          <DrawerSection title="Fire Activity">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[{label:"Last 30 days",value:fire.fire_count_last_30d??0},{label:"Last 90 days",value:fire.fire_count_last_90d??0},{label:"Last 12 months",value:fire.fire_count_last_12m??0}].map(f=>(
                <div key={f.label} style={{background:T.bgCard,borderRadius:6,padding:"8px 10px",textAlign:"center",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:18,fontWeight:800,color:f.value>0?T.red:T.green,fontFamily:"'JetBrains Mono',monospace"}}>{f.value}</div>
                  <div style={{fontSize:9,color:T.textSub,marginTop:2}}>{f.label}</div>
                </div>
              ))}
            </div>
          </DrawerSection>

          <DrawerSection title="Forest Loss (2019–2023)">
            <KpiGrid items={[
              {label:"Clusters Detected",value:forest.cluster_count??0,   accent:T.red},
              {label:"Total Loss Area",  value:forest.total_loss_km2?`${fmt(forest.total_loss_km2,0)} km²`:"—", accent:T.orange},
              {label:"Avg Loss per Cell",value:forest.avg_loss_pct?pct(forest.avg_loss_pct*100):"—",            accent:T.yellow},
              {label:"Latest Loss Year", value:forest.latest_loss_year??  "—",                                  accent:T.muted},
            ]}/>
          </DrawerSection>

          {rc&&!rc.error&&(
            <DrawerSection title="Rainfall Context">
              <KpiGrid items={[
                {label:"Current Rainfall",value:`${rc.current_rainfall_mm??0} mm`,  accent:T.blue},
                {label:"Baseline Rainfall",value:`${rc.baseline_rainfall_mm??0} mm`, accent:T.muted},
                {label:"Anomaly %",        value:rc.anomaly_pct!=null?`${rc.anomaly_pct>0?"+":""}${rc.anomaly_pct}%`:"—", accent:rc.anomaly_pct<0?T.red:T.green},
                {label:"Cause",            value:rc.cause_interpretation?.replace(/_/g," ")||"—",accent:T.muted},
              ]}/>
            </DrawerSection>
          )}

          <div style={{fontSize:10,color:T.textSub,textAlign:"center",marginTop:8,fontFamily:"'JetBrains Mono',monospace"}}>
            Generated {data.generated_at} · ACRIS Module 2
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
export default function DesertificationDashboard() {
  const { authFetch, logout, user, ready, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab,         setActiveTab]         = useState("risk");
  const [countryStats,      setCountryStats]       = useState([]);
  const [gridCells,         setGridCells]          = useState([]);
  const [clusters,          setClusters]           = useState([]); // legacy hotspot GeoJSON features
  const [forestClusters,    setForestClusters]     = useState([]); // NEW: enriched cluster features
  const [healthSummary,     setHealthSummary]      = useState({});
  const [loadingClusters,   setLoadingClusters]    = useState(false);
  const [selectedCountry,   setSelectedCountry]    = useState(null);
  const [selectedCluster,   setSelectedCluster]    = useState(null); // NEW
  const [flyTarget,         setFlyTarget]          = useState(null);
  const [loadingPanel,      setLoadingPanel]       = useState(true);
  const [loadingMap,        setLoadingMap]         = useState(false);
  const [drawer,            setDrawer]             = useState(null);
  const [drawerLoading,     setDrawerLoading]      = useState(false);
  const [mapLayer,          setMapLayer]           = useState("risk");
  const [pdfLoading,        setPdfLoading]         = useState(false);
  const [shapefileGeoJSON,  setShapefileGeoJSON]   = useState(null);
  const [shapefilePositions,setShapefilePositions] = useState([]);
  const [shapefileError,    setShapefileError]     = useState(null);
  const [shapefileLoading,  setShapefileLoading]   = useState(false);

  const gridAbortRef    = useRef(null);
  const drawerAbortRef  = useRef(null);
  const statsAbortRef   = useRef(null);
  const clusterAbortRef = useRef(null);
  const drawerRef       = useRef(null);
  const drawerWrapRef   = useRef(null);
  const featureGroupRef = useRef(null);
  const selectTimerRef  = useRef(null);

  // Inject CSS
  useEffect(()=>{
    if(!document.getElementById("acris-m2-styles")){
      const el=document.createElement("style");el.id="acris-m2-styles";el.textContent=GLOBAL_CSS;document.head.appendChild(el);
    }
    return()=>{document.getElementById("acris-m2-styles")?.remove();};
  },[]);

useEffect(() => {
  if (!ready) return; // ← wait for token hydration from localStorage
// Check if user is authenticated
  if (!token) {
    navigate('/login');
    return;
  }
  fetchCountryStats().then(() => fetchGridCells(""));
  fetchLegacyClusters();
  // Forest clusters loaded on country selection (requires filter for performance)
}, [ready, token, navigate]); // ← re-run once `ready` flips to true

 async function fetchCountryStats() {
  statsAbortRef.current?.abort();
  statsAbortRef.current = new AbortController();
  setLoadingPanel(true);
  try {
    const r = await authFetch(`${API}?mode=country_stats`);
    if (!r) return; // Add this check
    const d = await r.json();
    if (d.success) setCountryStats(d.data || []);
  } catch(e) {
    if (e?.name !== "AbortError") console.error("country_stats:", e);
  } finally {
    setLoadingPanel(false);
  }
}

async function fetchGridCells(countryFilter) {
  gridAbortRef.current?.abort();
  gridAbortRef.current = new AbortController();
  setLoadingMap(true);
  try {
    const params = countryFilter
      ? `mode=desertification_grid&country=${encodeURIComponent(countryFilter)}&min_risk=1&limit=2000`
      : `mode=desertification_grid&min_risk=2&limit=2000`;
    const r = await authFetch(`${API}?${params}`);
    if (!r) return; // Add this check
    const d = await r.json();
    if (d.success) setGridCells(d.data || []);
  } catch(e) {
    if (e?.name !== "AbortError") console.error("grid:", e);
  } finally {
    setLoadingMap(false);
  }
}

async function fetchLegacyClusters() {
  try {
    const r = await authFetch(`${API}?mode=forest_loss_clusters&format=geojson&top=100`);
    if (!r) return; // Add this check
    const d = await r.json();
    const features = normalizeFeatures(d.features || []);
    if (features.length) setClusters(features);
  } catch(e) { 
    console.error("legacy clusters:", e);
  }
}

async function fetchForestClusters(countryFilter = "") {
  setLoadingClusters(true);
  try {
    const url = countryFilter
      ? `${API}?mode=forest_clusters&country=${encodeURIComponent(countryFilter)}`
      : `${API}?mode=forest_clusters`;
    const r = await authFetch(url);
    if (!r) return;
    const d = await r.json();
    
    // Handle the case where forest_clusters fails
    if (!d.success) {
      console.warn('Forest clusters not available:', d.error);
      setForestClusters([]); // Set empty array instead of crashing
      setHealthSummary({});
      return;
    }
    
    if (d.features) {
      setForestClusters(normalizeFeatures(d.features));
      setHealthSummary(d.health_summary || {});
    }
  } catch(e) { 
    console.error("forest_clusters:", e);
    // Don't let this crash the dashboard
    setForestClusters([]);
    setHealthSummary({});
  } finally { 
    setLoadingClusters(false);
  }
}

  function timedSignal(sig,ms){if(typeof AbortSignal.timeout==="function"&&AbortSignal.any)return AbortSignal.any([sig,AbortSignal.timeout(ms)]);return sig;}
  function clearDrawnLayers(){if(featureGroupRef.current)featureGroupRef.current.clearLayers();}

  async function runAreaAnalysis(geojsonGeometry){
    drawerAbortRef.current?.abort();drawerAbortRef.current=new AbortController();
    setDrawerLoading(true);setDrawer(null);clearDrawnLayers();
    try{
      const r=await authFetch(`${API}?mode=area_analysis`,{method:"POST",body:JSON.stringify({polygon:JSON.stringify(geojsonGeometry)})});
      const d=await r.json();setDrawer(d.success?d:{error:d.error||"Analysis failed"});
    }catch(e){if(e?.name!=="AbortError")setDrawer({error:"Network error: "+e.message});}
    finally{setDrawerLoading(false);}
  }

  const selectCountry=useCallback((c)=>{
    clearTimeout(selectTimerRef.current);
    selectTimerRef.current=setTimeout(()=>{
      setSelectedCountry(c);setSelectedCluster(null);
      const loc=CC[c.country];if(loc)setFlyTarget({...loc});
      fetchGridCells(c.country);
      fetchForestClusters(c.country);
    },300);
  },[]);

  function clearCountry(){clearTimeout(selectTimerRef.current);setSelectedCountry(null);setFlyTarget(null);fetchGridCells("");setForestClusters([]);setHealthSummary({});}

  // NEW: select cluster — fly map to centroid
  const handleSelectCluster=useCallback((feat)=>{
    setSelectedCluster(feat);setSelectedCountry(null);
    const centroid=feat.properties?.centroid;
    if(centroid){
      const coords=typeof centroid==="string"?JSON.parse(centroid):centroid;
      if(coords?.coordinates){
        setFlyTarget({center:[coords.coordinates[1],coords.coordinates[0]],zoom:8});
      }
    }
  },[]);

  const onPolygonCreated=useCallback((e)=>{runAreaAnalysis(e.layer.toGeoJSON().geometry);},[]);

  async function handleShapefileUpload(file){
    if(!file)return;setShapefileError(null);setShapefileLoading(true);setShapefileGeoJSON(null);setShapefilePositions([]);
    try{const gj=await parseShapefileOrGeoJSON(file);const pos=geojsonToLeafletPositions(gj);setShapefileGeoJSON(gj);setShapefilePositions(pos);await runAreaAnalysis(gj);}
    catch(e){setShapefileError(e.message);}
    finally{setShapefileLoading(false);}
  }
  function clearShapefile(){setShapefileGeoJSON(null);setShapefilePositions([]);setShapefileError(null);setDrawer(null);}

  async function downloadPdf(){
    const target=drawerWrapRef.current;if(!drawer||!target||pdfLoading)return;setPdfLoading(true);
    try{
      const{default:html2canvas}=await import("html2canvas");const{jsPDF}=await import("jspdf");
      const scrollEl=drawerRef.current;const prevMaxH=scrollEl?.style.maxHeight,prevOvY=scrollEl?.style.overflowY;
      if(scrollEl){scrollEl.style.maxHeight="none";scrollEl.style.overflowY="visible";}
      await new Promise(r=>setTimeout(r,150));
      const canvas=await html2canvas(target,{backgroundColor:"#0f1a0f",scale:2,useCORS:true,logging:false,windowWidth:794,windowHeight:target.scrollHeight,onclone:(doc)=>doc.querySelectorAll(".no-print").forEach(el=>el.style.display="none")});
      if(scrollEl){scrollEl.style.maxHeight=prevMaxH;scrollEl.style.overflowY=prevOvY;}
      const imgData=canvas.toDataURL("image/png");const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight();
      const margin=8,usableW=pageW-margin*2,usableH=pageH-margin*2;
      const imgW=canvas.width,imgH=canvas.height,ratio=usableW/imgW,scaledH=imgH*ratio;
      if(scaledH<=usableH){pdf.addImage(imgData,"PNG",margin,margin,usableW,scaledH);}
      else{const pageImgH=Math.floor(usableH/ratio);let yOffset=0,pageNum=0;while(yOffset<imgH){if(pageNum>0)pdf.addPage();const sliceH=Math.min(pageImgH,imgH-yOffset);const pc=document.createElement("canvas");pc.width=imgW;pc.height=sliceH;pc.getContext("2d").drawImage(canvas,0,yOffset,imgW,sliceH,0,0,imgW,sliceH);pdf.addImage(pc.toDataURL("image/png"),"PNG",margin,margin,usableW,sliceH*ratio);yOffset+=sliceH;pageNum++;}}
      const region=drawer?.summary?.dominant_country||"Area";pdf.save(`ACRIS_M2_${region.replace(/[^a-z0-9]/gi,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
    }catch(e){alert("PDF export failed. Run: npm install html2canvas jspdf\n"+e.message);}
    finally{setPdfLoading(false);}
  }
  function downloadCsv(){if(!drawer)return;const blob=new Blob([buildCsv(drawer)],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`ACRIS_M2_Analysis_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);}

  const selectedStats=useMemo(()=>selectedCountry?countryStats.find(c=>c.country===selectedCountry.country):null,[selectedCountry,countryStats]);
  const clusterCollection=useMemo(()=>({type:"FeatureCollection",features:clusters}),[clusters]);

  // GeoJSON style for forest clusters map layer — coloured by health status
  const forestClusterStyle=useCallback((feat)=>{
    const hcfg=healthCfg(feat.properties?.health_status||"Unknown");
    const isSelected=selectedCluster?.properties?.cluster_id===feat.properties?.cluster_id;
    return{color:hcfg.color,fillColor:hcfg.color,fillOpacity:isSelected?0.35:0.15,weight:isSelected?2.5:1.5,dashArray:isSelected?null:"4 4"};
  },[selectedCluster]);

  const onEachForestCluster=useCallback((feat,layer)=>{
    const p=feat.properties;const hcfg=healthCfg(p.health_status);
    layer.bindTooltip(
      `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.8;color:#f0fdf0"><b style="color:${hcfg.color}">${hcfg.icon} ${p.health_status}</b><br/>#${p.hotspot_rank} · ${p.country||"—"}<br/>Loss: ${fmt(p.total_loss_area_km2,0)} km² · Fires/yr: ${fmtNum(p.fire_12m||0)}</div>`,
      {className:"acris-tt",sticky:true}
    );
    layer.on("click",()=>handleSelectCluster(feat));
  },[handleSelectCluster]);

  const onEachLegacyCluster=useCallback((feat,layer)=>{
    layer.bindTooltip(
      `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6;color:#f0fdf0"><b style="color:#ef4444">Hotspot #${feat.properties?.hotspot_rank}</b><br/>${feat.properties?.country||"—"}<br/>Loss: ${fmt(feat.properties?.total_loss_area_km2,0)} km²<br/>Year: ${feat.properties?.dominant_year||"—"}</div>`,
      {className:"acris-tt",sticky:true}
    );
  },[]);

  const forestClusterGeoJSON=useMemo(()=>({type:"FeatureCollection",features:forestClusters}),[forestClusters]);

  const tabs=[
    {id:"risk",    label:"Risk"},
    {id:"ndvi",    label:"NDVI"},
    {id:"forest",  label:"Forest"},
    {id:"clusters",label:"🌿 Clusters"},  // NEW
    {id:"draw",    label:"Analyse"},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",width:"100vw",background:T.bg,fontFamily:"'Syne',sans-serif",color:T.white,overflow:"hidden"}}>

      {/* Top bar */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:52,background:T.bgPanel,borderBottom:`1px solid ${T.border}`,flexShrink:0,zIndex:1000}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,height:28,borderRadius:6,background:`linear-gradient(135deg,${T.green},${T.greenDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:T.bg}}>A</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:1,color:T.green}}>ACRIS</div>
            <div style={{fontSize:9,color:T.textSub,letterSpacing:2,marginTop:-2,fontFamily:"'JetBrains Mono',monospace"}}>MODULE 2 · DESERTIFICATION &amp; FOREST INTELLIGENCE</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:T.green,animation:"pulse 2s infinite"}}/>LIVE
          </div>
          <div style={{display:"flex",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,overflow:"hidden"}}>
            {[{id:"risk",label:"Risk"},{id:"ndvi",label:"NDVI"}].map(o=>(
              <button key={o.id} onClick={()=>setMapLayer(o.id)} style={{padding:"4px 12px",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Syne',sans-serif",background:mapLayer===o.id?T.green:"transparent",color:mapLayer===o.id?T.bg:T.textSub,transition:"background 0.2s"}}>{o.label}</button>
            ))}
          </div>
          <button onClick={()=>navigate("/")} style={{padding:"4px 12px",borderRadius:6,background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>← Home</button>
          <button onClick={()=>{logout();navigate("/login");}} style={{padding:"4px 12px",borderRadius:6,background:"transparent",border:`1px solid ${T.border}`,color:T.textSub,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Sign Out</button>
        </div>
      </header>

      {/* Main body */}
      <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative"}}>

        {/* Left panel */}
        <aside style={{width:320,flexShrink:0,background:T.bgPanel,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden",zIndex:10}}>
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0,overflowX:"auto"}}>
            {tabs.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{flex:"0 0 auto",padding:"10px 10px",background:"none",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:0.5,fontFamily:"'Syne',sans-serif",color:activeTab===tab.id?T.green:T.textSub,borderBottom:activeTab===tab.id?`2px solid ${T.green}`:"2px solid transparent",transition:"color 0.2s",whiteSpace:"nowrap"}}>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:12}}>
            {loadingPanel&&activeTab!=="clusters"?<Spinner/>:(
              <>
                {activeTab==="risk"     &&<RiskPanel     data={countryStats} onSelect={selectCountry} selected={selectedCountry}/>}
                {activeTab==="ndvi"     &&<NdviPanel     data={countryStats} onSelect={selectCountry} selected={selectedCountry}/>}
                {activeTab==="forest"   &&<ForestPanel   data={countryStats} clusters={clusters}      onSelect={selectCountry} selected={selectedCountry}/>}
                {activeTab==="clusters" &&<ForestClustersPanel forestClusters={forestClusters} loadingClusters={loadingClusters} selectedCluster={selectedCluster} onSelectCluster={handleSelectCluster} healthSummary={healthSummary}/>}
                {activeTab==="draw"     &&<DrawPanel     onShapefileUpload={handleShapefileUpload} shapefileError={shapefileError} shapefileLoading={shapefileLoading} shapefileGeoJSON={shapefileGeoJSON} onClearShapefile={clearShapefile}/>}
              </>
            )}
          </div>
          {selectedStats&&<CountryCard stats={selectedStats} onClose={clearCountry}/>}
        </aside>

        {/* Map */}
        <div style={{flex:1,position:"relative"}}>
          {loadingMap&&(
            <div style={{position:"absolute",top:12,right:12,zIndex:999,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 12px",fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace",display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:10,height:10,borderRadius:"50%",border:`1.5px solid ${T.border}`,borderTopColor:T.green,animation:"spin 0.8s linear infinite"}}/>
              Loading map data…
            </div>
          )}

          <MapContainer center={[5,20]} zoom={4} style={{height:"100%",width:"100%"}} preferCanvas zoomControl>
            <FlyToCountry target={flyTarget}/>
            <CanvasGridLayer cells={gridCells} mapLayer={mapLayer}/>

            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Dark">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© OpenStreetMap © CARTO" maxZoom={19}/>
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="© Esri" maxZoom={19}/>
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Street">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" maxZoom={19}/>
              </LayersControl.BaseLayer>

              {/* NEW: Forest Cluster Health layer */}
              {forestClusters.length>0&&(
                <LayersControl.Overlay checked name="Forest Cluster Health">
                  <GeoJSON key={`fc-${forestClusters.length}-${selectedCluster?.properties?.cluster_id}`} data={forestClusterGeoJSON} style={forestClusterStyle} onEachFeature={onEachForestCluster}/>
                </LayersControl.Overlay>
              )}

              {/* Legacy forest loss hotspots */}
              {clusters.length>0&&(
                <LayersControl.Overlay name="Forest Loss Hotspots (Legacy)">
                  <GeoJSON key={clusters.length} data={clusterCollection} style={{color:T.red,fillColor:T.red,fillOpacity:0.18,weight:1.5}} onEachFeature={onEachLegacyCluster}/>
                </LayersControl.Overlay>
              )}
            </LayersControl>

            {/* Draw tools */}
            <FeatureGroup ref={(ref)=>{if(ref)featureGroupRef.current=ref;}}>
              <EditControl position="topleft" onCreated={onPolygonCreated} draw={{rectangle:true,polygon:true,circle:false,circlemarker:false,marker:false,polyline:false}} edit={{edit:false,remove:true}}/>
            </FeatureGroup>

            {/* Shapefile overlay */}
            {shapefilePositions.map((positions,i)=>(
              <Polygon key={i} positions={positions} pathOptions={{color:T.blue,fillColor:T.blue,fillOpacity:0.12,weight:2,dashArray:"6 4"}}/>
            ))}
          </MapContainer>

          {/* Map legend */}
          <div style={{position:"absolute",bottom:24,left:12,zIndex:999,background:`${T.bgCard}ee`,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",backdropFilter:"blur(8px)"}}>
            <div style={{fontSize:10,color:T.textSub,letterSpacing:1,marginBottom:8,fontWeight:600}}>{mapLayer==="ndvi"?"NDVI":"RISK SCORE"}</div>
            {(mapLayer==="ndvi"
              ?[{color:T.green,label:"Healthy (>0.5)"},{color:T.yellow,label:"Moderate (0.3–0.5)"},{color:T.red,label:"Degraded (<0.3)"}]
              :[{color:T.green,label:"Low"},{color:T.greenDim,label:"Moderate"},{color:T.yellow,label:"Elevated"},{color:T.orange,label:"High"},{color:T.red,label:"Critical"}]
            ).map(item=>(
              <div key={item.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:item.color,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>{item.label}</span>
              </div>
            ))}

            {/* Health legend */}
            <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,color:T.textSub,letterSpacing:1,marginBottom:6,fontWeight:600}}>CLUSTER HEALTH</div>
              {Object.entries(HEALTH_CONFIG).filter(([k])=>k!=="Unknown").map(([k,v])=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:10}}>{v.icon}</span>
                  <span style={{fontSize:11,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area analysis drawer */}
        {(drawerLoading||drawer)&&(
          <>
            <div style={{position:"fixed",inset:0,zIndex:1999,background:"rgba(0,0,0,0.4)"}} onClick={()=>{setDrawer(null);setDrawerLoading(false);}}/>
            <AreaDrawer loading={drawerLoading} data={drawer} drawerRef={drawerRef} drawerWrapRef={drawerWrapRef} onClose={()=>{setDrawer(null);setDrawerLoading(false);}} onDownloadPdf={downloadPdf} onDownloadCsv={downloadCsv} pdfLoading={pdfLoading}/>
          </>
        )}

        {/* Cluster detail drawer */}
        {selectedCluster&&(
          <>
            <div style={{position:"fixed",inset:0,zIndex:1999,background:"rgba(0,0,0,0.4)"}} onClick={()=>setSelectedCluster(null)}/>
            <ClusterDrawer cluster={selectedCluster} onClose={()=>setSelectedCluster(null)}/>
          </>
        )}
      </div>
    </div>
  );
}
