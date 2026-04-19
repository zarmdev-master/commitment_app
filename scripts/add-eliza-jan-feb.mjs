const URL = 'https://hnhetbskvmmldlmntijw.supabase.co';
const KEY = 'sb_publishable_GuixG_hEUu1pJ3jrdgDtXw_dzDELjyt';
const USER = 'Eliza';

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

const JANUARY = [
  {
    id: 10101, number: 1, open: false,
    days: [
      { day: 'FRI', activity: '1h adapted workout A 🏋🏻‍♀️' },
    ],
  },
  {
    id: 10102, number: 2, open: false,
    days: [
      { day: 'MON', activity: '1h 30 padel americano 🎾' },
      { day: 'WED', activity: '1h home workout B 🏋🏻‍♀️' },
      { day: 'FRI', activity: '45 min home A 🏋🏻‍♀️' },
      { day: 'SUN', activity: '1h home B 🏋🏻‍♀️' },
    ],
  },
  {
    id: 10103, number: 3, open: false,
    days: [
      { day: 'WED', activity: '1h lady boss gym A 🏋🏻‍♀️💁🏻‍♀️' },
      { day: 'FRI', activity: '1h home couples workout B 🏋🏻‍♀️' },
      { day: 'SAT', activity: '1h home couples workout C 🏋🏻‍♀️' },
    ],
  },
  {
    id: 10104, number: 4, open: false,
    days: [
      { day: 'MON', activity: '1h 30 beach 🏐🏖️' },
      { day: 'TUE', activity: '1h lady boss gym A 🏋🏻‍♀️' },
      { day: 'WED', activity: '1h home workout B 🏋🏻‍♀️' },
      { day: 'FRI', activity: '2h 30 beach mix 🏐🏖️' },
      { day: 'SUN', activity: '1h home workout C 🏋🏻‍♀️' },
    ],
  },
];

const FEBRUARY = [
  {
    id: 10201, number: 1, open: false,
    days: [
      { day: 'FRI', activity: '1h workout A 🏋🏻‍♀️' },
    ],
  },
  {
    id: 10202, number: 2, open: false,
    days: [
      { day: 'TUE', activity: '1h workout C 🏋🏻‍♀️' },
      { day: 'THU', activity: '1h workout B 🏋🏻‍♀️' },
      { day: 'SAT', activity: '1h bodyweight workout 🏋🏻‍♀️' },
    ],
  },
  {
    id: 10203, number: 3, open: false,
    days: [
      { day: 'MON', activity: '1h 30 beach training 🏖️' },
      { day: 'TUE', activity: '1h lady boss gym A 🏋🏻‍♀️' },
      { day: 'FRI', activity: '3h beach mix 🏖️' },
      { day: 'SAT', activity: '1h home workout B 🏋🏻‍♀️' },
    ],
  },
  {
    id: 10204, number: 4, open: false,
    days: [
      { day: 'MON', activity: '1h lady boss A 🏋🏻‍♀️' },
      { day: 'MON', activity: '1h 30 beach 🏖️' },
      { day: 'SUN', activity: '1h family workout C 🏋🏻‍♀️' },
    ],
  },
  {
    id: 10205, number: 5, open: false,
    days: [
      { day: 'MON', activity: '1h 30 beach 🏖️' },
      { day: 'TUE', activity: '1h lady boss B 🏋🏻‍♀️' },
      { day: 'TUE', activity: '1h 30 padel americano 🎾🏆' },
      { day: 'THU', activity: '1h workout A 🏋🏻‍♀️' },
      { day: 'SUN', activity: '1h workout C 🏋🏻‍♀️' },
    ],
  },
];

async function run() {
  // 1. Fetch current data
  const res = await fetch(
    `${URL}/rest/v1/user_data?username=eq.${encodeURIComponent(USER)}&select=data`,
    { headers }
  );
  const rows = await res.json();
  const current = rows?.[0]?.data ?? {};
  console.log('Fetched current data. Keys in allYears:', Object.keys(current.allYears ?? {}));

  // 2. Merge — only add months that don't already exist
  const allYears = { ...(current.allYears ?? {}) };
  if (!allYears['2026']) allYears['2026'] = {};

  if (!allYears['2026']['January'] || allYears['2026']['January'].length === 0) {
    allYears['2026']['January'] = JANUARY;
    console.log('Added January');
  } else {
    console.log('January already has data — skipping');
  }

  if (!allYears['2026']['February'] || allYears['2026']['February'].length === 0) {
    allYears['2026']['February'] = FEBRUARY;
    console.log('Added February');
  } else {
    console.log('February already has data — skipping');
  }

  const payload = { ...current, allYears };

  // 3. Save back
  const saveRes = await fetch(`${URL}/rest/v1/user_data`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ username: USER, data: payload, updated_at: new Date().toISOString() }),
  });
  console.log('Save status:', saveRes.status, saveRes.statusText);
}

run().catch(console.error);
