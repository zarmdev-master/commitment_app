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

type Entry     = { day: string; activity: string; fromHevy?: boolean };
type Week      = { id: number; number: number; open: boolean; days: Entry[] };
type AllMonths = Record<string, Week[]>;
type AllYears  = Record<string, AllMonths>;
type AppState  = { goal: number; allYears: AllYears; presets: string[]; previewMode: 'current' | 'history'; hevyApiKey?: string; hevyImportedIds?: string[] };
type ActivityCategory = 'all' | 'padel' | 'gym' | 'beach-volley' | 'running' | 'other';

const CURRENT_YEAR = String(new Date().getFullYear());

const EMPTY_STATE = (): AppState => ({
  goal: 3, allYears: {}, presets: [...DEFAULT_PRESETS], previewMode: 'current',
});

// ── Seed data (loaded on first use per user) ──────────────────────────────────
const SEED_DATA: Record<string, AppState> = {
  Eliza: {
    goal: 3, previewMode: 'current', presets: [...DEFAULT_PRESETS],
    allYears: { [CURRENT_YEAR]: {
      March: [
        { id: 101, number: 1, open: false, days: [
            { day: 'MON', activity: '1h beach training 🏖️🏐' },
            { day: 'TUE', activity: '1h leg workout with Zoja' },
            { day: 'WED', activity: '1h workout A 🏋🏻‍♀' },
            { day: 'THU', activity: '1h workout C 🏋🏻‍♀' },
            { day: 'FRI', activity: '1h workout B 🏋🏻‍♀' },
            { day: 'SAT', activity: '2h friendly beach 🏖️' },
            { day: 'SAT', activity: '1h core&Mobility 🧘🏻‍♀️' },
            { day: 'SUN', activity: '2h padel' },
        ]},
        { id: 102, number: 2, open: false, days: [
            { day: 'TUE', activity: '1h Workout A 🏋🏻‍♀' },
            { day: 'WED', activity: '1h 30 indoor volley 🏐' },
            { day: 'SAT', activity: '1h workout B 🏋🏻‍♀' },
            { day: 'SUN', activity: '1h 30 padel 🎾' },
        ]},
        { id: 103, number: 3, open: true, days: [
            { day: 'MON', activity: '1h 30 beach training 🏖️' },
        ]},
      ],
    }},
  },
  Zoja: {
    goal: 3, previewMode: 'current', presets: [...DEFAULT_PRESETS],
    allYears: { [CURRENT_YEAR]: {
      March: [
        { id: 201, number: 1, open: false, days: [
            { day: 'TUE', activity: '1h leg work out with Eliza' },
            { day: 'WED', activity: '1h padel Training 🎾' },
            { day: 'FRI', activity: '1h gym 🏋🏻‍♀️' },
            { day: 'SAT', activity: '1h gym 🏋🏻‍♀️' },
        ]},
        { id: 202, number: 2, open: false, days: [
            { day: 'SAT', activity: '1h gym 🏋🏻‍♀️' },
            { day: 'SUN', activity: '1h gym 🏋🏻‍♀️' },
        ]},
        { id: 203, number: 3, open: true, days: [
            { day: 'MON', activity: '1h 15 gym 🏋🏻‍♀️' },
            { day: 'TUE', activity: '1h padel Training 🎾' },
            { day: 'TUE', activity: '1h beach 🏐' },
            { day: 'TUE', activity: '1h 30 padel 🎾' },
            { day: 'WED', activity: '1h gym 🏋🏻‍♀️' },
            { day: 'WED', activity: 'spa wellness with Eliza 🧖🏻‍♀️' },
        ]},
      ],
    }},
  },
};

// ── Seed week ID ownership — used to detect cross-user contamination ──────────
const SEED_WEEK_IDS: Record<string, Set<number>> = {
  Eliza: new Set([101, 102, 103]),
  Zoja:  new Set([201, 202, 203]),
};

function isContaminated(data: AppState, user: string): boolean {
  const allIds = Object.values(data.allYears ?? {}).flatMap(months =>
    Object.values(months).flatMap(weeks => (weeks as Week[]).map(w => w.id))
  );
  return Object.entries(SEED_WEEK_IDS).some(
    ([owner, ids]) => owner !== user && allIds.some(id => ids.has(id))
  );
}

const CATEGORY_KEYWORDS: Record<Exclude<ActivityCategory, 'all' | 'other'>, string[]> = {
  'padel':        ['padel', 'americano'],
  'gym':          ['gym', 'workout', 'work out', 'leg work', 'legs', 'push', 'pull',
                   'couples gym', 'home exercising', 'lady boss', 'ladyboss', 'core', 'mobility'],
  'beach-volley': ['beach', 'volley'],
  'running':      ['running', 'jogging', 'run'],
};

function getActivityCategory(activity: string): ActivityCategory {
  const base = stripDuration(activity).toLowerCase();
  if (/padel|americano/.test(base)) return 'padel';
  if (/gym|workout|work.?out|leg.?work|legs\b|push|pull|couples.?gym|home.?exerci|lady.?boss|core\b|mobility/.test(base)) return 'gym';
  if (/beach|volley/.test(base)) return 'beach-volley';
  if (/running|jogging/.test(base)) return 'running';
  return 'other';
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function mergeAllMonths(local: AllMonths, cloud: AllMonths): AllMonths {
  const result: AllMonths = { ...cloud };
  for (const month of Object.keys(local)) {
    const lDays = local[month].reduce((s, w) => s + w.days.length, 0);
    const cDays = (cloud[month] ?? []).reduce((s, w) => s + w.days.length, 0);
    if (lDays > cDays) result[month] = local[month];
  }
  return result;
}

function mergeAllYears(local: AllYears, cloud: AllYears): AllYears {
  const result: AllYears = { ...cloud };
  for (const year of Object.keys(local)) {
    result[year] = mergeAllMonths(local[year] || {}, cloud[year] || {});
  }
  return result;
}

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
  // strip custom duration token (e.g. "1h 45 ", "90 min ")
  const m = activity.match(/^(\d+h\s*\d*|\d+\s*min)\s+/i);
  if (m) return activity.slice(m[0].length);
  return activity;
}

function sortPresetsByFrequency(presets: string[], allYears: AllYears): string[] {
  const freq = new Map<string, number>(presets.map(p => [p, 0]));
  const allMonths = Object.values(allYears).reduce((acc, m) => ({ ...acc, ...m }), {} as AllMonths);
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

// Convert minutes to display string (e.g. 75 → "1h 15", 45 → "45 min")
function minutesToDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}`;
}

function extractEntryMinutes(activity: string): number {
  for (const d of DURATIONS) {
    if (activity.startsWith(d + ' ') || activity === d) return durationToMinutes(d);
  }
  // handle custom duration token at start of activity
  const m = activity.match(/^(\d+h\s*\d*|\d+\s*min)/i);
  if (m) return durationToMinutes(m[1].trim());
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
  const [customDurInput, setCustomDurInput] = useState('');
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
    setActivity(''); setDuration(null); setCustomDurInput(''); setDurError(false);
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
              {[...week.days]
                .map((entry, origIdx) => ({ entry, origIdx }))
                .sort((a, b) => DAYS.indexOf(a.entry.day) - DAYS.indexOf(b.entry.day))
                .map(({ entry, origIdx }) => (
                <div key={origIdx} className="day-entry">
                  <span className={`day-badge${entry.fromHevy ? ' day-badge-hevy' : ''}`} title={entry.fromHevy ? 'Imported from Hevy' : undefined}>{entry.day}</span>
                  <span className="activity-text">{entry.activity}</span>
                  <button className="icon-btn del" title="Remove" onClick={() => {
                    const next = [...week.days]; next.splice(origIdx, 1); onUpdate(month, localWi, next);
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
                    onClick={() => { setDuration(d); setCustomDurInput(''); setDurError(false); }}>{d}</button>
                ))}
                <input
                  className={`chip chip-custom-input${duration && !DURATIONS.includes(duration) ? ' active' : ''}`}
                  placeholder="min"
                  inputMode="numeric"
                  value={customDurInput}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCustomDurInput(val);
                    const mins = parseInt(val);
                    if (mins > 0) { setDuration(minutesToDuration(mins)); setDurError(false); }
                    else setDuration(null);
                  }}
                  onBlur={() => {
                    const mins = parseInt(customDurInput);
                    if (mins > 0) { const fmt = minutesToDuration(mins); setCustomDurInput(fmt); setDuration(fmt); }
                    else { setCustomDurInput(''); setDuration(null); }
                  }}
                />
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

// ── Month overview card ───────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  all: 'All', padel: 'Padel', gym: 'Gym', 'beach-volley': 'Beach Volley', running: 'Running', other: 'Other',
};

function MonthOverviewCard({ month, weeks, statuses, goal, filters }: {
  month: string; weeks: Week[]; statuses: string[]; goal: number; filters: ActivityCategory[];
}) {
  const isAllSelected = filters.includes('all');
  const filteredEntries = weeks.flatMap(w => w.days).filter(
    e => isAllSelected || filters.includes(getActivityCategory(e.activity))
  );
  const mins      = filteredEntries.reduce((s, e) => s + extractEntryMinutes(e.activity), 0);
  const sessions  = filteredEntries.length;
  const hours     = mins / 60;
  const avgMins   = sessions > 0 ? Math.round(mins / sessions) : 0;
  const summary   = computeMonthSummary(weeks, statuses);
  const hasPerfect = weeks.some(w => uniqueDays(w) === 7);
  const passedIcon = summary ? (summary.allPassed ? '✅' : '❌') : null;

  return (
    <div className="month-ov-card">
      <div className="month-ov-header">
        <span className="month-ov-name">{month}</span>
        <span className="month-ov-badge">
          {summary ? `${summary.passed}/${summary.total}` : '—'}
          {passedIcon && <span style={{ marginLeft: 4 }}>{passedIcon}</span>}
          {hasPerfect && <span style={{ marginLeft: 4 }}>⭐</span>}
        </span>
      </div>

      {/* Dot grid */}
      <div className="month-ov-grid">
        <div className="month-ov-days-header">
          {DAYS.map(d => <span key={d} className="month-ov-day-lbl">{DAY_SHORT[d]}</span>)}
          <span className="month-ov-day-lbl" />
        </div>
        {weeks.map((week, wi) => {
          const s = statuses[wi];
          const isPerfect = uniqueDays(week) === 7;
          const wIcon = isPerfect ? '⭐' : s === 'completed' ? '✅' : s === 'compensated' ? '☑️' : s === 'failed' ? '❌' : '○';
          return (
            <div key={week.id} className={`month-ov-row${isPerfect ? ' month-ov-row-perfect' : ''}`}>
              {DAYS.map(d => {
                const count = week.days.filter(
                  e => e.day === d && (isAllSelected || filters.includes(getActivityCategory(e.activity)))
                ).length;
                const filled = isAllSelected
                  ? week.days.some(e => e.day === d)
                  : count > 0;
                return (
                  <span
                    key={d}
                    className={filled && isPerfect ? 'ov-dot-star' : `ov-dot${filled ? ' ov-dot-filled' : ''}`}
                    title={count > 0 ? `${count} session${count > 1 ? 's' : ''}` : undefined}
                  />
                );
              })}
              <span className="month-ov-wk-status">{wIcon}</span>
            </div>
          );
        })}
      </div>

      <div className="month-ov-stats">
        <span>{sessions} sessions</span>
        <span className="ov-sep">·</span>
        <span>{hours >= 1 ? hours.toFixed(1) + 'h' : mins > 0 ? mins + 'min' : '—'}</span>
        <span className="ov-sep">·</span>
        <span>avg {avgMins > 0 ? avgMins + 'min' : '—'}</span>
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ allYears, goal }: { allYears: AllYears; goal: number }) {
  const availableYears = Object.keys(allYears).sort().reverse();
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || CURRENT_YEAR);
  const [filters, setFilters] = useState<ActivityCategory[]>(['all']);
  const [showKeywords, setShowKeywords] = useState(false);

  const allMonths    = allYears[selectedYear] || {};
  const activeMonths = MONTHS.filter(m => (allMonths[m] || []).some(w => w.days.length > 0));

  const isAllSelected = filters.includes('all');

  const toggleFilter = (cat: ActivityCategory) => {
    if (cat === 'all') { setFilters(['all']); return; }
    setFilters((prev: ActivityCategory[]) => {
      const without = prev.filter((f: ActivityCategory) => f !== 'all' && f !== cat);
      const adding  = !prev.includes(cat);
      const next    = adding ? [...without, cat] : without;
      return next.length === 0 ? ['all'] : next;
    });
  };

  const filterEntries = (entries: Entry[]) =>
    isAllSelected ? entries : entries.filter(e => filters.includes(getActivityCategory(e.activity)));

  const yearEntries  = activeMonths.flatMap(m => (allMonths[m] || []).flatMap(w => filterEntries(w.days)));
  const yearMins     = yearEntries.reduce((s, e) => s + extractEntryMinutes(e.activity), 0);
  const yearHours    = yearMins / 60;
  const yearSessions = yearEntries.length;
  const avgSession   = yearSessions > 0 ? Math.round(yearMins / yearSessions) : 0;

  if (!activeMonths.length) {
    return <div className="overview-empty">No activity yet — start logging your workouts to see the overview.</div>;
  }

  return (
    <div className="overview-container">
      {/* Controls row: year + activity filter */}
      <div className="overview-controls">
        {availableYears.length > 1 ? (
          <select className="overview-year-sel" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        ) : (
          <span className="overview-year-label">{selectedYear}</span>
        )}
        <div className="overview-filter-chips">
          {(Object.keys(CATEGORY_LABELS) as ActivityCategory[]).map(cat => (
            <button
              key={cat}
              className={`chip${(cat === 'all' ? isAllSelected : filters.includes(cat)) ? ' active' : ''}`}
              onClick={() => toggleFilter(cat)}
            >{CATEGORY_LABELS[cat]}</button>
          ))}
          <button
            className={`chip overview-kw-btn${showKeywords ? ' active' : ''}`}
            onClick={() => setShowKeywords(v => !v)}
            title="Show keyword mapping"
          >ⓘ</button>
        </div>
      </div>

      {showKeywords && (
        <div className="overview-kw-panel">
          {(Object.entries(CATEGORY_KEYWORDS) as [Exclude<ActivityCategory, 'all' | 'other'>, string[]][]).map(([cat, kws]) => (
            <div key={cat} className="overview-kw-row">
              <span className="overview-kw-cat">{CATEGORY_LABELS[cat]}</span>
              <span className="overview-kw-list">{kws.join(', ')}</span>
            </div>
          ))}
          <div className="overview-kw-row">
            <span className="overview-kw-cat">{CATEGORY_LABELS['other']}</span>
            <span className="overview-kw-list">everything else</span>
          </div>
        </div>
      )}

      {/* Year strip */}
      <div className="overview-year-strip">
        {MONTHS.map(m => {
          const weeks = allMonths[m] || [];
          const hasData = weeks.some(w => w.days.length > 0);
          if (!hasData) return (
            <div key={m} className="year-strip-month year-strip-empty">
              <span className="year-strip-name">{m.slice(0, 3)}</span>
              <span className="year-strip-dot" />
            </div>
          );
          const statuses  = computeWeekStatuses(weeks, goal);
          const summary   = computeMonthSummary(weeks, statuses);
          const allPassed = summary?.allPassed ?? false;
          return (
            <div key={m} className={`year-strip-month${allPassed ? ' year-strip-ok' : ' year-strip-miss'}`}>
              <span className="year-strip-name">{m.slice(0, 3)}</span>
              <span className="year-strip-dot year-strip-dot-filled" />
              <span className="year-strip-fraction">{summary ? `${summary.passed}/${summary.total}` : ''}</span>
            </div>
          );
        })}
      </div>

      {/* Year totals */}
      <div className="overview-totals">
        <div className="ov-total-item">
          <span className="ov-total-val">{activeMonths.length}</span>
          <span className="ov-total-lbl">months</span>
        </div>
        <div className="ov-total-item">
          <span className="ov-total-val">{yearSessions || '—'}</span>
          <span className="ov-total-lbl">sessions</span>
        </div>
        <div className="ov-total-item">
          <span className="ov-total-val">{yearHours >= 1 ? yearHours.toFixed(1) + 'h' : yearMins > 0 ? yearMins + 'min' : '—'}</span>
          <span className="ov-total-lbl">total time</span>
        </div>
        <div className="ov-total-item">
          <span className="ov-total-val">{avgSession > 0 ? avgSession + 'min' : '—'}</span>
          <span className="ov-total-lbl">avg session</span>
        </div>
      </div>

      {/* Monthly cards */}
      <div className="overview-months-grid">
        {activeMonths.map(m => (
          <MonthOverviewCard
            key={m} month={m}
            weeks={allMonths[m] || []}
            statuses={computeWeekStatuses(allMonths[m] || [], goal)}
            goal={goal} filters={filters}
          />
        ))}
      </div>
    </div>
  );
}

// ── Hevy helpers ─────────────────────────────────────────────────────────────

type HevySet      = { index: number; weight_kg: number | null; reps: number | null };
type HevyExercise = { index: number; title: string; sets: HevySet[] };
type HevyWorkout  = { id: string; title: string; description?: string; start_time: string; end_time: string; exercises: HevyExercise[] };
type HevyResponse = { page: number; page_count: number; workouts: HevyWorkout[] };
type ImportItem   = { year: string; month: string; weekNum: number; entry: Entry };

const JS_DAY: Record<number, string> = { 0:'SUN',1:'MON',2:'TUE',3:'WED',4:'THU',5:'FRI',6:'SAT' };

function findWeekNumForDate(date: Date): { month: string; weekNum: number; year: string } {
  // Find the Mon–Sun week that contains this date
  const dow       = date.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon       = new Date(date); mon.setDate(date.getDate() + daysToMon);
  const sun       = new Date(mon);  sun.setDate(mon.getDate() + 6);

  // The week belongs to whichever month contains > 3 of its days —
  // the same rule used by getMonthWeeks(). Check the month of Monday
  // and the month of Sunday (a week spans at most two calendar months).
  const seen = new Set<string>();
  const candidates = [mon, sun].filter(d => {
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  for (const edge of candidates) {
    const candYear  = edge.getFullYear();
    const monthIdx  = edge.getMonth();
    const mStart    = new Date(candYear, monthIdx, 1);
    const mEnd      = new Date(candYear, monthIdx + 1, 0);
    const oStart    = new Date(Math.max(mon.getTime(), mStart.getTime()));
    const oEnd      = new Date(Math.min(sun.getTime(), mEnd.getTime()));
    if (oStart > oEnd) continue;
    const daysInMonth = Math.round((oEnd.getTime() - oStart.getTime()) / 86400000) + 1;
    if (daysInMonth <= 3) continue;

    // This month owns the week — find which week number it is
    const month  = MONTHS[monthIdx];
    const year   = String(candYear);
    const firstDow  = mStart.getDay();
    const firstBack = firstDow === 0 ? 6 : firstDow - 1;
    let curMon   = new Date(candYear, monthIdx, 1 - firstBack);
    let weekNum  = 1;
    while (curMon <= mEnd) {
      const curSun = new Date(curMon); curSun.setDate(curMon.getDate() + 6);
      const oS = new Date(Math.max(curMon.getTime(), mStart.getTime()));
      const oE = new Date(Math.min(curSun.getTime(), mEnd.getTime()));
      const days = oS <= oE ? Math.round((oE.getTime() - oS.getTime()) / 86400000) + 1 : 0;
      if (days > 3) {
        if (date >= curMon && date <= curSun) return { month, weekNum, year };
        weekNum++;
      }
      curMon = new Date(curMon); curMon.setDate(curMon.getDate() + 7);
    }
  }

  // Fallback (should not normally be reached)
  return { month: MONTHS[date.getMonth()], weekNum: Math.ceil(date.getDate() / 7), year: String(date.getFullYear()) };
}

function isWorkoutInLog(w: HevyWorkout, allYears: AllYears): boolean {
  const { year, month, weekNum, entry } = hevyWorkoutToImport(w);
  return allYears[year]?.[month]
    ?.find(wk => wk.number === weekNum)
    ?.days.some(e => e.day === entry.day && e.activity === entry.activity)
    ?? false;
}

function hevyWorkoutToImport(w: HevyWorkout): ImportItem {
  const start    = new Date(w.start_time);
  const end      = new Date(w.end_time);
  const mins     = Math.round((end.getTime() - start.getTime()) / 60000);
  const dur      = minutesToDuration(Math.max(mins, 1));
  const dayCode  = JS_DAY[start.getDay()] ?? 'MON';
  const titleBase = w.title?.trim() || '';
  const combined  = (titleBase + ' ' + (w.description || '')).toLowerCase();
  const isRunning = /\brun(ning)?\b|\bjogging\b/.test(combined);
  const label     = isRunning
    ? (titleBase ? `${titleBase} 🏃‍♀️` : 'running 🏃‍♀️')
    : (titleBase ? `${titleBase} 🏋🏻‍♀️` : 'gym 🏋🏻‍♀️');
  const activity  = `${dur} ${label}`;
  const { month, weekNum, year } = findWeekNumForDate(start);
  return { year, month, weekNum, entry: { day: dayCode, activity, fromHevy: true } };
}

// ── HevyTab ───────────────────────────────────────────────────────────────────

function HevyTab({ activeUser, allYears, apiKey, importedIds: importedIdsProp, onImport, onSaveApiKey, onDisconnect, onMarkImported }: {
  activeUser: string;
  allYears: AllYears;
  apiKey: string;
  importedIds: string[];
  onImport: (items: ImportItem[]) => void;
  onSaveApiKey: (key: string) => void;
  onDisconnect: () => void;
  onMarkImported: (ids: string[]) => void;
}) {
  const importedIds = new Set(importedIdsProp);

  const [keyInput,   setKeyInput]   = useState('');
  const [workouts,   setWorkouts]   = useState<HevyWorkout[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [lastSync,   setLastSync]   = useState('');
  const [importing,  setImporting]  = useState<Set<string>>(new Set());
  const [missingIds, setMissingIds] = useState<Set<string>>(new Set());

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    onSaveApiKey(k);
    setKeyInput('');
    setError('');
  };

  const disconnect = () => {
    onDisconnect();
    setWorkouts([]);
    setError('');
  };

  const markImported = (ids: string[]) => {
    onMarkImported(ids);
  };

  const syncWorkouts = async (key: string = apiKey) => {
    if (!key) return;
    setLoading(true); setError('');
    try {
      let all: HevyWorkout[] = [];
      const cutoff = new Date('2025-12-29').getTime();
      let page = 1;
      while (true) {
        const res  = await fetch(`/api/hevy?page=${page}&pageSize=10`, {
          headers: { 'x-hevy-api-key': key },
        });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({ error: 'Hevy error' }));
          setError(msg.error || `Error ${res.status}`);
          break;
        }
        const data: HevyResponse = await res.json();
        const filtered = (data.workouts || []).filter(
          w => new Date(w.start_time).getTime() >= cutoff
        );
        all = [...all, ...filtered];
        if (page >= data.page_count || filtered.length < (data.workouts || []).length) break;
        page++;
      }
      // Sort newest first
      all.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      setWorkouts(all);
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      // Compute which previously-imported workouts are now missing from the log
      const nowMissing = new Set<string>();
      for (const w of all) {
        if (!importedIds.has(w.id)) continue;
        const { year, month, weekNum, entry } = hevyWorkoutToImport(w);
        const exists = allYears[year]?.[month]
          ?.find(wk => wk.number === weekNum)
          ?.days.some(e => e.day === entry.day && e.activity === entry.activity)
          ?? false;
        if (!exists) nowMissing.add(w.id);
      }
      setMissingIds(nowMissing);
    } catch (e) {
      setError('Failed to reach Hevy. Check your key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const importOne = (w: HevyWorkout) => {
    setImporting(prev => new Set([...prev, w.id]));
    const item = hevyWorkoutToImport(w);
    onImport([item]);
    markImported([w.id]);
    setMissingIds((prev: Set<string>) => { const n = new Set(prev); n.delete(w.id); return n; });
    setTimeout(() => setImporting(prev => { const n = new Set(prev); n.delete(w.id); return n; }), 400);
  };

  const isImported = (w: HevyWorkout) => importedIds.has(w.id) || isWorkoutInLog(w, allYears);

  const importAllNew = () => {
    const newOnes = workouts.filter(w => !isImported(w));
    const items   = newOnes.map(hevyWorkoutToImport);
    onImport(items);
    markImported(newOnes.map(w => w.id));
  };

  const newCount = workouts.filter(w => !isImported(w)).length;

  return (
    <div className="hevy-tab">
      <div className="hevy-header">
        <span className="hevy-logo">🏋🏻</span>
        <div>
          <div className="hevy-title">Hevy Integration</div>
          <div className="hevy-subtitle">Sync completed workouts from your Hevy account</div>
        </div>
      </div>

      {!apiKey ? (
        <div className="hevy-connect-box">
          <p className="hevy-connect-info">
            Enter your Hevy API key to sync workouts. Get it at{' '}
            <strong>hevy.com/settings → Developer</strong> (requires Hevy Pro).
          </p>
          <div className="hevy-key-row">
            <input
              className="hevy-key-input"
              type="password"
              placeholder="Paste API key…"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
            />
            <button className="btn btn-primary" onClick={saveKey} disabled={!keyInput.trim()}>
              Connect
            </button>
          </div>
          {error && <div className="hevy-error">{error}</div>}
        </div>
      ) : (
        <>
          <div className="hevy-status-row">
            <span className="hevy-connected-badge">● Connected</span>
            {lastSync && <span className="hevy-last-sync">Last sync: {lastSync}</span>}
            <div style={{ flex: 1 }} />
            <button className="btn btn-ghost" style={{ fontSize: '0.78rem' }} onClick={() => syncWorkouts()} disabled={loading}>
              {loading ? '⏳ Syncing…' : '↻ Sync'}
            </button>
            <button className="btn btn-ghost" style={{ fontSize: '0.78rem', color: 'var(--muted)' }} onClick={disconnect}>
              Disconnect
            </button>
          </div>

          {error && <div className="hevy-error">{error}</div>}

          {workouts.length === 0 && !loading && (
            <div className="hevy-empty">
              {lastSync ? 'No workouts found in the last 90 days.' : 'Press Sync to load your recent workouts.'}
            </div>
          )}

          {workouts.length > 0 && (
            <>
              <div className="hevy-list-header">
                <span>{workouts.length} workouts · last 90 days</span>
                {newCount > 0 && (
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem', minHeight: 34 }} onClick={importAllNew}>
                    Import all new ({newCount})
                  </button>
                )}
              </div>
              <div className="hevy-list">
                {workouts.map(w => {
                  const start     = new Date(w.start_time);
                  const end       = new Date(w.end_time);
                  const mins      = Math.round((end.getTime() - start.getTime()) / 60000);
                  const dur       = minutesToDuration(Math.max(mins, 1));
                  const dateStr   = start.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
                  const imported  = isImported(w);
                  const beingImported = importing.has(w.id);
                  const item      = hevyWorkoutToImport(w);
                  const missing = missingIds.has(w.id);
                  return (
                    <div key={w.id} className={`hevy-workout-row${imported && !missing ? ' hevy-imported' : ''}`}>
                      <div className="hevy-workout-info">
                        <span className="hevy-workout-date">{dateStr}</span>
                        <span className="hevy-workout-title">{w.title || 'Workout'}</span>
                        <span className="hevy-workout-dur">{dur}</span>
                        <span className="hevy-workout-dest">{item.month} · Week {item.weekNum} · {item.entry.day}</span>
                      </div>
                      <button
                        className={`hevy-import-btn${missing ? ' missing' : imported ? ' done' : ''}`}
                        onClick={() => importOne(w)}
                        disabled={beingImported}
                        title={missing ? 'Entry was deleted — click to re-import' : imported ? 'Click to re-import' : undefined}
                      >
                        {beingImported ? '…' : missing ? '↻ Re-import' : imported ? '✓ Done' : 'Import'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
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
  const [activeTab, setActiveTab] = useState<'log' | 'overview' | 'hevy'>('log');
  const loadedForUser = useRef('');
  const cloudSyncedRef = useRef(false);

  // Reload data when user switches
  useEffect(() => {
    let cancelled = false;
    cloudSyncedRef.current = false;
    setHydrated(false);
    const now       = new Date();
    const realMonth = MONTHS[now.getMonth()];
    const key       = `pacepal_tracker_${activeUser}`;

    function applyDefaults(raw: AppState): AppState {
      const r = JSON.parse(JSON.stringify(raw)) as AppState & { allMonths?: AllMonths };
      // Migrate old allMonths format → allYears
      if (r.allMonths && !r.allYears) {
        r.allYears = { [CURRENT_YEAR]: r.allMonths };
        delete r.allMonths;
      }
      if (!r.allYears)    r.allYears    = {};
      if (!r.goal)        r.goal        = 3;
      if (!r.previewMode) r.previewMode = 'current';
      const existing = r.presets ?? [];
      const existingSet = new Set(existing);
      r.presets = [...existing, ...DEFAULT_PRESETS.filter(p => !existingSet.has(p))];
      // Migrate Hevy API key and imported IDs from localStorage → state (one-time)
      if (!r.hevyApiKey) {
        const lsKey = localStorage.getItem(`pacepal_hevy_key_${activeUser}`);
        if (lsKey) r.hevyApiKey = lsKey;
      }
      if (!r.hevyImportedIds?.length) {
        try {
          const lsIds = JSON.parse(localStorage.getItem(`pacepal_hevy_imported_${activeUser}`) || '[]') as string[];
          if (lsIds.length) r.hevyImportedIds = lsIds;
        } catch (_) {}
      }
      if (!r.allYears[CURRENT_YEAR]) r.allYears[CURRENT_YEAR] = {};
      if (!r.allYears[CURRENT_YEAR][realMonth]?.length) {
        r.allYears[CURRENT_YEAR][realMonth] = [{
          id: Date.now(), number: Math.ceil(now.getDate() / 7), open: true, days: [],
        }];
      }
      return r;
    }

    // 1. Show localStorage immediately for instant load
    let local = EMPTY_STATE();
    const saved = localStorage.getItem(key);
    if (saved) { try { local = JSON.parse(saved); } catch (_) {} }
    // If data was contaminated by another user's records, wipe it and reseed
    if (isContaminated(local, activeUser)) {
      localStorage.removeItem(key);
      local = EMPTY_STATE();
    }
    const anyWeeksHaveData = (data: unknown) => {
      const d = data as Record<string, unknown>;
      const fromYears = Object.values((d.allYears ?? {}) as Record<string, Record<string, Week[]>>)
        .flatMap(m => Object.values(m)).some(w => w.some(e => e.days.length > 0));
      const fromMonths = Object.values((d.allMonths ?? {}) as Record<string, Week[]>)
        .some(w => w.some(e => e.days.length > 0));
      return fromYears || fromMonths;
    };
    if (!anyWeeksHaveData(local) && SEED_DATA[activeUser]) local = SEED_DATA[activeUser];
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
      // Ignore cloud data that was contaminated by another user's records
      if (isContaminated(cloud, activeUser)) return;
      const hasCloudActivity = anyWeeksHaveData(cloud);
      if (!hasCloudActivity && SEED_DATA[activeUser]) return;
      cloudSyncedRef.current = true;
      setState((prev: AppState) => {
        const base = applyDefaults(cloud);
        base.allYears = mergeAllYears(prev.allYears, base.allYears);
        return base;
      });
    }).catch(() => { cloudSyncedRef.current = true; });

    return () => { cancelled = true; };
  }, [activeUser]);

  useEffect(() => {
    // Only save when the loaded data actually belongs to the current user
    if (!hydrated || loadedForUser.current !== activeUser) return;
    const key = `pacepal_tracker_${activeUser}`;
    localStorage.setItem(key, JSON.stringify(state));
    // Only push to Supabase after cloud data has been processed — prevents
    // stale localStorage from overwriting a newer cloud record on initial load
    if (cloudSyncedRef.current) saveUserData(activeUser, state);
  }, [state, hydrated, activeUser]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const curYearMonths = state.allYears[CURRENT_YEAR] || {};
  const trackedMonths = MONTHS.filter(m => curYearMonths[m]?.length > 0);
  const activeMonths  = trackedMonths.filter(m => curYearMonths[m].some(w => w.days.length > 0));
  const currentMonth  = activeMonths.length ? activeMonths[activeMonths.length - 1] : MONTHS[new Date().getMonth()];
  const unstarted     = MONTHS.filter(m => !curYearMonths[m]?.length);

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
    const mw = curYearMonths[month] || [];
    return mw.length ? Math.max(...mw.map(w => w.number)) + 1 : 1;
  };

  // ── Presets sorted by usage frequency ─────────────────────────────────────

  const sortedPresets = sortPresetsByFrequency(state.presets, state.allYears);

  // ── Stats (current month) ──────────────────────────────────────────────────

  const statsWeeks   = curYearMonths[currentMonth] || [];
  const allEntries   = statsWeeks.flatMap(w => w.days);
  const totalMinutes = allEntries.reduce((sum, e) => sum + extractEntryMinutes(e.activity), 0);
  const totalHours   = totalMinutes / 60;
  const sessionCount = allEntries.length;
  const latestWeek   = [...statsWeeks].reverse().find(w => w.days.length > 0) ?? statsWeeks[statsWeeks.length - 1];
  const thisWeekDays = latestWeek ? uniqueDays(latestWeek) : 0;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateWeekDays = (month: string, wi: number, days: Entry[]) =>
    setState(s => {
      const months = { ...s.allYears[CURRENT_YEAR] };
      const weeks  = [...months[month]]; weeks[wi] = { ...weeks[wi], days };
      months[month] = weeks;
      return { ...s, allYears: { ...s.allYears, [CURRENT_YEAR]: months } };
    });

  const deleteWeek = (month: string, wi: number) =>
    setState(s => {
      const months = { ...s.allYears[CURRENT_YEAR] };
      const weeks  = [...months[month]]; weeks.splice(wi, 1);
      if (!weeks.length) delete months[month]; else months[month] = weeks;
      return { ...s, allYears: { ...s.allYears, [CURRENT_YEAR]: months } };
    });

  const toggleWeekOpen = (month: string, wi: number) =>
    setState(s => {
      const months = { ...s.allYears[CURRENT_YEAR] };
      const weeks  = [...months[month]]; weeks[wi] = { ...weeks[wi], open: !weeks[wi].open };
      months[month] = weeks;
      return { ...s, allYears: { ...s.allYears, [CURRENT_YEAR]: months } };
    });

  const addWeek = (month: string, weekNum: number) =>
    setState(s => {
      const months  = { ...s.allYears[CURRENT_YEAR] };
      const newWeek = { id: Date.now(), number: weekNum, open: true, days: [] };
      months[month] = [...months[month], newWeek].sort((a, b) => a.number - b.number);
      return { ...s, allYears: { ...s.allYears, [CURRENT_YEAR]: months } };
    });

  const importHevyEntries = (items: ImportItem[]) => {
    setState(s => {
      const allYears: AllYears = JSON.parse(JSON.stringify(s.allYears));
      for (const { year, month, weekNum, entry } of items) {
        if (!allYears[year])        allYears[year] = {};
        if (!allYears[year][month]) allYears[year][month] = [];
        let week = allYears[year][month].find(w => w.number === weekNum);
        if (!week) {
          week = { id: Date.now() + Math.random(), number: weekNum, open: false, days: [] };
          allYears[year][month].push(week);
          allYears[year][month].sort((a, b) => a.number - b.number);
        }
        // Prevent duplicate entries (same day + activity)
        const exists = week.days.some(e => e.day === entry.day && e.activity === entry.activity);
        if (!exists) week.days.push(entry);
      }
      return { ...s, allYears };
    });
  };

  const addMonth = () => {
    const m   = effectiveNewMonth;
    const now = new Date();
    const wn  = MONTHS.indexOf(m) === now.getMonth() ? Math.ceil(now.getDate() / 7) : 1;
    setState(s => {
      const months = { ...s.allYears[CURRENT_YEAR] };
      if (!months[m]) months[m] = [];
      months[m] = [...months[m], { id: Date.now(), number: wn, open: true, days: [] }];
      return { ...s, allYears: { ...s.allYears, [CURRENT_YEAR]: months } };
    });
    setNewMonthSel('');
  };

  // ── Preview ────────────────────────────────────────────────────────────────

  let rawPreview = '';
  if (activeMonths.length) {
    if (state.previewMode === 'history') {
      activeMonths.forEach(m => {
        rawPreview += m === currentMonth
          ? buildMonthText(m, curYearMonths, state.goal)
          : buildMonthSummaryLine(m, curYearMonths, state.goal);
      });
    } else {
      rawPreview = buildMonthText(currentMonth, curYearMonths, state.goal);
    }
  }

  const copyText = () => {
    navigator.clipboard.writeText(rawPreview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareToWhatsApp = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ text: rawPreview }).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(rawPreview)}`, '_blank');
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(rawPreview)}`, '_blank');
    }
  };

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

      {/* Tab switcher */}
      <div className="tab-switcher">
        <button className={`tab-btn${activeTab === 'log' ? ' active' : ''}`} onClick={() => setActiveTab('log')}>Log</button>
        <button className={`tab-btn${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn${activeTab === 'hevy' ? ' active' : ''}`} onClick={() => setActiveTab('hevy')}>🏋🏻 Hevy</button>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <OverviewTab allYears={state.allYears} goal={state.goal} />
      )}

      {/* Hevy sync tab */}
      {activeTab === 'hevy' && (
        <HevyTab
          activeUser={activeUser}
          allYears={state.allYears}
          apiKey={state.hevyApiKey || ''}
          importedIds={state.hevyImportedIds || []}
          onImport={importHevyEntries}
          onSaveApiKey={key => setState((s: AppState) => ({ ...s, hevyApiKey: key }))}
          onDisconnect={() => setState((s: AppState) => ({ ...s, hevyApiKey: '' }))}
          onMarkImported={ids => setState((s: AppState) => ({
            ...s,
            hevyImportedIds: [...new Set([...(s.hevyImportedIds || []), ...ids])],
          }))}
        />
      )}

      {/* Main layout */}
      {activeTab === 'log' && <div className="tracker-layout">
        {/* Weeks panel */}
        <div>
          <div className="panel">
            <div className="panel-header"><span>Weeks</span></div>
            <div className="panel-body">
              {trackedMonths.map(month => {
                const weeks    = curYearMonths[month];
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
                <button className="btn btn-whatsapp" onClick={shareToWhatsApp}>
                  📲 Share to WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>}
    </div>
  );
}
