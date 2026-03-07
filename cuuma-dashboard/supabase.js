import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

import { supabase } from "./supabase.js";

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SEED = {
  pnl: [
    ...["act","est","bud"].flatMap(sc => [
      { scenario: sc, line_item: "revenue", month_index: 0, value: sc==="act"?282349.83:sc==="est"?282349.83:264308 },
      ...Array.from({length:11},(_,i)=>({ scenario: sc, line_item:"revenue", month_index:i+1,
        value: sc==="act"?null:sc==="est"?[277137.14,284352.70,281716.16,287988.70,293218.39,286673.67,301955.28,315478.32,323014.20,330559.69,337714.87][i]:[270224.90,275352.70,281716.16,287988.70,293218.39,286673.67,301955.28,315478.32,323014.20,330559.69,337714.87][i] })),
      { scenario:sc, line_item:"materials", month_index:0, value:sc==="act"?-91823.62:sc==="est"?-91823.62:-83622.50 },
      ...Array.from({length:11},(_,i)=>({ scenario:sc, line_item:"materials", month_index:i+1,
        value:sc==="act"?null:[-84104.93,-84766.48,-85472.30,-86184.11,-86901.97,-87625.92,-88356.05,-89092.38,-89823.75,-90561.45,-91305.55][i] })),
      { scenario:sc, line_item:"personnel", month_index:0, value:sc==="act"?-145413.96:sc==="est"?-165419.61:-151194.04 },
      ...Array.from({length:11},(_,i)=>({ scenario:sc, line_item:"personnel", month_index:i+1,
        value:sc==="act"?null:sc==="est"?[-154600.45,-139484.11,-157823.15,-157635.55,-162010.65,-88217.10,-173301.17,-166493.97,-172028.17,-171451.97,-172229.17][i]:[-153500.00,-153867.78,-160474.88,-147985.79,-152199.10,-108671.67,-164032.00,-159384.23,-164713.79,-164158.89,-164907.35][i] })),
      { scenario:sc, line_item:"depreciation", month_index:0, value:sc==="act"?-3415.31:-3654.18 },
      ...Array.from({length:11},(_,i)=>({ scenario:sc, line_item:"depreciation", month_index:i+1, value:sc==="act"?null:-3654.18 })),
    ])
  ],
  opex: [
    ...["act","est","bud"].flatMap(sc => {
      const rows = {
        voluntary_hr: { act:[-1426.95,...Array(11).fill(null)], est:[-1426.95,-3957,-3147,-3147,-7088,-5058,-2758,-3147,-3147,-3147,-7547,-3147], bud:[-5506,-3957,-3147,-3147,-7088,-5058,-2758,-3147,-3147,-3147,-7547,-3147] },
        premises:     { act:[-9983.03,...Array(11).fill(null)], est:[-8588.06,-8588.06,-8588.06,-8588.06,-6369.06,-6369.06,-6369.06,-6369.06,-6369.06,-6369.06,-6369.06,-6369.06], bud:[-8588.06,-8588.06,-8588.06,-8588.06,-8588.06,-8588.06,-8588.06,-8588.06,-6588.06,-6588.06,-6588.06,-6588.06] },
        it:           { act:[-11499.11,...Array(11).fill(null)], est:[-10283,-10050.33,-10050.33,-12050.33,-9486.33,-9486.33,-9486.33,-9477.33,-9477.33,-9477.33,-9477.33,-9477.33], bud:[-10283,-10050.33,-10050.33,-12050.33,-9486.33,-9486.33,-9486.33,-9477.33,-9477.33,-9477.33,-9477.33,-9477.33] },
        equipment:    { act:[-459.98,...Array(11).fill(null)], est:Array(12).fill(0), bud:Array(12).fill(0) },
        travel:       { act:[-950.14,...Array(11).fill(null)], est:[-1645,-1645,-1445,-1645,-1645,-1645,-650,-1445,-1645,-1645,-1645,-1175], bud:[-1645,-1645,-1445,-1645,-1645,-1645,-650,-1445,-1645,-1645,-1645,-1175] },
        entertainment:{ act:[-36,...Array(11).fill(null)], est:[-250,-250,-250,-250,-250,-250,0,-250,-250,-250,-250,-250], bud:[-250,-250,-250,-250,-250,-250,0,-250,-250,-250,-250,-250] },
        sales:        { act:[-1479.59,...Array(11).fill(null)], est:Array(12).fill(0), bud:Array(12).fill(0) },
        marketing:    { act:[-3218.76,...Array(11).fill(null)], est:[-3730,-6480,-7880,-8290,-7940,-1690,-1670,-5690,-22690,-15790,-10190,-5670], bud:[-3730,-6480,-7880,-8290,-7940,-1690,-1670,-5690,-22690,-15790,-10190,-5670] },
        rnd:          { act:[-1538,...Array(11).fill(null)], est:[-1583,-1583,-1583,0,0,0,0,0,0,0,0,0], bud:[-1583,-1583,-1583,0,0,0,0,0,0,0,0,0] },
        admin:        { act:[-13642.67,...Array(11).fill(null)], est:[-18959,-20959,-23259,-21959,-23059,-20559,-20559,-20559,-21559,-19559,-20559,-20559], bud:[-18959,-20959,-23259,-21959,-23059,-20559,-20559,-20559,-21559,-19559,-20559,-20559] },
        other_admin:  { act:[-1941.67,...Array(11).fill(null)], est:[-2041.67,-2011.67,-2011.67,-2011.67,-1946.67,-1946.67,-1946.67,-1976.67,-1976.67,-1976.67,-1976.67,-1976.67], bud:[-2041.67,-2011.67,-2011.67,-2011.67,-1946.67,-1946.67,-1946.67,-1976.67,-1976.67,-1976.67,-1976.67,-1976.67] },
        other:        { act:[-722,...Array(11).fill(null)], est:Array(12).fill(0), bud:Array(12).fill(0) },
      };
      return Object.entries(rows).flatMap(([key, vals]) =>
        Array.from({length:12},(_,i)=>({ scenario:sc, opex_key:key, month_index:i, value:vals[sc][i] }))
      );
    })
  ],
  payroll: [
    {employee_name:"Pyry",department:"CC10 Tekniikka",months:[4919,0,0,0,0,0,0,0,0,0,0,0]},
    {employee_name:"Anton",department:"CC10 Tekniikka",months:[6120,6120,6120,6120,6120,6120,6254.64,6254.64,6254.64,6254.64,6254.64,6254.64]},
    {employee_name:"Tero",department:"CC10 Tekniikka",months:[6808.99,6808.99,6808.99,6808.99,6808.99,6808.99,6958.79,6958.79,6958.79,6958.79,6958.79,6958.79]},
    {employee_name:"Mika",department:"CC10 Tekniikka",months:[5121.91,5121.91,5121.91,5121.91,5121.91,5121.91,5234.59,5234.59,5234.59,5234.59,5234.59,5234.59]},
    {employee_name:"Sami P",department:"CC10 Tekniikka",months:[4604.95,4604.95,4604.95,4604.95,4604.95,4604.95,4706.26,4706.26,4706.26,4706.26,4706.26,4706.26]},
    {employee_name:"Janne",department:"CC10 Tekniikka",months:[3553.49,3553.49,3553.49,3553.49,3553.49,3553.49,3631.67,3631.67,3631.67,3631.67,3631.67,3631.67]},
    {employee_name:"Dev Rekry",department:"CC10 Tekniikka",months:[0,0,0,0,0,0,0,5500,5500,5500,5500,5500]},
    {employee_name:"Replacement Rekry",department:"CC10 Tekniikka",months:[4100,0,0,0,0,0,0,0,0,5000,5000,5000]},
    {employee_name:"VesaO",department:"CC20 Tuotanto",months:[3500,3500,3500,3500,3500,3500,3577,3577,3577,3577,3577,3577]},
    {employee_name:"Johanna",department:"CC20 Tuotanto",months:[4005.54,4005.54,4005.54,4005.54,4005.54,4005.54,4093.66,4093.66,4093.66,4093.66,4093.66,4093.66]},
    {employee_name:"TeemuH",department:"CC20 Tuotanto",months:[4645.08,4645.08,4645.08,4645.08,4645.08,4645.08,4747.27,4747.27,4747.27,4747.27,4747.27,4747.27]},
    {employee_name:"SamiH",department:"CC20 Tuotanto",months:[3300,3300,3300,3300,3300,3300,3372.6,3372.6,3372.6,3372.6,3372.6,3372.6]},
    {employee_name:"Tommy (90%)",department:"CC20 Tuotanto",months:[6750,6750,6750,6750,6750,6750,6750,6750,6750,6750,6750,6750]},
    {employee_name:"JaniO",department:"CC20 Tuotanto",months:[3829.15,3829.15,3829.15,3829.15,3829.15,3829.15,3913.39,3913.39,3913.39,3913.39,3913.39,3913.39]},
    {employee_name:"Westerholm",department:"CC30 Myynti",months:[4009.91,4009.91,4009.91,4009.91,4009.91,4009.91,4098.13,4098.13,4098.13,4098.13,4098.13,4098.13]},
    {employee_name:"Skaffari",department:"CC30 Myynti",months:[2957.69,2957.69,2957.69,2957.69,2957.69,2957.69,3022.76,3022.76,3022.76,3022.76,3022.76,3022.76]},
    {employee_name:"Ruskovaara",department:"CC30 Myynti",months:[4000,4000,4000,4000,4000,4000,4088,4088,4088,4088,4088,4088]},
    {employee_name:"Matis",department:"CC30 Myynti",months:[1700,1700,1700,1700,1700,1700,1737.4,1737.4,1737.4,1737.4,1737.4,1737.4]},
    {employee_name:"Väinö (50%)",department:"CC31 Kumppanit",months:[4616.5,4616.5,4616.5,4616.5,4616.5,4616.5,4616.5,4616.5,4616.5,4616.5,4616.5,4616.5]},
    {employee_name:"Petri (85%)",department:"CC31 Kumppanit",months:[4250,4250,4250,4250,4250,4250,4343.5,4343.5,4343.5,4343.5,4343.5,4343.5]},
    {employee_name:"Petri Konu (15%)",department:"CC32 Uudet",months:[750,750,750,750,750,750,766.5,766.5,766.5,766.5,766.5,766.5]},
    {employee_name:"Sami Roullamo",department:"CC32 Uudet",months:[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]},
    {employee_name:"Maksim",department:"CC40 Tuki",months:[6120,6120,6120,6120,6120,6120,6254.64,6254.64,6254.64,6254.64,6254.64,6254.64]},
    {employee_name:"JaniH",department:"CC40 Tuki",months:[8200,8200,8200,8200,8200,8200,8200,8200,8200,8200,8200,8200]},
    {employee_name:"Vadim",department:"CC50 Hallinto",months:[8500,8500,8500,8500,8500,8500,8500,8500,8500,8500,8500,8500]},
    {employee_name:"Rekha",department:"CC50 Hallinto",months:[0,0,0,0,0,0,0,3631.67,3631.67,3631.67,3631.67,3631.67]},
    {employee_name:"TommyH (10%)",department:"CC50 Hallinto",months:[750,750,750,750,750,750,750,750,750,750,750,750]},
  ],
  audit: [
    { area:"Payroll", period:"Jan–Jun", cost:-12500, comment:"Layoffs delayed to 1.7.2026" },
    { area:"Office Rent", period:"May–Dec", cost:2219, comment:"Lower rents from May" },
    { area:"Revenue", period:"Mar", cost:6000, comment:"Lennu additional March" },
  ]
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (v === null || v === undefined) return "—";
  const abs = Math.abs(v);
  if (abs >= 1000000) return (v<0?"-":"")+"€"+(abs/1000000).toFixed(2)+"M";
  if (abs >= 1000) return (v<0?"-":"")+"€"+(abs/1000).toFixed(1)+"K";
  return (v<0?"-":"")+"€"+abs.toFixed(0);
};
const fmtPct = v => v===null?"—":(v*100).toFixed(1)+"%";
const sumNonNull = arr => arr.reduce((s,v)=>s+(v??0),0);

const C = {
  bg:"#0f1117", surface:"#1a1f2e", surfaceHigh:"#242938", border:"#2e3347",
  accent:"#3b82f6", accentGlow:"#60a5fa", green:"#22c55e", red:"#ef4444",
  amber:"#f59e0b", text:"#e2e8f0", muted:"#64748b",
  act:"#60a5fa", est:"#34d399", bud:"#f59e0b",
};

// ─── BUILD LOCAL STATE FROM DB ROWS ──────────────────────────────────────────
function buildState(pnlRows, opexRows, payrollRows, auditRows) {
  const mkMonths = (rows, sc, key) => {
    const arr = Array(12).fill(null);
    rows.filter(r=>r.scenario===sc&&r.line_item===key).forEach(r=>{ arr[r.month_index]=r.value; });
    return arr;
  };
  const mkOpex = (rows, sc, key) => {
    const arr = Array(12).fill(null);
    rows.filter(r=>r.scenario===sc&&r.opex_key===key).forEach(r=>{ arr[r.month_index]=r.value; });
    return arr;
  };
  const opexKeys = ["voluntary_hr","premises","it","equipment","travel","entertainment","sales","marketing","rnd","admin","other_admin","other"];
  const mkScenario = (sc) => ({
    revenue: mkMonths(pnlRows,sc,"revenue"),
    materials: mkMonths(pnlRows,sc,"materials"),
    personnel: mkMonths(pnlRows,sc,"personnel"),
    depreciation: mkMonths(pnlRows,sc,"depreciation"),
    opex: Object.fromEntries(opexKeys.map(k=>[k, mkOpex(opexRows,sc,k)]))
  });

  const employees = [];
  const empMap = {};
  payrollRows.forEach(r=>{
    if(!empMap[r.employee_name]){
      empMap[r.employee_name]={ employee_name:r.employee_name, department:r.department, months:Array(12).fill(0) };
      employees.push(empMap[r.employee_name]);
    }
    empMap[r.employee_name].months[r.month_index]=r.gross_salary;
  });

  return {
    act: mkScenario("act"),
    est: mkScenario("est"),
    bud: mkScenario("bud"),
    payroll: employees,
    audit: auditRows,
  };
}

function calcEBIT(scenario) {
  return Array.from({length:12},(_,i)=>{
    const opexSum = Object.values(scenario.opex).reduce((s,arr)=>s+(arr[i]??0),0);
    return (scenario.revenue[i]??0)+(scenario.materials[i]??0)+(scenario.personnel[i]??0)+(scenario.depreciation[i]??0)+opexSum;
  });
}

// ─── MINI UI ──────────────────────────────────────────────────────────────────
function KPICard({label,value,sub,color}){
  const col=color==="green"?C.green:color==="red"?C.red:color==="amber"?C.amber:C.accentGlow;
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:col,borderRadius:"12px 12px 0 0"}}/>
      <div style={{color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{label}</div>
      <div style={{color:col,fontSize:26,fontWeight:700,letterSpacing:-1}}>{value}</div>
      {sub&&<div style={{color:C.muted,fontSize:12,marginTop:4}}>{sub}</div>}
    </div>
  );
}

function SectionHeader({title,icon}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,marginTop:8}}>
      <span style={{fontSize:20}}>{icon}</span>
      <h2 style={{margin:0,fontSize:16,fontWeight:700,color:C.text,letterSpacing:0.3}}>{title}</h2>
      <div style={{flex:1,height:1,background:C.border,marginLeft:12}}/>
    </div>
  );
}

const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:"#1e2535",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
      <div style={{color:C.muted,marginBottom:6,fontWeight:600}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color,marginBottom:2}}>{p.name}: {fmt(p.value)}</div>)}
    </div>
  );
};

function EditCell({value,onSave}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState("");
  const col=value===null?C.muted:value<0?"#fca5a5":C.text;
  if(editing)return(
    <input autoFocus value={draft}
      onChange={e=>setDraft(e.target.value)}
      onBlur={()=>{onSave(draft===""?null:parseFloat(draft));setEditing(false);}}
      onKeyDown={e=>{if(e.key==="Enter"){onSave(draft===""?null:parseFloat(draft));setEditing(false);}if(e.key==="Escape")setEditing(false);}}
      style={{width:76,background:"#1e2535",border:`1px solid ${C.accent}`,borderRadius:4,color:C.text,padding:"2px 6px",fontSize:12,textAlign:"right",fontFamily:"inherit"}}
    />
  );
  return(
    <span onClick={()=>{setDraft(value===null?"":String(value));setEditing(true);}}
      style={{cursor:"pointer",padding:"2px 6px",borderRadius:4,color:col}} title="Click to edit">
      {value===null?<span style={{color:C.muted}}>—</span>:fmt(value)}
    </span>
  );
}

// ─── PASSWORD GATE ────────────────────────────────────────────────────────────
const CORRECT_PASSWORD = "havefun1@";
const SESSION_KEY = "cuuma_auth";

function LoginScreen({ onSuccess }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (pw === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setPw("");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono','Fira Code',monospace"}}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"48px 40px",width:360,textAlign:"center",animation:shake?"shake 0.4s ease":"none"}}>
        <div style={{width:48,height:48,background:C.accent,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:"#fff",margin:"0 auto 20px"}}>C</div>
        <div style={{fontWeight:700,fontSize:17,color:C.text,marginBottom:4}}>CUUMA OY</div>
        <div style={{color:C.muted,fontSize:12,marginBottom:32}}>Board Financial Dashboard — FY2026</div>
        <input
          type="password"
          placeholder="Enter password"
          value={pw}
          onChange={e=>{setPw(e.target.value);setError(false);}}
          onKeyDown={e=>e.key==="Enter"&&attempt()}
          autoFocus
          style={{width:"100%",background:C.surfaceHigh,border:`1px solid ${error?C.red:C.border}`,borderRadius:8,padding:"12px 16px",color:C.text,fontSize:14,fontFamily:"inherit",outline:"none",marginBottom:12,textAlign:"center",letterSpacing:2}}
        />
        {error && <div style={{color:C.red,fontSize:12,marginBottom:12}}>Incorrect password</div>}
        <button
          onClick={attempt}
          style={{width:"100%",background:C.accent,border:"none",borderRadius:8,padding:"12px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          Sign In
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [authed, setAuthed] = useState(!!sessionStorage.getItem(SESSION_KEY));
  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState("overview");
  const [editMode,setEditMode]=useState(false);
  const [selectedDept,setSelectedDept]=useState("All");
  const [toast,setToast]=useState(null);

  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),2500);};

  // ── SEED if empty ──
  const seedIfEmpty = useCallback(async()=>{
    const {data:existing}=await supabase.from("pnl_data").select("id").limit(1);
    if(existing&&existing.length>0)return;
    showToast("Seeding database for first time…","info");
    // pnl
    await supabase.from("pnl_data").upsert(SEED.pnl,{onConflict:"scenario,line_item,month_index"});
    // opex
    await supabase.from("opex_data").upsert(SEED.opex,{onConflict:"scenario,opex_key,month_index"});
    // payroll
    const payrollRows=SEED.payroll.flatMap(e=>e.months.map((v,mi)=>({employee_name:e.employee_name,department:e.department,month_index:mi,gross_salary:v})));
    await supabase.from("payroll_data").upsert(payrollRows,{onConflict:"employee_name,month_index"});
    // audit
    await supabase.from("audit_trail").insert(SEED.audit);
    showToast("Database seeded ✓");
  },[]);

  // ── LOAD ──
  const loadData=useCallback(async()=>{
    setLoading(true);
    const [pnl,opex,payroll,audit]=await Promise.all([
      supabase.from("pnl_data").select("*"),
      supabase.from("opex_data").select("*"),
      supabase.from("payroll_data").select("*"),
      supabase.from("audit_trail").select("*").order("created_at"),
    ]);
    setData(buildState(pnl.data||[],opex.data||[],payroll.data||[],audit.data||[]));
    setLoading(false);
  },[]);

  useEffect(()=>{ seedIfEmpty().then(loadData); },[]);

  // ── REALTIME ──
  useEffect(()=>{
    const ch=supabase.channel("realtime-all")
      .on("postgres_changes",{event:"*",schema:"public"},()=>loadData())
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[loadData]);

  // ── SAVE HELPERS ──
  const savePnl=async(scenario,line_item,month_index,value)=>{
    setSaving(true);
    const{error}=await supabase.from("pnl_data").upsert({scenario,line_item,month_index,value,updated_at:new Date().toISOString()},{onConflict:"scenario,line_item,month_index"});
    setSaving(false);
    if(error)showToast("Save failed: "+error.message,"err");
    else showToast("Saved ✓");
  };
  const saveOpex=async(scenario,opex_key,month_index,value)=>{
    setSaving(true);
    const{error}=await supabase.from("opex_data").upsert({scenario,opex_key,month_index,value,updated_at:new Date().toISOString()},{onConflict:"scenario,opex_key,month_index"});
    setSaving(false);
    if(error)showToast("Save failed: "+error.message,"err");
    else showToast("Saved ✓");
  };
  const savePayroll=async(employee_name,department,month_index,gross_salary)=>{
    setSaving(true);
    const{error}=await supabase.from("payroll_data").upsert({employee_name,department,month_index,gross_salary,updated_at:new Date().toISOString()},{onConflict:"employee_name,month_index"});
    setSaving(false);
    if(error)showToast("Save failed: "+error.message,"err");
    else showToast("Saved ✓");
  };
  const addAudit=async(row)=>{
    const{error}=await supabase.from("audit_trail").insert(row);
    if(error)showToast("Save failed","err"); else showToast("Added ✓");
  };
  const deleteAudit=async(id)=>{
    const{error}=await supabase.from("audit_trail").delete().eq("id",id);
    if(error)showToast("Delete failed","err"); else showToast("Deleted ✓");
  };

  // ── DERIVED ──
  const ebitAct=useMemo(()=>data?calcEBIT(data.act):Array(12).fill(0),[data]);
  const ebitEst=useMemo(()=>data?calcEBIT(data.est):Array(12).fill(0),[data]);
  const ebitBud=useMemo(()=>data?calcEBIT(data.bud):Array(12).fill(0),[data]);

  if(loading)return(
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"monospace",flexDirection:"column",gap:16}}>
      <div style={{width:40,height:40,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div>Loading from Supabase…</div>
    </div>
  );

  const {act,est,bud,payroll,audit}=data;
  const ytdRevEst=sumNonNull(est.revenue);
  const ytdRevBud=sumNonNull(bud.revenue);
  const ytdRevAct=sumNonNull(act.revenue.filter(v=>v!==null));
  const ytdEbitEst=sumNonNull(ebitEst);
  const ytdEbitBud=sumNonNull(ebitBud);
  const gmEst=(ytdRevEst+sumNonNull(est.materials))/ytdRevEst;

  const chartData=MONTHS.map((m,i)=>({
    month:m,actRev:act.revenue[i],estRev:est.revenue[i],budRev:bud.revenue[i],
    actEBIT:ebitAct[i],estEBIT:ebitEst[i],budEBIT:ebitBud[i],
  }));

  const depts=["All",...Array.from(new Set(payroll.map(e=>e.department)))];
  const filtPayroll=selectedDept==="All"?payroll:payroll.filter(e=>e.department===selectedDept);
  const payrollByMonth=MONTHS.map((m,i)=>({month:m,gross:filtPayroll.reduce((s,e)=>s+(e.months[i]||0),0)}));

  const tabs=[
    {key:"overview",label:"Overview",icon:"📊"},
    {key:"pnl",label:"P&L",icon:"📋"},
    {key:"payroll",label:"Payroll",icon:"👥"},
    {key:"deadlines",label:"Deadlines",icon:"📅"},
    {key:"audit",label:"Audit Trail",icon:"🔍"},
  ];

  const DEADLINES=[
    {period:"JAN",board:"17 Feb",deadline:"16 Feb",ap_closed:"11 Feb",receipts:"11 Feb",accruals:"11 Feb",billing:"6 Feb"},
    {period:"FEB",board:"17 Mar",deadline:"16 Mar",ap_closed:"11 Mar",receipts:"11 Mar",accruals:"11 Mar",billing:"6 Mar"},
    {period:"MAR",board:"16 Apr",deadline:"15 Apr",ap_closed:"10 Apr",receipts:"10 Apr",accruals:"10 Apr",billing:"5 Apr"},
    {period:"APR",board:"16 May",deadline:"15 May",ap_closed:"10 May",receipts:"10 May",accruals:"10 May",billing:"5 May"},
    {period:"MAY",board:"16 Jun",deadline:"15 Jun",ap_closed:"10 Jun",receipts:"10 Jun",accruals:"10 Jun",billing:"5 Jun"},
    {period:"JUN",board:"8 Aug",deadline:"7 Aug",ap_closed:"2 Aug",receipts:"2 Aug",accruals:"2 Aug",billing:"28 Jul"},
    {period:"JUL",board:"18 Aug",deadline:"17 Aug",ap_closed:"12 Aug",receipts:"12 Aug",accruals:"12 Aug",billing:"7 Aug"},
    {period:"AUG",board:"16 Sep",deadline:"15 Sep",ap_closed:"10 Sep",receipts:"10 Sep",accruals:"10 Sep",billing:"5 Sep"},
    {period:"SEPT",board:"16 Oct",deadline:"15 Oct",ap_closed:"10 Oct",receipts:"10 Oct",accruals:"10 Oct",billing:"5 Oct"},
    {period:"OCT",board:"17 Nov",deadline:"16 Nov",ap_closed:"11 Nov",receipts:"11 Nov",accruals:"11 Nov",billing:"6 Nov"},
    {period:"NOV",board:"16 Dec",deadline:"15 Dec",ap_closed:"10 Dec",receipts:"10 Dec",accruals:"10 Dec",billing:"5 Dec"},
    {period:"DEC",board:"16 Jan 2027",deadline:"15 Jan 2027",ap_closed:"10 Jan 2027",receipts:"10 Jan 2027",accruals:"10 Jan 2027",billing:"5 Jan 2027"},
  ];

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'IBM Plex Mono','Fira Code',monospace"}}>
      {/* TOAST */}
      {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.type==="err"?C.red:toast.type==="info"?"#1d4ed8":C.green,color:"#fff",borderRadius:8,padding:"10px 18px",fontSize:13,fontFamily:"monospace",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>{toast.msg}</div>}

      {/* HEADER */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 32px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:32,height:32,background:C.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>C</div>
            <div>
              <div style={{fontWeight:700,fontSize:15,letterSpacing:0.5}}>CUUMA OY</div>
              <div style={{color:C.muted,fontSize:11}}>Board Financial Dashboard — FY2026</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {saving&&<div style={{color:C.muted,fontSize:11}}>Saving…</div>}
            <div style={{width:8,height:8,borderRadius:"50%",background:C.green}} title="Supabase connected"/>
            <button onClick={()=>setEditMode(e=>!e)}
              style={{background:editMode?C.accent:"transparent",border:`1px solid ${editMode?C.accent:C.border}`,borderRadius:6,padding:"5px 14px",color:editMode?"#fff":C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
              {editMode?"✓ Editing":"✏ Edit Mode"}
            </button>
          </div>
        </div>
        <div style={{display:"flex",gap:0}}>
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{background:"transparent",border:"none",borderBottom:tab===t.key?`2px solid ${C.accent}`:"2px solid transparent",padding:"10px 20px",color:tab===t.key?C.accentGlow:C.muted,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:tab===t.key?600:400}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"28px 32px",maxWidth:1400,margin:"0 auto"}}>

        {/* ── OVERVIEW ── */}
        {tab==="overview"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28}}>
              <KPICard label="EST Full-Year Revenue" value={fmt(ytdRevEst)} sub={`vs BUD: ${fmt(ytdRevEst-ytdRevBud)}`} color="blue"/>
              <KPICard label="EST Full-Year EBIT" value={fmt(ytdEbitEst)} sub={`vs BUD: ${fmt(ytdEbitEst-ytdEbitBud)}`} color={ytdEbitEst>0?"green":"red"}/>
              <KPICard label="EST Gross Margin" value={fmtPct(gmEst)} sub="Materials margin" color="amber"/>
              <KPICard label="YTD Actual (Jan)" value={fmt(ytdRevAct)} sub={`vs EST: ${fmt(ytdRevAct-(est.revenue[0]||0))}`} color="green"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
              <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:20}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:16}}>Monthly Revenue — ACT vs EST vs BUD</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{top:4,right:8,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="month" tick={{fontSize:11,fill:C.muted}}/>
                    <YAxis tickFormatter={v=>"€"+(v/1000).toFixed(0)+"K"} tick={{fontSize:10,fill:C.muted}}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <Line dataKey="actRev" name="ACT" stroke={C.act} strokeWidth={2.5} dot={{r:4}} connectNulls={false}/>
                    <Line dataKey="estRev" name="EST" stroke={C.est} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
                    <Line dataKey="budRev" name="BUD" stroke={C.bud} strokeWidth={1.5} strokeDasharray="2 3" dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:20}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:16}}>Monthly EBIT — EST vs BUD</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{top:4,right:8,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="month" tick={{fontSize:11,fill:C.muted}}/>
                    <YAxis tickFormatter={v=>"€"+(v/1000).toFixed(0)+"K"} tick={{fontSize:10,fill:C.muted}}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <ReferenceLine y={0} stroke={C.border} strokeWidth={1.5}/>
                    <Bar dataKey="estEBIT" name="EST EBIT" fill={C.est} opacity={0.8} radius={[2,2,0,0]}>
                      {chartData.map((e,i)=><Cell key={i} fill={e.estEBIT>=0?C.est:C.red}/>)}
                    </Bar>
                    <Bar dataKey="budEBIT" name="BUD EBIT" fill={C.bud} opacity={0.5} radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:20}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:16}}>Working Capital Drivers (Jan Actuals)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {label:"Trade Receivables",value:"€161,359",note:"DSO: 30 days"},
                  {label:"Inventory",value:"€9,748",note:"DIO: 30 days"},
                  {label:"Accounts Payable",value:"€268,668",note:"DPO: 30 days"},
                  {label:"Cash & Bank",value:"€110,903",note:"Jan closing"},
                  {label:"Accrued Income",value:"€189,553",note:"Prepayments"},
                  {label:"Total Assets",value:"€929,078",note:"Balance sheet"},
                ].map((item,i)=>(
                  <div key={i} style={{background:C.surfaceHigh,borderRadius:8,padding:"12px 16px"}}>
                    <div style={{color:C.muted,fontSize:11,marginBottom:4}}>{item.label}</div>
                    <div style={{fontSize:18,fontWeight:700,color:C.accentGlow}}>{item.value}</div>
                    <div style={{color:C.muted,fontSize:11}}>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── P&L ── */}
        {tab==="pnl"&&(
          <>
            <SectionHeader title="Monthly P&L — ACT vs EST vs BUD" icon="📋"/>
            {editMode&&<div style={{color:C.amber,fontSize:12,marginBottom:12,background:"#1a1500",border:"1px solid #3d3000",borderRadius:6,padding:"8px 14px"}}>✏ Edit mode — click any ACT or EST cell. Changes save instantly to Supabase.</div>}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:900}}>
                <thead>
                  <tr style={{background:C.surfaceHigh}}>
                    <th style={{padding:"10px 14px",textAlign:"left",color:C.muted,fontWeight:600,width:180,position:"sticky",left:0,background:C.surfaceHigh}}>Line Item</th>
                    <th style={{padding:"8px 6px",color:C.muted,fontWeight:500,fontSize:10}}>Type</th>
                    {MONTHS.map(m=><th key={m} style={{padding:"8px 6px",color:C.muted,fontWeight:500,textAlign:"right",fontSize:11}}>{m}</th>)}
                    <th style={{padding:"8px 10px",color:C.muted,fontWeight:600,textAlign:"right"}}>FY Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {label:"Revenue",key:"revenue"},
                    {label:"Materials & Services",key:"materials"},
                    {label:"Personnel",key:"personnel"},
                    {label:"Depreciation",key:"depreciation"},
                  ].map((row,ri)=>
                    [{sc:"act",color:C.act,src:act},{sc:"est",color:C.est,src:est},{sc:"bud",color:C.bud,src:bud}].map((t,ti)=>(
                      <tr key={`${ri}-${ti}`} style={{borderBottom:ti===2?`2px solid ${C.border}`:`1px solid ${C.border}20`,background:ti===0?C.surface:"transparent"}}>
                        {ti===0&&<td rowSpan={3} style={{padding:"8px 14px",fontWeight:600,color:C.text,position:"sticky",left:0,background:C.surface,verticalAlign:"middle"}}>{row.label}</td>}
                        <td style={{padding:"6px 6px",color:t.color,fontSize:10,fontWeight:700}}>{t.sc.toUpperCase()}</td>
                        {MONTHS.map((m,mi)=>{
                          const val=t.src[row.key]?.[mi];
                          const canEdit=editMode&&(t.sc==="act"||t.sc==="est");
                          return(
                            <td key={mi} style={{padding:"4px 6px",textAlign:"right"}}>
                              {canEdit
                                ?<EditCell value={val} onSave={v=>savePnl(t.sc,row.key,mi,v)}/>
                                :<span style={{color:val===null?C.muted:val<0?"#fca5a5":C.text}}>{val===null?"—":fmt(val)}</span>
                              }
                            </td>
                          );
                        })}
                        <td style={{padding:"4px 10px",textAlign:"right",fontWeight:600,color:C.accentGlow}}>{fmt(t.src[row.key]?.reduce((s,v)=>s+(v??0),0))}</td>
                      </tr>
                    ))
                  )}
                  {/* EBIT */}
                  {[{label:"EBIT",data:[ebitAct,ebitEst,ebitBud]}].map(()=>
                    ["ACT","EST","BUD"].map((t,ti)=>(
                      <tr key={`ebit-${ti}`} style={{background:ti===0?"#0f1a0f":"transparent",borderBottom:ti===2?`2px solid ${C.border}`:`1px solid ${C.border}20`}}>
                        {ti===0&&<td rowSpan={3} style={{padding:"8px 14px",fontWeight:700,color:C.green,position:"sticky",left:0,background:"#0f1a0f",verticalAlign:"middle",fontSize:13}}>EBIT</td>}
                        <td style={{padding:"6px 6px",color:[C.act,C.est,C.bud][ti],fontSize:10,fontWeight:700}}>{t}</td>
                        {[ebitAct,ebitEst,ebitBud][ti].map((v,mi)=>(
                          <td key={mi} style={{padding:"4px 6px",textAlign:"right",fontWeight:600,color:v===null?C.muted:v>=0?C.green:C.red}}>{v===null?"—":fmt(v)}</td>
                        ))}
                        <td style={{padding:"4px 10px",textAlign:"right",fontWeight:700,color:sumNonNull([ebitAct,ebitEst,ebitBud][ti])>=0?C.green:C.red}}>{fmt(sumNonNull([ebitAct,ebitEst,ebitBud][ti]))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── PAYROLL ── */}
        {tab==="payroll"&&(
          <>
            <SectionHeader title="Payroll Planning — FY2026" icon="👥"/>
            <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
              {depts.map(d=>(
                <button key={d} onClick={()=>setSelectedDept(d)}
                  style={{background:selectedDept===d?C.accent:C.surfaceHigh,border:`1px solid ${selectedDept===d?C.accent:C.border}`,borderRadius:20,padding:"5px 14px",color:selectedDept===d?"#fff":C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
                  {d}
                </button>
              ))}
              <div style={{marginLeft:"auto",color:C.muted,fontSize:12}}>FY cost: <span style={{color:C.amber,fontWeight:700}}>{fmt(filtPayroll.reduce((s,e)=>s+e.months.reduce((a,b)=>a+b,0),0))}</span></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
              <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:20}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:16}}>Monthly Gross Payroll</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={payrollByMonth} margin={{top:4,right:8,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="month" tick={{fontSize:11,fill:C.muted}}/>
                    <YAxis tickFormatter={v=>"€"+(v/1000).toFixed(0)+"K"} tick={{fontSize:10,fill:C.muted}}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="gross" name="Gross Pay" fill={C.accent} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:20}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>By Department</div>
                {Array.from(new Set(payroll.map(e=>e.department))).map(dept=>{
                  const cost=payroll.filter(e=>e.department===dept).reduce((s,e)=>s+e.months.reduce((a,b)=>a+b,0),0);
                  const count=payroll.filter(e=>e.department===dept).length;
                  return(
                    <div key={dept} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{color:C.text,fontSize:13}}>{dept}</div>
                      <div style={{display:"flex",gap:16}}>
                        <span style={{color:C.muted,fontSize:12}}>{count} ppl</span>
                        <span style={{color:C.accentGlow,fontSize:12,fontWeight:600}}>{fmt(cost)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:20,overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:C.surfaceHigh}}>
                    <th style={{padding:"8px 12px",textAlign:"left",color:C.muted}}>Employee</th>
                    <th style={{padding:"8px 8px",textAlign:"left",color:C.muted}}>Dept</th>
                    {MONTHS.map(m=><th key={m} style={{padding:"8px 6px",textAlign:"right",color:C.muted,fontSize:10}}>{m}</th>)}
                    <th style={{padding:"8px 10px",textAlign:"right",color:C.muted}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtPayroll.map((emp,ei)=>(
                    <tr key={ei} style={{borderBottom:`1px solid ${C.border}20`,background:ei%2===0?C.surface:"transparent"}}>
                      <td style={{padding:"6px 12px",color:C.text}}>{emp.employee_name}</td>
                      <td style={{padding:"6px 8px",color:C.muted,fontSize:11}}>{emp.department.replace(/CC\d+\s/,"")}</td>
                      {emp.months.map((v,mi)=>(
                        <td key={mi} style={{padding:"4px 6px",textAlign:"right"}}>
                          {editMode
                            ?<EditCell value={v===0?null:v} onSave={nv=>savePayroll(emp.employee_name,emp.department,mi,nv??0)}/>
                            :<span style={{color:v===0?C.muted:C.text}}>{v===0?"—":fmt(v)}</span>
                          }
                        </td>
                      ))}
                      <td style={{padding:"4px 10px",textAlign:"right",fontWeight:700,color:C.accentGlow}}>{fmt(emp.months.reduce((s,v)=>s+v,0))}</td>
                    </tr>
                  ))}
                  <tr style={{background:C.surfaceHigh,fontWeight:700}}>
                    <td colSpan={2} style={{padding:"8px 12px",color:C.text}}>TOTAL</td>
                    {MONTHS.map((m,mi)=>(
                      <td key={mi} style={{padding:"6px 6px",textAlign:"right",color:C.amber}}>{fmt(filtPayroll.reduce((s,e)=>s+e.months[mi],0))}</td>
                    ))}
                    <td style={{padding:"6px 10px",textAlign:"right",color:C.amber}}>{fmt(filtPayroll.reduce((s,e)=>s+e.months.reduce((a,b)=>a+b,0),0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── DEADLINES ── */}
        {tab==="deadlines"&&(
          <>
            <SectionHeader title="Accounting Calendar 2026" icon="📅"/>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:C.surfaceHigh}}>
                    {["Period","Board Report","Deadline 2pm","AP Closed","Receipts","Accruals","Billing Done"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEADLINES.map((row,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.surface:"transparent"}}>
                      <td style={{padding:"10px 14px",fontWeight:700,color:C.text}}>{row.period}</td>
                      {[row.board,row.deadline,row.ap_closed,row.receipts,row.accruals,row.billing].map((v,j)=>(
                        <td key={j} style={{padding:"10px 14px",color:C.muted}}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:28}}>
              <SectionHeader title="Audit Schedule 2026 (BDO)" icon="🏛"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {event:"Auditor Kick-off",date:"30 Nov 2026"},
                  {event:"Books Finalized",date:"15 Jan 2027"},
                  {event:"Preliminary to Board",date:"20 Jan 2027"},
                  {event:"Financial Statements Ready",date:"5 Mar 2027"},
                  {event:"Board Approval",date:"16 Mar 2027"},
                  {event:"AGM",date:"16 Apr 2027"},
                ].map((item,i)=>(
                  <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 16px"}}>
                    <div style={{color:C.muted,fontSize:11,marginBottom:6}}>{item.event}</div>
                    <div style={{color:C.accentGlow,fontWeight:700,fontSize:15}}>{item.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── AUDIT TRAIL ── */}
        {tab==="audit"&&(
          <>
            <SectionHeader title="Audit Trail — Manual Adjustments" icon="🔍"/>
            {audit.map((row)=>(
              <div key={row.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 20px",marginBottom:10,display:"flex",gap:24,alignItems:"center"}}>
                <div style={{minWidth:100,fontWeight:700,color:C.text}}>{row.area}</div>
                <div style={{minWidth:80,color:C.muted,fontSize:12}}>{row.period}</div>
                <div style={{minWidth:80,fontWeight:700,color:row.cost>=0?C.green:C.red}}>{row.cost>=0?"+":""}{fmt(row.cost)}</div>
                <div style={{color:C.muted,fontSize:13,flex:1}}>{row.comment}</div>
                {editMode&&(
                  <button onClick={()=>deleteAudit(row.id)}
                    style={{background:"transparent",border:`1px solid ${C.red}`,borderRadius:4,color:C.red,cursor:"pointer",padding:"3px 10px",fontSize:12,fontFamily:"inherit"}}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            {editMode&&<AddAuditRow onAdd={addAudit}/>}
          </>
        )}
      </div>
    </div>
  );
}

function AddAuditRow({onAdd}){
  const [area,setArea]=useState("");
  const [period,setPeriod]=useState("");
  const [cost,setCost]=useState("");
  const [comment,setComment]=useState("");
  const inp={background:"#1a1f2e",border:"1px solid #2e3347",borderRadius:6,color:"#e2e8f0",padding:"7px 12px",fontSize:13,fontFamily:"inherit",outline:"none"};
  return(
    <div style={{background:"#1a1f2e",border:"1px dashed #2e3347",borderRadius:8,padding:20,marginTop:12}}>
      <div style={{fontWeight:600,marginBottom:14,color:"#64748b",fontSize:13}}>+ Add Adjustment</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <input placeholder="Area" value={area} onChange={e=>setArea(e.target.value)} style={{...inp,width:120}}/>
        <input placeholder="Period" value={period} onChange={e=>setPeriod(e.target.value)} style={{...inp,width:100}}/>
        <input placeholder="Amount (€)" type="number" value={cost} onChange={e=>setCost(e.target.value)} style={{...inp,width:120}}/>
        <input placeholder="Comment" value={comment} onChange={e=>setComment(e.target.value)} style={{...inp,flex:1,minWidth:200}}/>
        <button
          onClick={()=>{if(area&&cost){onAdd({area,period,cost:parseFloat(cost),comment});setArea("");setPeriod("");setCost("");setComment("");}}}
          style={{background:"#3b82f6",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",padding:"7px 20px",fontFamily:"inherit",fontWeight:600}}>
          Add
        </button>
      </div>
    </div>
  );
}

