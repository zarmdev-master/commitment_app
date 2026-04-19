const BASE = 'https://hnhetbskvmmldlmntijw.supabase.co';
const KEY  = 'sb_publishable_GuixG_hEUu1pJ3jrdgDtXw_dzDELjyt';
const USER = 'Zoja';

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

const JANUARY = [
  {
    id: 20101, number: 1, open: false,
    days: [
      { day: 'MON', activity: '1h 30 🥖 gym 🏋🏻‍♀️' },
      { day: 'TUE', activity: '1h 30 🥖 gym 🏋🏻‍♀️' },
      { day: 'WED', activity: '1h 30 🥖 gym 🏋🏻‍♀️' },
      { day: 'THU', activity: '1h 30 🥖 gym 🏋🏻‍♀️' },
      { day: 'FRI', activity: '1h 30 🥖 gym 🏋🏻‍♀️' },
      { day: 'SAT', activity: '1h 30 🥖 gym 🏋🏻‍♀️' },
    ],
  },
  {
    id: 20102, number: 2, open: false,
    days: [
      { day: 'MON', activity: '1h 30 🥖 gym 🏋🏻‍♀️' },
      { day: 'WED', activity: '1h padel with trainer 🎾' },
      { day: 'FRI', activity: '1h gym with Trainer 🏋🏻‍♀️' },
      { day: 'SAT', activity: '1h 30 padel game 🎾' },
      { day: 'SUN', activity: '2h padel tournament 🎾' },
    ],
  },
  {
    id: 20103, number: 3, open: false,
    days: [
      { day: 'MON', activity: '1h 30 padel 🎾' },
      { day: 'WED', activity: '1h lady boss gym 🏋🏻‍♀️💁🏻‍♀️' },
      { day: 'FRI', activity: '1h gym with Trainer 🏋🏻‍♀️' },
      { day: 'FRI', activity: '1h 30 padel 🎾' },
      { day: 'SAT', activity: '1h 30 padel 🎾' },
    ],
  },
  {
    id: 20104, number: 4, open: false,
    days: [
      { day: 'TUE', activity: '1h lady boss gym 🏋🏻‍♀️' },
      { day: 'WED', activity: '50 min padel trainer 🎾' },
      { day: 'SAT', activity: '2h padel tournament 🎾' },
      { day: 'SUN', activity: '1h 15 gym 🏋🏻‍♀️' },
    ],
  },
];

const FEBRUARY = [
  {
    id: 20201, number: 1, open: false,
    days: [
      { day: 'MON', activity: '1h single lady boss gym 🏋🏻‍♀️' },
      { day: 'TUE', activity: '1h gym 🏋🏻‍♀️' },
      { day: 'WED', activity: '1h padel Training 🎾' },
      { day: 'THU', activity: '2h padel tournament 🎾' },
      { day: 'FRI', activity: '1h gym with trainer 🏋🏻‍♀️' },
      { day: 'SUN', activity: '2h padel tournament 🎾' },
    ],
  },
  {
    id: 20202, number: 2, open: false,
    days: [
      { day: 'MON', activity: '1h lady boss gym trainer 🏋🏻‍♀️' },
      { day: 'FRI', activity: '2h padel tournament 🎾' },
      { day: 'SAT', activity: '1h couples gym 🏋🏻‍♀️' },
    ],
  },
  {
    id: 20203, number: 3, open: false,
    days: [
      { day: 'MON', activity: '1h couples gym 🏋🏻‍♀️' },
      { day: 'TUE', activity: '1h lady boss gym 🏋🏻‍♀️' },
      { day: 'WED', activity: '2h Americano with RAI 🎾' },
      { day: 'THU', activity: '1h gym with trainer 🏋🏻‍♀️' },
      { day: 'FRI', activity: '1h gym with Marek 🏋🏻‍♀️' },
    ],
  },
  {
    id: 20204, number: 4, open: false,
    days: [
      { day: 'MON', activity: '1h lady boss gym 💁🏻‍♀️🏋🏻‍♀️' },
      { day: 'TUE', activity: '1h beach 🏐' },
      { day: 'WED', activity: '1h padel training 🎾' },
      { day: 'FRI', activity: '1h 30 Americano 🎾' },
      { day: 'SAT', activity: '1h gym 🏋🏻‍♀️' },
      { day: 'SUN', activity: '40 min home exercising 🤸🏻‍♀️' },
    ],
  },
  {
    id: 20205, number: 5, open: false,
    days: [
      { day: 'MON', activity: '2h Padel Americano 🎾' },
      { day: 'TUE', activity: '1h lady boss 🏋🏻‍♀️' },
      { day: 'TUE', activity: '1h beach 🏐' },
      { day: 'THU', activity: '1h 30 padel 🎾' },
      { day: 'FRI', activity: '1h gym with trainer 🏋🏻‍♀️' },
      { day: 'SUN', activity: '2h padel 🎾' },
    ],
  },
];

async function run() {
  const res = await fetch(
    `${BASE}/rest/v1/user_data?username=eq.${encodeURIComponent(USER)}&select=data`,
    { headers }
  );
  const rows = await res.json();
  const current = rows?.[0]?.data ?? {};
  const allYears = { ...(current.allYears ?? {}) };
  if (!allYears['2026']) allYears['2026'] = {};

  allYears['2026']['January']  = JANUARY;
  allYears['2026']['February'] = FEBRUARY;
  console.log('Overwriting January and February for Zoja...');

  const saveRes = await fetch(`${BASE}/rest/v1/user_data`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ username: USER, data: { ...current, allYears }, updated_at: new Date().toISOString() }),
  });
  console.log('Save status:', saveRes.status, saveRes.statusText);
}

run().catch(console.error);
