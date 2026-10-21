import { useEffect, useMemo, useState } from "react";
import {
  IonApp, IonPage, IonHeader, IonToolbar, IonContent,
  IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel,
  IonCard, IonCardContent
} from "@ionic/react";
import { addOutline, informationCircleOutline, trashOutline, settingsOutline, wineOutline } from "ionicons/icons";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from "recharts";
import {
  DEFAULT_PARAMETERS, simulate, valueAt, type Drink, type Parameters
} from "./model";
import { PRESETS } from "./presets";

type View = "rechner" | "verlauf" | "info";
const number = (n: number, digits = 2) =>
  n.toLocaleString("de-AT", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const timeText = (ms: number) =>
  new Date(ms).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
const dateText = (ms: number) =>
  new Date(ms).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" });
const pad = (n: number) => String(n).padStart(2, "0");
function localDateInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function BacChart({ drinks, settings, now }: { drinks: Drink[]; settings: Parameters; now: number }) {
  const series = useMemo(() => simulate(drinks, settings, now), [drinks, settings, now]);
  const current = valueAt(series, now);
  const bridgeIndex = Math.max(0, Math.min(series.length - 1,
    Math.floor((now - series[0].timestamp) / 60_000)));
  const data = series.filter((_, i) => i % 5 === 0 || i === series.length - 1 || i === bridgeIndex)
    .map((p) => {
      const actual = p.timestamp <= now;
      const forecast = p.timestamp >= series[bridgeIndex].timestamp;
      return {
        time: p.timestamp,
        bisher: actual ? p.permille : null,
        modell: forecast ? p.permille : null
      };
    });
  return (
    <>
      <section className="estimate" aria-live="polite">
        <div className="estimate-label">GESCHÄTZTER WERT JETZT</div>
        <div className="estimate-number">{number(current)}<span>‰</span></div>
        <p>Modellwert, keine Messung des Blutalkohols</p>
      </section>
      <div className="graph-container" role="img" aria-label="Verlauf des geschätzten Blutalkohols in Promille">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 12, left: -22, bottom: 4 }}>
            <defs>
              <linearGradient id="drinkrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#168b9f" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#168b9f" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#dce8ee" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} scale="time"
              tickFormatter={(t: number) => timeText(t)} minTickGap={30}
              tick={{ fill: "#617481", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, "auto"]} width={48} tickCount={5}
              tickFormatter={(v: number) => number(v, 1)}
              tick={{ fill: "#617481", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(t) => new Date(Number(t)).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              formatter={(v) => [`${number(Number(v))} ‰`, "Schätzwert"]}
              contentStyle={{ borderRadius: "12px", border: "1px solid #dce8ee", fontSize: 13 }}
            />
            <ReferenceLine x={now} stroke="#eb9656" strokeDasharray="4 4" ifOverflow="extendDomain" />
            <Area type="monotone" dataKey="bisher" stroke="#168b9f" strokeWidth={3}
              fill="url(#drinkrGradient)" connectNulls={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="modell" stroke="#168b9f" strokeWidth={2}
              strokeDasharray="5 5" fill="none" connectNulls={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-key">
        <span><i className="line-key" /> Bisheriger Modellverlauf</span>
        <span><i className="line-key dashed" /> Rechnerische Fortschreibung</span>
      </div>
    </>
  );
}

export default function App() {
  const [view, setView] = useState<View>("rechner");
  const [settings, setSettings] = useState<Parameters>(DEFAULT_PARAMETERS);
  const [now, setNow] = useState(() => Date.now());
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [volume, setVolume] = useState(PRESETS[0].volumeCl);
  const [percent, setPercent] = useState(PRESETS[0].abvPercent);
  const [drinkAt, setDrinkAt] = useState(() => localDateInput(Date.now()));
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  function choosePreset(id: string) {
    const selected = PRESETS.find(p => p.id === id);
    if (!selected) return;
    setPresetId(id);
    setVolume(selected.volumeCl);
    setPercent(selected.abvPercent);
    setError("");
  }

  function addDrink() {
    const timestamp = new Date(drinkAt).getTime();
    if (!Number.isFinite(timestamp) || !Number.isFinite(volume) || !Number.isFinite(percent)
      || volume <= 0 || volume > 120 || percent < 0 || percent > 100) {
      setError("Bitte gültige Angaben zu Zeitpunkt, Menge (1–120 cl) und Alkoholgehalt (0–100 %) eingeben.");
      return;
    }
    // Keep entry window comparable to the original drinkR selector.
    if (Math.abs(timestamp - Date.now()) > 12 * 3_600_000) {
      setError("Der Zeitpunkt darf höchstens zwölf Stunden vor oder nach jetzt liegen.");
      return;
    }
    const preset = PRESETS.find(p => p.id === presetId) ?? PRESETS[0];
    setDrinks(previous => [...previous, {
      id: crypto.randomUUID(), type: preset.label, volumeCl: volume,
      abvPercent: percent, at: timestamp
    }].sort((a, b) => a.at - b.at));
    setDrinkAt(localDateInput(Date.now()));
    setNow(Date.now());
    setError("");
  }

  const settingsField = <K extends keyof Parameters>(key: K, value: Parameters[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const drinksByTime = drinks.map(d => (
    <div className="logged-drink" key={d.id}>
      <div className="logged-detail">
        <strong>{d.type}</strong>
        <span>{dateText(d.at)} · {timeText(d.at)} · {number(d.volumeCl, 0)} cl · {number(d.abvPercent, 1)} %</span>
      </div>
      <IonButton fill="clear" aria-label={`${d.type} entfernen`}
        onClick={() => setDrinks(prev => prev.filter(x => x.id !== d.id))}>
        <IonIcon icon={trashOutline} slot="icon-only" />
      </IonButton>
    </div>
  ));

  return (
    <IonApp>
      <IonPage>
        <IonHeader className="ion-no-border">
          <IonToolbar className="app-toolbar">
            <div className="brand" slot="start">
              <span className="brand-mark"><IonIcon icon={wineOutline} /></span>
              <span>drink<span className="brand-accent">R</span><small>PROMILLE IM MODELL</small></span>
            </div>
            <span slot="end" className="app-edition">DE · 0.1</span>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <main className="page-wrap">
            <header className="page-intro">
              <div className="eyebrow">INTERAKTIVES MODELL</div>
              <h1>Was passiert mit dem Alkohol im Körper?</h1>
              <p>Erfasse Getränke und erkunde einen rechnerisch geschätzten Verlauf deiner Blutalkoholkonzentration.</p>
            </header>

            <nav aria-label="Ansicht wählen" className="app-nav">
              <IonSegment value={view} onIonChange={e => setView((e.detail.value as View) || "rechner")}>
                <IonSegmentButton value="rechner"><IonLabel>Rechner</IonLabel></IonSegmentButton>
                <IonSegmentButton value="verlauf"><IonLabel>Verlauf</IonLabel></IonSegmentButton>
                <IonSegmentButton value="info"><IonLabel>Info</IonLabel></IonSegmentButton>
              </IonSegment>
            </nav>

            {view !== "info" && (
              <IonCard className="panel chart-panel">
                <IonCardContent>
                  <div className="panel-top">
                    <div><div className="eyebrow">BLUTALKOHOL</div><h2>Dein geschätzter Verlauf</h2></div>
                    <span className="hint-pill">‰ Promille</span>
                  </div>
                  <BacChart drinks={drinks} settings={settings} now={now} />
                  <div className="science-note">
                    <IonIcon icon={informationCircleOutline} />
                    <span>Die Kurve ist eine Modellrechnung und kann erheblich vom tatsächlichen Blutalkoholwert abweichen.</span>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {view === "rechner" && (
              <div className="two-column">
                <IonCard className="panel">
                  <IonCardContent>
                    <div className="panel-top">
                      <div><div className="eyebrow">SCHRITT 01</div><h2>Getränk hinzufügen</h2></div>
                      <IonIcon icon={addOutline} className="panel-symbol" />
                    </div>
                    <div className="drink-picker" role="group" aria-label="Getränkeart">
                      {PRESETS.map(p => (
                        <button type="button" className={`drink-tile ${presetId === p.id ? "selected" : ""}`}
                          aria-pressed={presetId === p.id} key={p.id} onClick={() => choosePreset(p.id)}>
                          <span className="drink-icon" aria-hidden="true">{p.emoji}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="form-grid">
                      <label>Menge (cl)
                        <input type="number" min="1" max="120" step="1" value={volume}
                          onChange={e => setVolume(Number(e.target.value))} />
                      </label>
                      <label>Alkohol (% vol)
                        <input type="number" min="0" max="100" step="0.5" value={percent}
                          onChange={e => setPercent(Number(e.target.value))} />
                      </label>
                    </div>
                    <label className="full-input">Zeitpunkt des Getränks
                      <input type="datetime-local" value={drinkAt} onChange={e => setDrinkAt(e.target.value)} />
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <IonButton expand="block" className="primary-action" onClick={addDrink}>
                      <IonIcon icon={addOutline} slot="start" /> Getränk hinzufügen
                    </IonButton>
                  </IonCardContent>
                </IonCard>

                <div className="right-stack">
                  <IonCard className="panel">
                    <IonCardContent>
                      <div className="panel-top">
                        <div><div className="eyebrow">SCHRITT 02</div><h2>Erfasste Getränke</h2></div>
                        <span className="count-pill">{drinks.length}</span>
                      </div>
                      {drinks.length ? drinksByTime : (
                        <p className="empty-message">Noch keine Getränke erfasst. Wähle links ein Getränk und füge es hinzu.</p>
                      )}
                      {drinks.length > 0 && (
                        <IonButton fill="clear" size="small" className="reset-button" onClick={() => setDrinks([])}>
                          Alle Einträge löschen
                        </IonButton>
                      )}
                    </IonCardContent>
                  </IonCard>
                  <IonCard className="panel">
                    <IonCardContent>
                      <details className="model-settings">
                        <summary><IonIcon icon={settingsOutline} /> <strong>Modellparameter anpassen</strong><span>▼</span></summary>
                        <p className="setting-help">Die ursprüngliche Berechnung verwendet vereinfachende, geschlechtsbezogene Verteilungsfaktoren.</p>
                        <label>Berechnungsprofil
                          <select value={settings.profile}
                            onChange={e => settingsField("profile", e.target.value as Parameters["profile"])}>
                            <option value="unknown">Unbekannt (Mittelwert)</option>
                            <option value="male">Männlicher Modellfaktor</option>
                            <option value="female">Weiblicher Modellfaktor</option>
                          </select>
                        </label>
                        <div className="form-grid">
                          <label>Körpergröße (cm)
                            <input type="number" min="140" max="210" value={settings.heightCm}
                              onChange={e => settingsField("heightCm", Math.min(210, Math.max(140, Number(e.target.value) || 140)))} />
                          </label>
                          <label>Körpergewicht (kg)
                            <input type="number" min="40" max="150" value={settings.weightKg}
                              onChange={e => settingsField("weightKg", Math.min(150, Math.max(40, Number(e.target.value) || 40)))} />
                          </label>
                        </div>
                        <label className="range-label">Resorptions-Halbwertszeit <b>{settings.absorptionHalfLifeMin} min</b>
                          <input type="range" min="6" max="18" step="1" value={settings.absorptionHalfLifeMin}
                            onChange={e => settingsField("absorptionHalfLifeMin", Number(e.target.value))} />
                        </label>
                        <label className="range-label">Angenommener Alkoholabbau <b>{number(settings.eliminationPermillePerHour)} ‰/h</b>
                          <input type="range" min="0.09" max="0.35" step="0.01" value={settings.eliminationPermillePerHour}
                            onChange={e => settingsField("eliminationPermillePerHour", Number(e.target.value))} />
                        </label>
                        <IonButton fill="clear" size="small" onClick={() => setSettings(DEFAULT_PARAMETERS)}>
                          Standardwerte wiederherstellen
                        </IonButton>
                      </details>
                    </IonCardContent>
                  </IonCard>
                </div>
              </div>
            )}

            {view === "verlauf" && (
              <IonCard className="panel">
                <IonCardContent>
                  <div className="eyebrow">ZEITLICHE EINTRÄGE</div>
                  <h2>Deine Getränke im Überblick</h2>
                  {drinks.length ? drinksByTime : <p className="empty-message">Noch keine Einträge vorhanden.</p>}
                  <IonButton fill="outline" className="back-action" onClick={() => setView("rechner")}>
                    Weitere Getränke erfassen
                  </IonButton>
                  <p className="setting-help">Eine gestrichelte Kurve beschreibt ausschließlich die modellierte Entwicklung ab dem aktuellen Zeitpunkt.</p>
                </IonCardContent>
              </IonCard>
            )}

            {view === "info" && (
              <IonCard className="panel info-panel">
                <IonCardContent>
                  <div className="eyebrow">WISSENSCHAFTLICHE EINORDNUNG</div>
                  <h2>Was drinkR berechnet – und was nicht</h2>
                  <p>drinkR simuliert die Aufnahme und den Abbau von Alkohol auf Basis eines vereinfachten Widmark-Modells. Berücksichtigt werden Getränkemenge, Alkoholgehalt, Trinkzeitpunkt, Körpergröße, Körpergewicht und modellhafte Verteilungs- und Abbauraten.</p>
                  <h3>Warum können die Werte abweichen?</h3>
                  <p>Individuelle Unterschiede, Gesundheitszustand, zeitlicher Trinkverlauf, Nahrung und zahlreiche weitere Einflüsse werden nur vereinfacht oder gar nicht abgebildet. Es werden keine Blut- oder Atemalkoholmessungen durchgeführt.</p>
                  <h3>Ist die Anwendung für Entscheidungen im Straßenverkehr geeignet?</h3>
                  <p><strong>Nein.</strong> Weder ein niedriger Modellwert noch eine zeitliche Fortschreibung beweisen Fahrtüchtigkeit oder einen tatsächlichen Blutalkoholwert. Trinke nicht, wenn du noch fahren musst.</p>
                  <h3>Datenschutz</h3>
                  <p>Alle Eingaben werden lokal in dieser Browsersitzung verarbeitet. Es gibt keine Anmeldung, keinen App-Server und keine dauerhafte Speicherung deiner Einträge.</p>
                  <h3>Herkunft</h3>
                  <p>Originalprogramm von Rasmus Bååth (2014), MIT-Lizenz. Die Berechnung wurde von R nach TypeScript übertragen und für die Darstellung in Promille angepasst.</p>
                  <IonButton fill="outline" onClick={() => setView("rechner")}>Zum Rechner</IonButton>
                </IonCardContent>
              </IonCard>
            )}

            <footer className="app-footer">
              <strong>Wichtig:</strong> Keine Messung und keine Grundlage für Entscheidungen zur Fahrtüchtigkeit.
              <span>drinkR · Auf Grundlage von Rasmus Bååth (2014) · MIT-Lizenz</span>
            </footer>
          </main>
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
