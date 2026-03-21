'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS      = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const EMOJIS    = ['🏋🏻‍♀️','🎾','🏐','🏃‍♀️','🚴‍♀️','🏊‍♀️','🧘‍♀️','🧖🏻‍♀️','⚽','🏀','🥊','🧠'];
const DURATIONS = ['30 min','40 min','45 min','1h','1h 15','1h 30','2h'];
const DEFAULT_PRESETS = [
  'gym 🏋🏻‍♀️','padel Training 🎾','beach volleyball 🏐',
  'spa wellness 🧖🏻‍♀️','leg work out with Eliza','running 🏃‍♀️','yoga 🧘‍♀️','cycling 🚴‍♀️',
];

type Entry = { day: string; activity: string };
type Week  = { id: number; number: number; open: boolean; days: Entry[] };
type AllMonths = Record<string, Week[]>;
type AppState  = { goal: number; allMonths: AllMonths; presets: string[]; previewMode: 'current' | 'history' };

const EMPTY_STATE = (): AppState => ({
  goal: 3, allMonths: {}, presets: [...DEFAULT_PRESETS], previewMode: 'current',
});

// ── Pure helpers ──────────────────────────────────────────────────────────────

function uniqueDays(week: Week) {
  return new Set(week.days.map(e => e.day)).size;
}

function weekDateRange(weekNum: number, month: string) {
  const monthIdx  = MONTHS.indexOf(month);
  const year      = new Date().getFullYear();
  const startDay  = (weekNum - 1) * 7 + 1;
  const daysInMon = new Date(year, monthIdx + 1, 0).getDate();
  const endDay    = Math.min(weekNum * 7, daysInMon);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(new Date(year, monthIdx, startDay))} – ${fmt(new Date(year, monthIdx, endDay))}`;
}

function computeWeekStatuses(weeks: Week[], goal: number) {
  const n         = weeks.length;
  const remaining = weeks.map(w => Math.max(0, uniqueDays(w) - goal));
  const statuses  = new Array<string>(n);
  for (let i = 0; i < n; i++) {
    const days = uniqueDays(weeks[i]);
    if (days === 0)   { statuses[i] = 'empty';     continue; }
    if (days >= goal) { statuses[i] = 'completed'; continue; }
    const needed = 2 * (goal - days);
    const prevA  = i > 0     ? remaining[i - 1] : 0;
    const nextA  = i < n - 1 ? remaining[i + 1] : 0;
    if (prevA >= needed)      { remaining[i - 1] -= needed; statuses[i] = 'compensated'; }
    else if (nextA >= needed) { remaining[i + 1] -= needed; statuses[i] = 'compensated'; }
    else                      { statuses[i] = 'failed'; }
  }
  return statuses;
}

function computeMonthSummary(weeks: Week[], statuses: string[]) {
  const active = weeks.filter(w => w.days.length > 0);
  if (!active.length) return null;
  const total      = active.length;
  const passed     = statuses.filter((s, i) => weeks[i].days.length > 0 && (s === 'completed' || s === 'compensated')).length;
  const allPassed  = passed === total;
  const hasPerfect = weeks.some(w => uniqueDays(w) === 7);
  return { total, passed, allPassed, hasPerfect };
}

function buildMonthText(month: string, allMonths: AllMonths, goal: number) {
  const weeks      = allMonths[month] || [];
  const statuses   = computeWeekStatuses(weeks, goal);
  const hasPerfect = weeks.some(w => uniqueDays(w) === 7);
  let text = `*${month}*${hasPerfect ? '⭐' : ''}\n`;
  weeks.forEach((week, wi) => {
    const s     = statuses[wi];
    const emoji = s === 'completed' ? '✅' : s === 'compensated' ? '☑️' : s === 'failed' ? '❌' : '';
    text += ` *Week ${week.number}*${emoji} \n`;
    const byDay: Record<string, string[]> = {};
    week.days.forEach(e => { (byDay[e.day] = byDay[e.day] || []).push(e.activity); });
    DAYS.forEach(d => { if (byDay[d]) text += `${d}: ${byDay[d].join(' + ')}\n`; });
  });
  return text;
}

function buildMonthSummaryLine(month: string, allMonths: AllMonths, goal: number) {
  const weeks    = allMonths[month] || [];
  const statuses = computeWeekStatuses(weeks, goal);
  const summary  = computeMonthSummary(weeks, statuses);
  if (!summary) return '';
  const icon = summary.allPassed ? '✅' : '❌';
  return `*${month}* ${icon} ${summary.passed}/${summary.total}${summary.hasPerfect ? ' ⭐' : ''}\n`;
}

function escHtml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── WeekCard ──────────────────────────────────────────────────────────────────

function WeekCard({ week, localWi, month, status, goal, presets, onUpdate, onDelete, onToggleOpen, onUpdatePresets }: {
  week: Week; localWi: number; month: string; status: string; goal: number; presets: string[];
  onUpdate: (month: string, wi: number, days: Entry[]) => void;
  onDelete: (month: string, wi: number) => void;
  onToggleOpen: (month: string, wi: number) => void;
  onUpdatePresets: (presets: string[]) => void;
}) {
  const [day, setDay]           = useState(DAYS[0]);
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState<string | null>(null);
  const [durErrorKey, setDurErrorKey] = useState(0);
  const [durError, setDurError] = useState(false);
  const actRef = useRef<HTMLInputElement>(null);

  const days        = uniqueDays(week);
  const statusEmoji = (status === 'completed' || status === 'compensated') ? '✅' : status === 'failed' ? '❌' : '○';
  const progCls     = (status === 'completed' || status === 'compensated') ? 'met' : status === 'failed' ? 'unmet' : 'empty';

  const doAdd = () => {
    if (!activity.trim()) return;
    if (!duration) {
      setDurError(true);
      setDurErrorKey(k => k + 1);
      return;
    }
    onUpdate(month, localWi, [...week.days, { day, activity: `${duration} ${activity.trim()}` }]);
    setActivity('');
    setDuration(null);
    setDurError(false);
  };

  return (
    <div className="week-card">
      <div className="week-card-header" onClick={e => {
        if ((e.target as HTMLElement).closest('[data-action="del"]')) {
          if (week.days.length === 0 || confirm('Delete this week and all entries?')) onDelete(month, localWi);
          return;
        }
        onToggleOpen(month, localWi);
      }}>
        <div className="week-card-title">
          <span className="status-badge">{statusEmoji}</span>
          <div>
            <div>Week {week.number} <span className="week-dates">{weekDateRange(week.number, month)}</span></div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
              <span className={`week-progress ${progCls}`}>{days}/{goal} days</span>
              {status === 'compensated' && <span className="comp-note">compensated</span>}
            </div>
          </div>
        </div>
        <div className="week-meta">
          <button className="icon-btn del" data-action="del" title="Delete week">✕</button>
          <span className={`chevron ${week.open ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {week.open && (
        <div className="week-card-body">
          {week.days.length === 0 ? (
            <div className="no-entries">No entries yet — use the form below.</div>
          ) : (
            <div>
              {week.days.map((entry, ei) => (
                <div key={ei} className="day-entry">
                  <span className="day-badge">{entry.day}</span>
                  <span className="activity-text">{entry.activity}</span>
                  <button className="icon-btn del" title="Remove" onClick={() => {
                    const next = [...week.days]; next.splice(ei, 1); onUpdate(month, localWi, next);
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="add-form">
            <div className="form-section">
              <div className="form-label">Day &amp; activity</div>
              <div className="form-row">
                <select className="sel-day" value={day} onChange={e => setDay(e.target.value)}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
                <input
                  ref={actRef}
                  className="inp-act"
                  type="text"
                  placeholder="Type or tap a preset below…"
                  value={activity}
                  onChange={e => setActivity(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') doAdd(); }}
                />
              </div>
            </div>

            <div key={durErrorKey} className={`form-section${durError ? ' dur-error' : ''}`}>
              <div className="form-label">Duration</div>
              <div className="chip-strip">
                {DURATIONS.map(d => (
                  <button key={d} className={`chip${duration === d ? ' active' : ''}`}
                    onClick={() => { setDuration(d); setDurError(false); }}>{d}</button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <div className="form-label">Quick activities</div>
              <div className="chip-strip">
                {presets.map((p, pi) => (
                  <button key={pi} className="chip" title="Right-click to remove"
                    onClick={() => { setActivity(p); actRef.current?.focus(); }}
                    onContextMenu={e => {
                      e.preventDefault();
                      if (confirm(`Remove preset "${p}"?`)) {
                        const next = [...presets]; next.splice(pi, 1); onUpdatePresets(next);
                      }
                    }}>{p}</button>
                ))}
                <button className="add-preset-btn" onClick={() => {
                  const val = activity.trim();
                  if (!val) { alert('Type an activity first.'); return; }
                  if (!presets.includes(val)) onUpdatePresets([...presets, val]);
                }}>+ Save as preset</button>
              </div>
            </div>

            <div className="form-section">
              <div className="form-label">Add emoji</div>
              <div className="chip-strip">
                {EMOJIS.map(em => (
                  <button key={em} className="chip emoji-chip"
                    onClick={() => setActivity(a => a + em)}>{em}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-primary" onClick={doAdd}>+ Add entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const { activeUser } = useUser();
  const [state, setState]       = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [newMonthSel, setNewMonthSel] = useState('');

  // Reload data whenever the active user changes
  useEffect(() => {
    setHydrated(false);
    const now       = new Date();
    const realMonth = MONTHS[now.getMonth()];
    const key       = `pacepal_tracker_${activeUser}`;

    let loaded = EMPTY_STATE();
    const saved = localStorage.getItem(key);
    if (saved) {
      try { loaded = JSON.parse(saved); } catch (_) {}
    }

    if (!loaded.allMonths)       loaded.allMonths  = {};
    if (!loaded.presets?.length) loaded.presets    = [...DEFAULT_PRESETS];
    if (!loaded.goal)            loaded.goal       = 3;
    if (!loaded.previewMode)     loaded.previewMode = 'current';

    if (!loaded.allMonths[realMonth]?.length) {
      loaded.allMonths[realMonth] = [{
        id: Date.now(), number: Math.ceil(now.getDate() / 7), open: true, days: [],
      }];
    }

    setState(loaded);
    setHydrated(true);
  }, [activeUser]);

  // Save on every state change (only after hydration to avoid overwriting on load)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(`pacepal_tracker_${activeUser}`, JSON.stringify(state));
    }
  }, [state, hydrated, activeUser]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const trackedMonths = MONTHS.filter(m => state.allMonths[m]?.length > 0);
  const activeMonths  = trackedMonths.filter(m => state.allMonths[m].some(w => w.days.length > 0));
  const currentMonth  = activeMonths.length ? activeMonths[activeMonths.length - 1] : MONTHS[new Date().getMonth()];
  const unstarted     = MONTHS.filter(m => !state.allMonths[m]?.length);

  const defaultNewMonth = (() => {
    const last = trackedMonths[trackedMonths.length - 1];
    if (last) {
      const next = MONTHS[(MONTHS.indexOf(last) + 1) % 12];
      if (unstarted.includes(next)) return next;
    }
    return unstarted[0] || '';
  })();
  const effectiveNewMonth = (newMonthSel && unstarted.includes(newMonthSel)) ? newMonthSel : defaultNewMonth;

  const nextWeekNumber = (month: string) => {
    const mw = state.allMonths[month] || [];
    return mw.length ? Math.max(...mw.map(w => w.number)) + 1 : 1;
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateWeekDays = (month: string, wi: number, days: Entry[]) =>
    setState(s => {
      const months = { ...s.allMonths };
      const weeks  = [...months[month]]; weeks[wi] = { ...weeks[wi], days };
      months[month] = weeks;
      return { ...s, allMonths: months };
    });

  const deleteWeek = (month: string, wi: number) =>
    setState(s => {
      const months = { ...s.allMonths };
      const weeks  = [...months[month]]; weeks.splice(wi, 1);
      if (!weeks.length) delete months[month]; else months[month] = weeks;
      return { ...s, allMonths: months };
    });

  const toggleWeekOpen = (month: string, wi: number) =>
    setState(s => {
      const months  = { ...s.allMonths };
      const weeks   = [...months[month]]; weeks[wi] = { ...weeks[wi], open: !weeks[wi].open };
      months[month] = weeks;
      return { ...s, allMonths: months };
    });

  const addWeek = (month: string) =>
    setState(s => {
      const months  = { ...s.allMonths };
      months[month] = [...months[month], { id: Date.now(), number: nextWeekNumber(month), open: true, days: [] }];
      return { ...s, allMonths: months };
    });

  const addMonth = () => {
    const m   = effectiveNewMonth;
    const now = new Date();
    const wn  = MONTHS.indexOf(m) === now.getMonth() ? Math.ceil(now.getDate() / 7) : 1;
    setState(s => {
      const months = { ...s.allMonths };
      if (!months[m]) months[m] = [];
      months[m] = [...months[m], { id: Date.now(), number: wn, open: true, days: [] }];
      return { ...s, allMonths: months };
    });
    setNewMonthSel('');
  };

  // ── Preview ────────────────────────────────────────────────────────────────

  let rawPreview = '';
  if (activeMonths.length) {
    if (state.previewMode === 'history') {
      activeMonths.forEach(m => {
        rawPreview += m === currentMonth
          ? buildMonthText(m, state.allMonths, state.goal)
          : buildMonthSummaryLine(m, state.allMonths, state.goal);
      });
    } else {
      rawPreview = buildMonthText(currentMonth, state.allMonths, state.goal);
    }
  }

  const copyText = () => {
    navigator.clipboard.writeText(rawPreview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header>
        <div>
          <h1>💬 WhatsApp Tracker</h1>
          <div className="tracker-user-label">{`${activeUser}'s workouts`}</div>
        </div>
        <div className="pill-ctrl">
          <label htmlFor="goalSel">Goal</label>
          <select
            id="goalSel"
            value={state.goal}
            onChange={e => setState(s => ({ ...s, goal: +e.target.value }))}
          >
            {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days/wk</option>)}
          </select>
        </div>
      </header>

      <div className="layout">
        {/* Weeks panel */}
        <div>
          <div className="panel">
            <div className="panel-header"><span>Weeks</span></div>
            <div className="panel-body">
              {trackedMonths.map(month => {
                const weeks    = state.allMonths[month];
                const statuses = computeWeekStatuses(weeks, state.goal);
                const summary  = computeMonthSummary(weeks, statuses);
                return (
                  <div key={month}>
                    <div className="month-sep">
                      <span className="month-sep-title">{month}</span>
                      <span className="month-sep-line" />
                      {summary && (
                        <>
                          <span className={`month-sep-badge ${summary.allPassed ? 'met' : 'unmet'}`}>
                            {summary.allPassed ? '✅' : '❌'} {summary.passed}/{summary.total}
                          </span>
                          {summary.hasPerfect && (
                            <span style={{ fontSize: '1.1rem' }} title="Perfect week this month!">⭐</span>
                          )}
                        </>
                      )}
                    </div>

                    {weeks.map((week, wi) => (
                      <WeekCard
                        key={week.id}
                        week={week} localWi={wi} month={month}
                        status={statuses[wi]} goal={state.goal} presets={state.presets}
                        onUpdate={updateWeekDays} onDelete={deleteWeek} onToggleOpen={toggleWeekOpen}
                        onUpdatePresets={presets => setState(s => ({ ...s, presets }))}
                      />
                    ))}

                    <button className="add-week-btn" onClick={() => addWeek(month)}>
                      + Add week to {month}
                    </button>
                  </div>
                );
              })}

              {unstarted.length > 0 && (
                <div className="new-month-row">
                  <select value={effectiveNewMonth} onChange={e => setNewMonthSel(e.target.value)}>
                    {unstarted.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={addMonth}>
                    + New month
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="preview-sticky">
          <div className="panel">
            <div className="panel-header">
              <span>WhatsApp Preview</span>
              <div className="preview-header-btns">
                <button
                  className={`btn btn-ghost${state.previewMode === 'history' ? ' active' : ''}`}
                  onClick={() => setState(s => ({ ...s, previewMode: s.previewMode === 'current' ? 'history' : 'current' }))}
                >
                  {state.previewMode === 'current' ? '📚 History' : '📄 Current'}
                </button>
                <button className={`btn btn-primary copy-btn${copied ? ' copied' : ''}`} onClick={copyText}>
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {!activeMonths.length ? (
              <div className="preview-empty">Add some activities to see the preview</div>
            ) : (
              <div className="preview-text">
                {rawPreview.split('\n').map((line, i) => (
                  <span key={i} className="wa-line" dangerouslySetInnerHTML={{
                    __html: escHtml(line).replace(/\*([^*]+)\*/g, '<strong class="wa-bold">$1</strong>'),
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
