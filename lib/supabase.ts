const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

export async function loadUserData(username: string): Promise<object | null> {
  try {
    const res = await fetch(
      `${URL}/rest/v1/user_data?username=eq.${encodeURIComponent(username)}&select=data`,
      { headers }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.data ?? null;
  } catch {
    return null;
  }
}

export async function saveUserData(username: string, payload: object): Promise<void> {
  try {
    await fetch(`${URL}/rest/v1/user_data`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ username, data: payload, updated_at: new Date().toISOString() }),
    });
  } catch {
    // silent fail — localStorage still has the data
  }
}
