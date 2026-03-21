'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { loadUserData, saveUserData } from '@/lib/supabase';

function initials(name: string) { return name.slice(0, 2).toUpperCase(); }

function UserPhoto({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span style={{
        width: 48, height: 48, borderRadius: '50%', background: '#c8f135',
        color: '#000', fontWeight: 700, fontSize: '0.8rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{initials(name)}</span>
    );
  }
  return (
    <img
      src={`/${name.toLowerCase()}.jpg`}
      alt={name}
      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  );
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS      = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const DAY_SHORT: Record<string, string> = {
  MON:'Mo', TUE:'Tu', WED:'We', THU:'Th', FRI:'Fr', SAT:'Sa', SUN:'Su',
};
const EMOJIS    = ['🏋🏻‍♀️','🎾','🏐','🏃‍♀️','🚴‍♀️','🏊‍♀️','🧘‍♀️','🧖🏻‍♀️','⚽','🏀','🥊','🧠'];
const DURATIONS = ['30 min','40 min','45 min','1h','1h 15','1h 30','2h'];
const DEFAULT_PRESETS = [
  'gym 🏋🏻‍♀️',
  'workout A 🏋🏻‍♀',
  'workout B 🏋🏻‍♀',
  'workout C 🏋🏻‍♀',
  'padel Training 🎾',
  'padel 🎾',
  'beach training 🏖️🏐',
  'beach volleyball 🏐',
  'indoor volley 🏐',
  'beach 🏐',
  'friendly beach 🏖️',
  'leg workout with Zoja',
  'leg work out with Eliza',
  'core&Mobility 🧘🏻‍♀️',
  'spa wellness 🧖🏻‍♀️',
  'spa wellness with Eliza 🧖🏻‍♀️',
  'running 🏃‍♀️',
  'yoga 🧘‍♀️',
  'cycling 🚴‍♀️',
];

type Entry    = { day: string; activity: string };
type Week     = { id: number; number: number; open: boolean; days: Entry[] };
type AllMonths = Record<string, Week[]>;
type AppState  = { goal: number; allMonths: AllMonths; presets: string[]; previewMode: 'current' | 'history' };

const EMPTY_STATE = (): AppState => ({
  goal: 3, allMonths: {}, presets: [...DEFAULT_PRESETS], previewMode: 'current',
});

// ── Seed data (loaded on first use per user) ──────────────────────────────────
const SEED_DATA: Record<string, AppState> = {
  Eliza: {
    goal: 3, previewMode: 'current', presets: [...DEFAULT_PRESETS],
    allMonths: {
      March: [
        {
          id: 101, number: 1, open: false,
          days: [
            { day: 'MON', activity: '1h beach training 🏖️🏐' },
            { day: 'TUE', activity: '1h leg workout with Zoja' },
            { day: 'WED', activity: '1h workout A 🏋🏻‍♀' },
            { day: 'THU', activity: '1h workout C 🏋🏻‍♀' },
            { day: 'FRI', activity: '1h workout B 🏋🏻‍♀' },
            { day: 'SAT', activity: '2h friendly beach 🏖️' },
            { day: 'SAT', activity: '1h core&Mobility 🧘🏻‍♀️' },
            { day: 'SUN', activity: '2h padel' },
          ],
        },
        {
          id: 102, number: 2, open: false,
          days: [
            { day: 'TUE', activity: '1h Workout A 🏋🏻‍♀' },
            { day: 'WED', activity: '1h 30 indoor volley 🏐' },
            { day: 'SAT', activity: '1h workout B 🏋🏻‍♀' },
            { day: 'SUN', activity: '1h 30 padel 🎾' },
          ],
        },
        {
          id: 103, number: 3, open: true,
          days: [
            { day: 'MON', activity: '1h 30 beach training 🏖️' },
          ],
        },
      ],
    },
  },
  Zoja: {
    goal: 3, previewMode: 'current', presets: [...DEFAULT_PRESETS],
    allMonths: {
      March: [
        {
          id: 201, number: 1, open: false,
          days: [
            { day: 'TUE', activity: '1h leg work out with Eliza' },
            { day: 'WED', activity: '1h padel Training 🎾' },
            { day: 'FRI', activity: '1h gym 🏋🏻‍♀️' },
            { day: 'SAT', activity: '1h gym 🏋🏻‍♀️' },
          ],
        },
        {
          id: 202, number: 2, open: false,
          days: [
            { day: 'SAT', activity: '1h gym 🏋🏻‍♀️' },
            { day: 'SUN', activity: '1h gym 🏋🏻‍♀️' },
          ],
        },
        {
          id: 203, number: 3, open: true,
          days: [
            { day: 'MON', activity: '1h 15 gym 🏋🏻‍♀️' },
            { day: 'TUE', activity: '1h padel Training 🎾' },
            { day: 'TUE', activity: '1h beach 🏐' },
            { day: 'TUE', activity: '1h 30 padel 🎾' },
            { day: 'WED', activity: '1h gym 🏋🏻‍♀️' },
            { day: 'WED', activity: 'spa wellness with Eliza 🧖🏻‍♀️' },
          ],
        },
      ],
    },
  },
};

// ── Pure helpers ──────────────────────────────────────────────────────────────

function uniqueDays(week: Week) {
  return new Set(week.days.map(e => e.day)).size;
}

/**
 * Returns all Mon–Sun weeks that "belong" to this month:
 * a week belongs if it has MORE than 3 days inside the month.
 * Each entry is the full 7-day range (may spill into adjacent months).
 */
function getMonthWeeks(month: string): { start: Date; end: Date }[] {
  const monthIdx = MONTHS.indexOf(month);
  const year     = new Date().getFullYear();
  const mStart   = new Date(year, monthIdx, 1);
  const mEnd     = new Date(year, monthIdx + 1, 0);

  // Monday on or before the 1st
  const dow      = mStart.getDay();
  const daysBack = dow === 0 ? 6 : dow - 1;
  let mon        = new Date(year, monthIdx, 1 - daysBack);

  const result: { start: Date; end: Date }[] = [];
  while (mon <= mEnd) {
    const sun         = new Date(mon); sun.setDate(mon.getDate() + 6);
    const oStart      = new Date(Math.max(mon.getTime(), mStart.getTime()));
    const oEnd        = new Date(Math.min(sun.getTime(), mEnd.getTime()));
    const daysInMonth = Math.round((oEnd.getTime() - oStart.getTime()) / 86400000) + 1;
    if (daysInMonth > 3) result.push({ start: new Date(mon), end: new Date(sun) });
    mon = new Date(mon); mon.setDate(mon.getDate() + 7);
  }
  return result;
}

function weekDateRange(weekNum: number, month: string) {
  const weeks = getMonthWeeks(month);
  const w     = weeks[weekNum - 1];
  if (!w) return '';
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(w.start)} – ${fmt(w.end)}`;
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
  const passed     = statuses.filter((s, i) =>
    weeks[i].days.length > 0 && (s === 'completed' || s === 'compensated')).length;
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

function weeksInMonth(month: string): number {
  return getMonthWeeks(month).length;
}

function escHtml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function stripDuration(activity: string): string {
  for (const d of DURATIONS) {
    if (activity.startsWith(d + ' ')) return activity.slice(d.length + 1);
  }
  return activity;
}

function sortPresetsByFrequency(presets: string[], allMonths: AllMonths): string[] {
  const freq = new Map<string, number>(presets.map(p => [p, 0]));
  for (const weeks of Object.values(allMonths)) {
    for (const week of weeks) {
      for (const entry of week.days) {
        const base = stripDuration(entry.activity).toLowerCase();
        for (const p of presets) {
          if (base === p.toLowerCase()) { freq.set(p, (freq.get(p) ?? 0) + 1); break; }
        }
      }
    }
  }
  return [...presets].sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
}

// Parse duration string to minutes (e.g. "1h 30" → 90, "45 min" → 45)
function durationToMinutes(d: string): number {
  if (d.includes('min')) return parseInt(d) || 0;
  const parts = d.split('h');
  return (parseInt(parts[0]) || 0) * 60 + (parts[1] ? parseInt(parts[1].trim()) || 0 : 0);
}

function extractEntryMinutes(activity: string): number {
  for (const d of DURATIONS) {
    if (activity.startsWith(d + ' ') || activity === d) return durationToMinutes(d);
  }
  return 0;
}

// ── WeekCard ──────────────────────────────────────────────────────────────────

function WeekCard({ week, localWi, month, status, goal, presets, onUpdate, onDelete, onToggleOpen, onUpdatePresets }: {
  week: Week; localWi: number; month: string; status: string; goal: number; presets: string[];
  onUpdate: (month: string, wi: number, days: Entry[]) => void;
  onDelete: (month: string, wi: number) => void;
  onToggleOpen: (month: string, wi: number) => void;
  onUpdatePresets: (presets: string[]) => void;
}) {
  const [day, setDay]               = useState(DAYS[0]);
  const [activity, setActivity]     = useState('');
  const [duration, setDuration]     = useState<string | null>(null);
  const [durErrorKey, setDurErrorKey] = useState(0);
  const [durError, setDurError]     = useState(false);
  const [moreOpen, setMoreOpen]     = useState(false);
  const actRef    = useRef<HTMLInputElement>(null);
  const moreRef   = useRef<HTMLDivElement>(null);

  // Close "more presets" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [moreOpen]);

  const activeDays  = new Set(week.days.map(e => e.day));
  const days        = activeDays.size;
  const statusEmoji = (status === 'completed' || status === 'compensated') ? '✅' : status === 'failed' ? '❌' : '○';
  const progCls     = (status === 'completed' || status === 'compensated') ? 'met' : status === 'failed' ? 'unmet' : 'empty';

  const doAdd = () => {
    if (!activity.trim()) return;
    if (!duration) { setDurError(true); setDurErrorKey(k => k + 1); return; }
    onUpdate(month, localWi, [...week.days, { day, activity: `${duration} ${activity.trim()}` }]);
    setActivity(''); setDuration(null); setDurError(false);
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
        {/* Top row: title + meta */}
        <div className="week-header-top">
          <div className="week-title-group">
            <span className="status-badge">{statusEmoji}</span>
            <span className="week-name">Week {week.number}</span>
            <span className="week-dates">{weekDateRange(week.number, month)}</span>
          </div>
          <div className="week-meta">
            <button className="icon-btn del" data-action="del" title="Delete week">✕</button>
            <span className={`chevron ${week.open ? 'open' : ''}`}>▼</span>
          </div>
        </div>

        {/* Bottom row: day chips + progress */}
        <div className="week-header-bottom">
          <div className="day-chips">
            {DAYS.map(d => (
              <div key={d} className={`day-chip${activeDays.has(d) ? ' active' : ''}`}>
                <span className="day-chip-dot" />
                <span className="day-chip-label">{DAY_SHORT[d]}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`week-progress ${progCls}`}>{days}/{goal}</span>
            {status === 'compensated' && <span className="comp-note">comp</span>}
          </div>
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
            {/* Day & Activity */}
            <div className="form-section">
              <div className="form-label">Day &amp; activity</div>
              <div className="form-row">
                <select className="sel-day" value={day} onChange={e => setDay(e.target.value)}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
                <input
                  ref={actRef} className="inp-act" type="text"
                  placeholder="Type or tap a preset below…"
                  value={activity}
                  onChange={e => setActivity(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') doAdd(); }}
                />
              </div>
            </div>

            {/* Duration */}
            <div key={durErrorKey} className={`form-section${durError ? ' dur-error' : ''}`}>
              <div className="form-label">Duration</div>
              <div className="chip-strip">
                {DURATIONS.map(d => (
                  <button key={d} className={`chip${duration === d ? ' active' : ''}`}
                    onClick={() => { setDuration(d); setDurError(false); }}>{d}</button>
                ))}
              </div>
            </div>

            {/* Quick activities */}
            <div className="form-section">
              <div className="form-label">Quick activities</div>
              <div className="chip-strip">
                {presets.slice(0, 5).map((p, pi) => (
                  <button key={pi} className="chip" title="Right-click to remove"
                    onClick={() => { setActivity(p); actRef.current?.focus(); }}
                    onContextMenu={e => {
                      e.preventDefault();
                      if (confirm(`Remove preset "${p}"?`)) {
                        const next = [...presets]; next.splice(pi, 1); onUpdatePresets(next);
                      }
                    }}>{p}</button>
                ))}
                {presets.length > 5 && (
                  <div className="more-presets-wrap" ref={moreRef}>
                    <button
                      className={`chip more-presets-btn${moreOpen ? ' active' : ''}`}
                      onClick={() => setMoreOpen(o => !o)}
                    >···</button>
                    {moreOpen && (
                      <div className="more-presets-dropdown">
                        {presets.slice(5).map((p, pi) => (
                          <button key={pi} className="more-preset-item" title="Right-click to remove"
                            onClick={() => { setActivity(p); actRef.current?.focus(); setMoreOpen(false); }}
                            onContextMenu={e => {
                              e.preventDefault();
                              if (confirm(`Remove preset "${p}"?`)) {
                                const next = [...presets]; next.splice(5 + pi, 1); onUpdatePresets(next);
                              }
                            }}>{p}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button className="add-preset-btn" onClick={() => {
                  const val = activity.trim();
                  if (!val) { alert('Type an activity first.'); return; }
                  if (!presets.includes(val)) onUpdatePresets([...presets, val]);
                }}>+ Save as preset</button>
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

// ── MonthSection ─────────────────────────────────────────────────────────────
// Manages its own week-number input so each month tracks its own default

function MonthSection({ month, weeks, statuses, summary, goal, presets, onUpdateDays, onDeleteWeek, onToggleOpen, onUpdatePresets, onAddWeek }: {
  month: string;
  weeks: Week[];
  statuses: string[];
  summary: ReturnType<typeof computeMonthSummary>;
  goal: number;
  presets: string[];
  onUpdateDays: (month: string, wi: number, days: Entry[]) => void;
  onDeleteWeek: (month: string, wi: number) => void;
  onToggleOpen: (month: string, wi: number) => void;
  onUpdatePresets: (presets: string[]) => void;
  onAddWeek: (month: string, weekNum: number) => void;
}) {
  const maxWeek = weeksInMonth(month);
  const nextNum = weeks.length
    ? Math.min(Math.max(...weeks.map(w => w.number)) + 1, maxWeek)
    : 1;
  const [weekNum, setWeekNum] = useState(nextNum);

  // Keep default in sync as weeks are added/removed
  useEffect(() => {
    const next = weeks.length
      ? Math.min(Math.max(...weeks.map(w => w.number)) + 1, maxWeek)
      : 1;
    setWeekNum(next);
  }, [weeks.length, maxWeek]);

  return (
    <div>
      <div className="month-sep">
        <span className="month-sep-title">{month}</span>
        <span className="month-sep-line" />
        {summary && (
          <>
            <span className={`month-sep-badge ${summary.allPassed ? 'met' : 'unmet'}`}>
              {summary.allPassed ? '✅' : '❌'} {summary.passed}/{summary.total}
            </span>
            {summary.hasPerfect && (
              <span style={{ fontSize: '1rem' }} title="Perfect week!">⭐</span>
            )}
          </>
        )}
      </div>

      {weeks.map((week, wi) => (
        <WeekCard
          key={week.id}
          week={week} localWi={wi} month={month}
          status={statuses[wi]} goal={goal} presets={presets}
          onUpdate={onUpdateDays} onDelete={onDeleteWeek} onToggleOpen={onToggleOpen}
          onUpdatePresets={onUpdatePresets}
        />
      ))}

      <div className="add-week-row">
        <span className="add-week-label">Week</span>
        <input
          type="number"
          className="week-num-input"
          value={weekNum}
          min={1}
          max={maxWeek}
          onChange={e => setWeekNum(Math.min(maxWeek, Math.max(1, parseInt(e.target.value) || 1)))}
        />
        <button className="add-week-btn" onClick={() => onAddWeek(month, weekNum)}>
          + Add to {month}
        </button>
      </div>
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
  const loadedForUser = useRef('');

  // Reload data when user switches
  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    const now       = new Date();
    const realMonth = MONTHS[now.getMonth()];
    const key       = `pacepal_tracker_${activeUser}`;

    function applyDefaults(raw: AppState): AppState {
      const r = JSON.parse(JSON.stringify(raw)) as AppState; // deep clone — never mutate source
      if (!r.allMonths)   r.allMonths   = {};
      if (!r.goal)        r.goal        = 3;
      if (!r.previewMode) r.previewMode = 'current';
      const existing = r.presets ?? [];
      const existingSet = new Set(existing);
      r.presets = [...existing, ...DEFAULT_PRESETS.filter(p => !existingSet.has(p))];
      if (!r.allMonths[realMonth]?.length) {
        r.allMonths[realMonth] = [{
          id: Date.now(), number: Math.ceil(now.getDate() / 7), open: true, days: [],
        }];
      }
      return r;
    }

    // 1. Show localStorage immediately for instant load
    let local = EMPTY_STATE();
    const saved = localStorage.getItem(key);
    if (saved) { try { local = JSON.parse(saved); } catch (_) {} }
    const hasLocalActivity = Object.values(local.allMonths ?? {}).some(
      (weeks) => (weeks as Week[]).some(w => w.days.length > 0)
    );
    if (!hasLocalActivity && SEED_DATA[activeUser]) local = SEED_DATA[activeUser];
    if (!cancelled) {
      setState(applyDefaults(local));
      loadedForUser.current = activeUser;
      setHydrated(true);
    }

    // 2. Fetch from Supabase — cloud is source of truth
    loadUserData(activeUser).then(cloudRaw => {
      if (cancelled) return; // user switched away before this resolved
      if (!cloudRaw) return;
      const cloud = cloudRaw as AppState;
      const hasCloudActivity = Object.values(cloud.allMonths ?? {}).some(
        (weeks) => (weeks as Week[]).some(w => w.days.length > 0)
      );
      if (!hasCloudActivity && SEED_DATA[activeUser]) return;
      const merged = applyDefaults(cloud);
      setState(merged);
      localStorage.setItem(key, JSON.stringify(merged));
    });

    return () => { cancelled = true; };
  }, [activeUser]);

  useEffect(() => {
    // Only save when the loaded data actually belongs to the current user
    if (!hydrated || loadedForUser.current !== activeUser) return;
    const key = `pacepal_tracker_${activeUser}`;
    localStorage.setItem(key, JSON.stringify(state));
    saveUserData(activeUser, state);
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

  // ── Presets sorted by usage frequency ─────────────────────────────────────

  const sortedPresets = sortPresetsByFrequency(state.presets, state.allMonths);

  // ── Stats (current month) ──────────────────────────────────────────────────

  const statsWeeks   = state.allMonths[currentMonth] || [];
  const allEntries   = statsWeeks.flatMap(w => w.days);
  const totalMinutes = allEntries.reduce((sum, e) => sum + extractEntryMinutes(e.activity), 0);
  const totalHours   = totalMinutes / 60;
  const sessionCount = allEntries.length;
  const latestWeek   = [...statsWeeks].reverse().find(w => w.days.length > 0) ?? statsWeeks[statsWeeks.length - 1];
  const thisWeekDays = latestWeek ? uniqueDays(latestWeek) : 0;

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

  const addWeek = (month: string, weekNum: number) =>
    setState(s => {
      const months  = { ...s.allMonths };
      const newWeek = { id: Date.now(), number: weekNum, open: true, days: [] };
      months[month] = [...months[month], newWeek].sort((a, b) => a.number - b.number);
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

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(rawPreview)}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="tracker-header">
        <div className="tracker-header-user">
          <UserPhoto name={activeUser} />
          <div>
            <div className="tracker-title">💬 Workout Log</div>
            <div className="tracker-user-label">{`${activeUser}'s workouts`}</div>
          </div>
        </div>
        <div className="pill-ctrl">
          <label htmlFor="goalSel">Goal</label>
          <select id="goalSel" value={state.goal}
            onChange={e => setState(s => ({ ...s, goal: +e.target.value }))}>
            {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days/wk</option>)}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">
            {totalHours >= 1 ? totalHours.toFixed(1) : totalMinutes > 0 ? `${totalMinutes}m` : '—'}
          </div>
          <div className="stat-label">Hours this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sessionCount || '—'}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {thisWeekDays > 0 ? `${thisWeekDays}/${state.goal}` : '—'}
          </div>
          <div className="stat-label">This week</div>
        </div>
      </div>

      {/* Main layout */}
      <div className="tracker-layout">
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
                  <MonthSection
                    key={month}
                    month={month} weeks={weeks} statuses={statuses} summary={summary}
                    goal={state.goal} presets={sortedPresets}
                    onUpdateDays={updateWeekDays} onDeleteWeek={deleteWeek} onToggleOpen={toggleWeekOpen}
                    onUpdatePresets={presets => setState(s => ({ ...s, presets }))}
                    onAddWeek={addWeek}
                  />
                );
              })}

              {unstarted.length > 0 && (
                <div className="new-month-row">
                  <select value={effectiveNewMonth} onChange={e => setNewMonthSel(e.target.value)}>
                    {unstarted.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button className="btn btn-primary" style={{ fontSize: '0.82rem', minHeight: 40, padding: '0 14px' }} onClick={addMonth}>
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
              <div className="panel-header-btns">
                <button
                  className={`btn btn-ghost${state.previewMode === 'history' ? ' active' : ''}`}
                  style={{ minHeight: 32, padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setState(s => ({ ...s, previewMode: s.previewMode === 'current' ? 'history' : 'current' }))}
                >
                  {state.previewMode === 'current' ? '📚 History' : '📄 Current'}
                </button>
              </div>
            </div>

            <div style={{ padding: '14px' }}>
              {!activeMonths.length ? (
                <div className="preview-empty">Add some activities to see the preview</div>
              ) : (
                <div className="preview-box">
                  {rawPreview.split('\n').map((line, i) => (
                    <span key={i} className="wa-line" dangerouslySetInnerHTML={{
                      __html: escHtml(line).replace(/\*([^*]+)\*/g, '<strong class="wa-bold">$1</strong>'),
                    }} />
                  ))}
                </div>
              )}
            </div>

            {activeMonths.length > 0 && (
              <div className="preview-actions">
                <button className={`btn btn-copy${copied ? ' copied' : ''}`} onClick={copyText}>
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                >
                  📲 Share to WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
