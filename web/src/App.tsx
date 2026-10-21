import { useEffect, useMemo, useState } from "react";
import { IonApp, IonPage, IonContent, IonIcon } from "@ionic/react";
import { addOutline, bookOutline, calculatorOutline, carOutline, checkboxOutline, chevronForwardOutline, closeOutline, ellipsisVerticalOutline, handLeftOutline, heartOutline, informationCircleOutline, pencilOutline, shareSocialOutline, settingsOutline, timeOutline, trashOutline, arrowUndoOutline } from "ionicons/icons";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { DEFAULT_PARAMETERS, simulate, valueAt, type Drink, type Parameters } from "./model";
import { PRESETS, QUICK_IDS, CATEGORIES } from "./presets";

type Service = "rechner"|"wissen"|"verkehr"|"test"|"hilfe";
type Overlay = "drinks"|"history"|"person"|"settings"|"responsibility"|null;
const tabs: {id:Service;label:string;icon:string}[] = [
  {id:"rechner",label:"Rechner",icon:calculatorOutline},{id:"wissen",label:"Wissen",icon:bookOutline},
  {id:"verkehr",label:"Verkehr",icon:carOutline},{id:"test",label:"Test",icon:checkboxOutline},{id:"hilfe",label:"Hilfe",icon:heartOutline}
];
const HOUR=3_600_000, STEP=900_000;
const fmt=(n:number,d=2)=>n.toLocaleString("de-AT",{minimumFractionDigits:d,maximumFractionDigits:d});
const clock=(t:number)=>new Date(t).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"});
const dateTime=(t:number)=>new Date(t).toLocaleString("de-AT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const snap=(t:number)=>Math.round(t/STEP)*STEP;
const pad=(n:number)=>String(n).padStart(2,"0");
const localInput=(t:number)=>{const d=new Date(t);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());};
function loadProfile():Parameters|null {
  try {const raw=localStorage.getItem("drinkr-profile-v02");if(!raw)return null;
    const v=JSON.parse(raw) as Parameters;
    if((v.profile!=="male"&&v.profile!=="female")||!Number.isFinite(v.weightKg)||!Number.isFinite(v.heightCm)
       ||v.weightKg<35||v.weightKg>250||v.heightCm<120||v.heightCm>230)return null;
    return {...DEFAULT_PARAMETERS,...v};
  } catch{return null;}
}
function BodyFields({sex,setSex,weight,setWeight,height,setHeight}:{
  sex:"male"|"female"|null;setSex:(x:"male"|"female")=>void;weight:number;setWeight:(n:number)=>void;height:number;setHeight:(n:number)=>void;
}){
  return <div className="body-fields">
    <label className="form-caption">Geschlechtsbezogenes Modellprofil</label>
    <div className="sex-choice" role="group" aria-label="Modellprofil">
      <button type="button" aria-pressed={sex==="male"} className={sex==="male"?"chosen":""} onClick={()=>setSex("male")}>Männlich</button>
      <button type="button" aria-pressed={sex==="female"} className={sex==="female"?"chosen":""} onClick={()=>setSex("female")}>Weiblich</button>
    </div>
    <div className="wheels">
      <label>Gewicht (kg)<select size={3} value={weight} disabled={!sex} onChange={e=>setWeight(Number(e.target.value))} aria-label="Gewicht in Kilogramm">
        {Array.from({length:216},(_,i)=>i+35).map(n=><option value={n} key={n}>{n} kg</option>)}
      </select></label>
      <label>Größe (cm)<select size={3} value={height} disabled={!sex} onChange={e=>setHeight(Number(e.target.value))} aria-label="Körpergröße in Zentimetern">
        {Array.from({length:111},(_,i)=>i+120).map(n=><option value={n} key={n}>{n} cm</option>)}
      </select></label>
    </div>
    <p className="tiny-note">Startwerte: M 80 kg / 180 cm · W 70 kg / 165 cm. Bitte prüfen.</p>
  </div>;
}
function Curve({points,now,selected,onSelected}:{
  points:ReturnType<typeof simulate>;now:number;selected:number|null;onSelected:(n:number)=>void;
}){
  const data=useMemo(()=>Array.from({length:97},(_,i)=>{const t=now-4*HOUR+i*300_000;const v=valueAt(points,t);
    return {time:t,past:t<=now?v:null,future:t>=now?v:null};}),[points,now]);
  return <div className="real-chart" aria-label="Promilleverlauf, Zeitpunkte per Antippen auswählbar">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{top:13,right:3,bottom:0,left:-29}}
        onClick={(e:{activeLabel?:number|string}|null)=>{if(e?.activeLabel!==undefined)onSelected(snap(Number(e.activeLabel)));}}>
        <CartesianGrid vertical={false} stroke="#cecece" strokeDasharray="3 5"/>
        <XAxis dataKey="time" type="number" scale="time" domain={[now-4*HOUR,now+4*HOUR]}
          ticks={[-4,-2,0,2,4].map(h=>now+h*HOUR)}
          tickFormatter={t=>{const h=Math.round((Number(t)-now)/HOUR);return h===0?"JETZT":(h>0?"+":"")+h+"h";}}
          tickLine={false} axisLine={false} tick={{fontSize:10,fill:"#666"}}/>
        <YAxis width={45} domain={[0,"auto"]} tickCount={4} tickFormatter={v=>fmt(Number(v),1)}
          tickLine={false} axisLine={false} tick={{fontSize:10,fill:"#666"}}/>
        <ReferenceLine x={now} stroke="#717171" strokeDasharray="4 4"/>
        {selected!==null&&<ReferenceLine x={selected} stroke="#222" strokeWidth={2}/>}
        <Area type="monotone" dataKey="past" fill="#bdbdbd" fillOpacity={.3} stroke="#353535" strokeWidth={3} connectNulls={false} isAnimationActive={false}/>
        <Area type="monotone" dataKey="future" fill="none" stroke="#777" strokeDasharray="5 5" strokeWidth={2} connectNulls={false} isAnimationActive={false}/>
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}
function GhostCurve(){return <div className="ghost-chart"><svg viewBox="0 0 320 115" role="img" aria-label="Schematischer Verlauf, keine Mess- oder Modellwerte">
  {[20,45,70,95].map(y=><line key={y} x1="10" x2="310" y1={y} y2={y} stroke="#ddd"/>)}
  <path d="M10 95 C55 95 64 35 112 40 S148 57 160 63" fill="none" stroke="#bbb" strokeWidth="3"/>
  <path d="M160 63 C202 82 245 95 310 95" fill="none" stroke="#bbb" strokeWidth="2" strokeDasharray="5 5"/>
  <line x1="160" x2="160" y1="5" y2="102" stroke="#999" strokeDasharray="3 4"/>
  <text x="160" y="112" fill="#777" fontSize="10" textAnchor="middle">JETZT</text>
  </svg><span>Vorschau – noch keine Berechnung</span></div>;}
const services:Record<Exclude<Service,"rechner">,{title:string,lead:string,cards:string[]}>={
  wissen:{title:"Alkoholwissen",lead:"Wirkung, Abbau, Alkoholmengen, Risiken und Mythen.",cards:["Aufnahme & Abbau","Wirkung auf das Gehirn","Alkoholmengen","Mythen & Fakten","Alkohol und Schlaf","Gesundheitliche Folgen"]},
  verkehr:{title:"Alkohol im Straßenverkehr",lead:"Österreichische Regelungen, Verkehrssicherheit und wissenschaftlicher Risikokontext.",cards:["Rechtliche Grundlagen","Unfallrisiko und Studien","Wahrnehmung und Reaktion","Sicher nach Hause"]},
  test:{title:"Alkohol-Selbsttest",lead:"Hier wird später ein geeignetes validiertes Screeningverfahren integriert.",cards:["Screeningverfahren","Ergebnis einordnen","Beratung und Hilfe"]},
  hilfe:{title:"Beratung & Hilfe",lead:"Orientierung für Betroffene und Angehörige.",cards:["Beratungsstellen finden","Für Angehörige","Vertrauliche Beratung","Akute Situationen"]}
};
export default function App(){
  const [service,setService]=useState<Service>("rechner");
  const [page,setPage]=useState<string|null>(null);
  const [menu,setMenu]=useState(false);
  const [overlay,setOverlay]=useState<Overlay>(null);
  const [profile,setProfile]=useState<Parameters|null>(()=>loadProfile());
  const [sex,setSex]=useState<"male"|"female"|null>(null);
  const [weight,setWeight]=useState(80),[height,setHeight]=useState(180);
  const [now,setNow]=useState(()=>Date.now());
  const [selected,setSelected]=useState<number|null>(null);
  const [drinks,setDrinks]=useState<Drink[]>([]);
  const [category,setCategory]=useState<string|null>(null);
  const [drinkAt,setDrinkAt]=useState<number|null>(null);
  const [custom,setCustom]=useState(false),[editId,setEditId]=useState<string|null>(null);
  const [name,setName]=useState("Eigenes Getränk"),[volume,setVolume]=useState("25"),[abv,setAbv]=useState("5"),[date,setDate]=useState("");
  const [undo,setUndo]=useState<Drink|null>(null),[notice,setNotice]=useState("");
  useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),30_000);return ()=>clearInterval(id);},[]);
  useEffect(()=>{if(notice){const id=window.setTimeout(()=>setNotice(""),5000);return ()=>clearTimeout(id);}},[notice]);
  const points=useMemo(()=>profile&&drinks.length?simulate(drinks,profile,now):[],[profile,drinks,now]);
  const at=selected??now;
  const bac=points.length?valueAt(points,at):null;
  const period=at>now+60_000?"Prognose":at<now-60_000?"Vergangenheit":"Jetzt";
  const changeSex=(s:"male"|"female")=>{setSex(s);setWeight(s==="male"?80:70);setHeight(s==="male"?180:165);};
  const saveBody=()=>{
    if(!sex||weight<35||weight>250||height<120||height>230)return;
    const p={...(profile??DEFAULT_PARAMETERS),profile:sex,weightKg:weight,heightCm:height};
    setProfile(p);try{localStorage.setItem("drinkr-profile-v02",JSON.stringify(p));}catch{setNotice("Körperdaten konnten nicht dauerhaft gespeichert werden.");}
    setOverlay(null);
  };
  const editBody=()=>{setSex(profile?.profile==="male"||profile?.profile==="female"?profile.profile:null);
    setWeight(profile?.weightKg??80);setHeight(profile?.heightCm??180);setOverlay("person");};
  const saveParameter=(key:"absorptionHalfLifeMin"|"eliminationPermillePerHour",value:number)=>{
    if(!profile)return;const p={...profile,[key]:value};setProfile(p);
    try{localStorage.setItem("drinkr-profile-v02",JSON.stringify(p));}catch{/* no storage */}
  };
  const openDrinks=()=>{
    if(!profile){setNotice("Bitte zuerst die Körperdaten bestätigen.");return;}
    setDrinkAt(null);setCustom(false);setEditId(null);setCategory(null);setOverlay("drinks");
  };
  const addPreset=(id:string)=>{
    const preset=PRESETS.find(p=>p.id===id);if(!preset||!profile)return;
    const d:Drink={id:crypto.randomUUID(),type:preset.label,volumeCl:preset.volumeCl,abvPercent:preset.abvPercent,at:drinkAt??Date.now()};
    setDrinks(old=>[...old,d].sort((a,b)=>a.at-b.at));setSelected(null);setOverlay(null);
    setUndo(d);setNotice("Getränk erfasst.");
  };
  const editDrink=(d:Drink)=>{setName(d.type);setVolume(String(d.volumeCl));setAbv(String(d.abvPercent));
    setDate(localInput(d.at));setEditId(d.id);setCustom(true);setOverlay("drinks");};
  const openCustom=()=>{setName("Eigenes Getränk");setVolume("25");setAbv("5");
    setDate(localInput(drinkAt??Date.now()));setEditId(null);setCustom(true);};
  const saveDrink=()=>{
    const amount=Number(volume),percent=Number(abv),timestamp=new Date(date).getTime();
    if(!Number.isFinite(amount)||amount<=0||amount>120||!Number.isFinite(percent)||percent<0||percent>100||
       !Number.isFinite(timestamp)||Math.abs(timestamp-Date.now())>12*HOUR){setNotice("Menge, Alkoholgehalt oder Zeitpunkt ungültig (max. ±12 h).");return;}
    const d:Drink={id:editId??crypto.randomUUID(),type:name.trim()||"Eigenes Getränk",volumeCl:amount,abvPercent:percent,at:timestamp};
    setDrinks(old=>[...old.filter(x=>x.id!==d.id),d].sort((a,b)=>a.at-b.at));
    setUndo(editId?null:d);setSelected(null);setOverlay(null);setNotice(editId?"Eintrag aktualisiert.":"Getränk erfasst.");
  };
  const stepTime=(by:number)=>setDrinkAt(old=>Math.min(Date.now()+12*HOUR,Math.max(Date.now()-12*HOUR,snap((old??Date.now())+by*STEP))));
  const share=async()=>{
    const url=location.origin+location.pathname;
    try{if(navigator.share)await navigator.share({title:"drinkR",text:"drinkR – Promille verstehen",url});
      else if(navigator.clipboard){await navigator.clipboard.writeText(url);setNotice("App-Link kopiert.");}
      else setNotice(url);
    }catch(e){if((e as Error).name!=="AbortError")setNotice("Teilen nicht möglich.");}
  };
  return <IonApp><IonPage>
    <header className="app-header">
      <button className="brand" onClick={()=>{setService("rechner");setPage(null);}}>drink<span>R</span><small>PROMILLE IM MODELL</small></button>
      <div className="header-icons">
        <button aria-label="App teilen" onClick={()=>{void share();}}><IonIcon icon={shareSocialOutline}/></button>
        <button aria-label="Menü" aria-expanded={menu} onClick={()=>setMenu(!menu)}><IonIcon icon={ellipsisVerticalOutline}/></button>
      </div>
      {menu&&<div className="menu-pop" role="menu">
        <button onClick={()=>{setMenu(false);setOverlay("settings");}}><IonIcon icon={settingsOutline}/> Einstellungen</button>
        {["Datenschutz","Impressum","Haftungsausschluss","Wissenschaftliche Grundlagen","Lizenzen & Quellen","Über drinkR"].map(p=>
          <button key={p} onClick={()=>{setPage(p);setMenu(false);}}>{p}</button>)}
      </div>}
    </header>
    <IonContent className="app-content">
      {page?<main className="subpage">
        <button className="back-link" onClick={()=>setPage(null)}>‹ Zurück</button><h1>{page}</h1>
        <section className="placeholder"><b>Inhalt in Vorbereitung</b><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dies ist ein Strukturplatzhalter – keine verbindliche rechtliche oder fachliche Information.</p></section>
      </main>:service!=="rechner"?<main className="subpage">
        <p className="eyebrow">DRINKR SERVICES</p><h1>{services[service].title}</h1><p>{services[service].lead}</p>
        <div className="placeholder-banner"><IonIcon icon={informationCircleOutline}/> Platzhalter · Inhalte und Funktionen folgen.</div>
        <div className="service-grid">{services[service].cards.map((c,i)=>
          <section className="service-card" key={c}><span className="service-number">{i+1}</span><h2>{c}</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Wissenschaftlich überprüfte Inhalte folgen.</p><small>In Vorbereitung</small></section>)}</div>
      </main>:<main className="home">
        <div className="person-strip">
          <button onClick={editBody}><small>Modellprofil</small><b>{profile?(profile.profile==="male"?"Männlich":"Weiblich"):"—"}</b><IonIcon icon={pencilOutline}/></button>
          <button onClick={editBody}><small>Gewicht</small><b>{profile?profile.weightKg+" kg":"—"}</b><IonIcon icon={pencilOutline}/></button>
          <button onClick={editBody}><small>Größe</small><b>{profile?profile.heightCm+" cm":"—"}</b><IonIcon icon={pencilOutline}/></button>
        </div>
        <section className={"model-stage"+(!profile?" setup-pending":"")}>
          <div className="results-card">
            <div className="results-top"><span>AUSGEWÄHLTER ZEITPUNKT</span><b><IonIcon icon={timeOutline}/> {clock(at)} Uhr</b></div>
            <div className="results-grid">
              <div className="bac-result"><small>Geschätzter Blutalkohol</small><strong>{bac===null?"—":fmt(bac)} <span>‰</span></strong><p>{period} · Modellwert, keine Messung</p></div>
              <div className="risk-result"><small><IonIcon icon={informationCircleOutline}/> Relatives Unfallrisiko</small><strong>— ×</strong><p>Modell folgt</p></div>
            </div>
          </div>
          <div className="plot-card">
            <div className="plot-heading"><div><b>Verlauf</b><small>Punkt antippen · 15-Min.-Raster</small></div><span>━ Bisher &nbsp;┄ Prognose</span></div>
            {points.length?<Curve points={points} now={now} selected={selected} onSelected={t=>setSelected(Math.max(now-4*HOUR,Math.min(now+4*HOUR,t)))}/>:<GhostCurve/>}
            <div className="time-controls">
              <button disabled={!points.length} onClick={()=>setSelected(snap((selected??now)-STEP))}>−15 min</button>
              <button disabled={!points.length} onClick={()=>setSelected(null)}>Jetzt · {clock(now)}</button>
              <button disabled={!points.length} onClick={()=>setSelected(snap((selected??now)+STEP))}>+15 min</button>
            </div>
            {drinks.length>0&&<button className="history-link" onClick={()=>setOverlay("history")}>{drinks.length} Getränke erfasst <IonIcon icon={chevronForwardOutline}/></button>}
          </div>
          {!profile&&<div className="setup-layer"><form className="setup-box" onSubmit={e=>{e.preventDefault();saveBody();}}>
            <h2>Bevor es losgeht</h2><p>Drei Angaben für deine persönliche Modellrechnung.</p>
            <BodyFields sex={sex} setSex={changeSex} weight={weight} setWeight={setWeight} height={height} setHeight={setHeight}/>
            <button type="submit" className="primary" disabled={!sex}>Rechner aktivieren</button>
            <small className="disclaimer">Modellannahmen sind keine Messwerte.</small>
          </form></div>}
        </section>
        <div className="cta-row">
          <button className="cta-main" onClick={openDrinks}><IonIcon icon={addOutline}/> Getränk</button>
          <button className="cta-second" onClick={()=>setOverlay("responsibility")}><IonIcon icon={handLeftOutline}/> Verantwortung</button>
        </div>
        <div className="safety"><IonIcon icon={informationCircleOutline}/> Modellrechnung ≠ Fahrtüchtigkeit.</div>
      </main>}
    </IonContent>
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {tabs.map(t=><button key={t.id} className={!page&&service===t.id?"active":""} aria-current={!page&&service===t.id?"page":undefined} onClick={()=>{setService(t.id);setPage(null);setMenu(false);setOverlay(null);}}>
        <IonIcon icon={t.icon}/><span>{t.label}</span></button>)}
    </nav>
    {overlay&&<div className="sheet-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setOverlay(null);}}>
      <section className={"sheet "+(overlay==="person"||overlay==="settings"?"sheet-centered":"")} role="dialog" aria-modal="true" aria-label="drinkR Dialog">
        <div className="sheet-head"><h2>{overlay==="drinks"?"Getränk hinzufügen":overlay==="history"?"Getränke bearbeiten":overlay==="person"?"Körperdaten":overlay==="settings"?"Einstellungen":"Verantwortung übernehmen"}</h2>
          <button aria-label="Schließen" onClick={()=>setOverlay(null)}><IonIcon icon={closeOutline}/></button></div>
        {overlay==="person"&&<form onSubmit={e=>{e.preventDefault();saveBody();}}>
          <BodyFields sex={sex} setSex={changeSex} weight={weight} setWeight={setWeight} height={height} setHeight={setHeight}/>
          <button type="submit" className="primary" disabled={!sex}>Angaben übernehmen</button>
        </form>}
        {overlay==="drinks"&&(!custom?<div>
          <div className="time-select"><div><small>ZEITPUNKT</small><b>{drinkAt===null?"Jetzt · "+clock(now):dateTime(drinkAt)}</b></div>
            <div><button onClick={()=>stepTime(-1)} aria-label="15 Minuten zurück">−15</button><button onClick={()=>setDrinkAt(null)}>Jetzt</button><button onClick={()=>stepTime(1)} aria-label="15 Minuten weiter">+15</button></div>
          </div>
          <p className="section-label">Häufige Getränke · ein Tipp genügt</p>
          <div className="quick-grid">{QUICK_IDS.map(id=>{const p=PRESETS.find(d=>d.id===id);return p&&<button key={id} onClick={()=>addPreset(id)}><b>{p.label}</b><small>{fmt(p.volumeCl/100,p.volumeCl%10===0?1:3)} l · {fmt(p.abvPercent,1)} %</small></button>;})}</div>
          <p className="section-label">Weitere Kategorien</p>
          <div className="categories">{Object.keys(CATEGORIES).map(c=><button key={c} aria-expanded={category===c} onClick={()=>setCategory(category===c?null:c)}>{c}<IonIcon icon={chevronForwardOutline}/></button>)}</div>
          {category&&<div className="category-items">{CATEGORIES[category].map(id=>{const p=PRESETS.find(d=>d.id===id);return p&&<button key={id} onClick={()=>addPreset(id)}>{p.label}<small>{p.volumeCl} cl · {fmt(p.abvPercent,1)} %</small></button>;})}</div>}
          <button className="text-action" onClick={openCustom}>Eigenes Getränk / Mengen und Alkoholgehalt anpassen ›</button>
        </div>:<form className="custom-form" onSubmit={e=>{e.preventDefault();saveDrink();}}>
          <label>Getränk<input value={name} onChange={e=>setName(e.target.value)} maxLength={70}/></label>
          <div className="custom-grid"><label>Menge (cl)<input type="number" min="1" max="120" step=".5" value={volume} onChange={e=>setVolume(e.target.value)}/></label>
          <label>Alkohol (% vol)<input type="number" min="0" max="100" step=".1" value={abv} onChange={e=>setAbv(e.target.value)}/></label></div>
          <label>Zeitpunkt <input type="datetime-local" step={900} value={date} onChange={e=>setDate(e.target.value)}/></label>
          <p className="tiny-note">Cocktails sind je nach Rezeptur unterschiedlich stark. Eingaben max. 12 Stunden vor oder nach jetzt.</p>
          <button className="primary" type="submit">{editId?"Änderungen speichern":"Getränk hinzufügen"}</button>
          <button className="text-action" type="button" onClick={()=>{setCustom(false);setEditId(null);}}>‹ Zur Auswahl</button>
        </form>)}
        {overlay==="history"&&<div className="history-list">
          {drinks.map(d=><div key={d.id} className="history-item"><button onClick={()=>editDrink(d)}><b>{d.type}</b><small>{dateTime(d.at)} · {d.volumeCl} cl · {fmt(d.abvPercent,1)} %</small></button>
            <button className="delete" aria-label={d.type+" löschen"} onClick={()=>setDrinks(old=>old.filter(x=>x.id!==d.id))}><IonIcon icon={trashOutline}/></button></div>)}
          <button className="primary" onClick={openDrinks}>Getränk hinzufügen</button>
        </div>}
        {overlay==="settings"&&<div className="settings">
          {profile?<><label>Halbwertszeit der Aufnahme <b>{profile.absorptionHalfLifeMin} min</b>
            <input type="range" min="5" max="50" value={profile.absorptionHalfLifeMin} onChange={e=>saveParameter("absorptionHalfLifeMin",Number(e.target.value))}/></label>
            <label>Rechnerischer Abbau <b>{fmt(profile.eliminationPermillePerHour)} ‰/h</b>
              <input type="range" min=".05" max=".3" step=".01" value={profile.eliminationPermillePerHour} onChange={e=>saveParameter("eliminationPermillePerHour",Number(e.target.value))}/></label>
            <p className="tiny-note">Modellparameter sind Annahmen, keine individuellen Messungen.</p>
          </>:<p>Bitte zuerst Körperdaten bestätigen.</p>}
          <button className="text-action" onClick={()=>{try{localStorage.removeItem("drinkr-profile-v02");}catch{/* no storage */}setProfile(null);setSex(null);setDrinks([]);setSelected(null);setOverlay(null);}}>Körperdaten löschen und Sitzung zurücksetzen</button>
        </div>}
        {overlay==="responsibility"&&<div className="future-content"><IonIcon icon={handLeftOutline}/><h3>Bewusst nicht selbst fahren</h3>
          <p>Hier werden später eine freiwillige teilbare Botschaft und ein persönlicher Kalendereintrag („Note to self“ nach 24 Stunden) angeboten.</p>
          <div className="future-buttons"><span>↗ Teilen</span><span>◷ Note to self · +24 h</span></div>
          <p className="tiny-note">Noch nicht aktiv. Keine Nachricht wird versendet und kein Termin angelegt.</p>
        </div>}
      </section>
    </div>}
    {notice&&<div className="toast" role="status">{notice}{undo&&notice==="Getränk erfasst."&&<button onClick={()=>{setDrinks(old=>old.filter(d=>d.id!==undo.id));setUndo(null);setNotice("Getränk entfernt.");}}><IonIcon icon={arrowUndoOutline}/> Rückgängig</button>}</div>}
  </IonPage></IonApp>;
}
