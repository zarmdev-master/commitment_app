/**
 * Gingarinha — manual data seed / recovery tool
 * Open http://localhost:3000 in your browser, open DevTools (F12),
 * paste this entire script into the Console tab and press Enter.
 */

// ── Eliza ─────────────────────────────────────────────────────────────────────
const elizaData = {
  goal: 3,
  previewMode: 'current',
  presets: [],
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
};

// ── Zoja ──────────────────────────────────────────────────────────────────────
const zojaData = {
  goal: 3,
  previewMode: 'current',
  presets: [],
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
};

// ── Write to localStorage ─────────────────────────────────────────────────────
localStorage.setItem('pacepal_tracker_Eliza', JSON.stringify(elizaData));
localStorage.setItem('pacepal_tracker_Zoja',  JSON.stringify(zojaData));

const existing = JSON.parse(localStorage.getItem('pacepal_users') || '[]');
const merged   = Array.from(new Set([...existing, 'Eliza', 'Zoja']));
localStorage.setItem('pacepal_users', JSON.stringify(merged));

console.log('✅ Seeded data for Eliza and Zoja — refresh the page!');
