export default function ModulesPage() {
  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{
        fontSize: '1.4rem', fontWeight: 700, marginBottom: 8,
        background: 'linear-gradient(135deg, #818cf8, #c084fc)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        Modules
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>
        Future modules will live here. Add a new page under <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem' }}>app/</code> and a link in <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem' }}>components/Sidebar.tsx</code>.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {['Nutrition tracker', 'Sleep log', 'Weekly review'].map(name => (
          <div key={name} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '18px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 500 }}>{name}</span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px',
              borderRadius: 20, background: 'var(--surface2)', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}