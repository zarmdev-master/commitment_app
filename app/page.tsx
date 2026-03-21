import Link from 'next/link';

const ACTIVE_MODULES = [
  {
    href: '/tracker',
    icon: '💬',
    title: 'Quick WhatsApp Text Creator',
    desc: 'Log your weekly workouts and copy a clean, ready-to-paste WhatsApp summary in one click.',
  },
];

const COMING_SOON = [
  { icon: '🥗', title: 'Nutrition log' },
  { icon: '😴', title: 'Sleep tracker' },
  { icon: '📊', title: 'Weekly review' },
];

export default function HomePage() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-logo">
          <span style={{ color: 'var(--text)' }}>pace</span>
          <span style={{ color: 'var(--accent)' }}>pal</span>
        </div>
        <p className="landing-tagline">Your personal fitness experiment space.</p>
        <p className="landing-desc">
          A little corner for building tools that make tracking fitness easier.
          No subscriptions, no bloat — just the stuff that&apos;s actually useful.
        </p>
      </div>

      <div style={{ marginBottom: 36 }}>
        <div className="landing-section-title">Active</div>
        <div className="module-cards">
          {ACTIVE_MODULES.map(m => (
            <Link key={m.href} href={m.href} className="module-card">
              <span className="module-card-icon">{m.icon}</span>
              <div className="module-card-body">
                <div className="module-card-title">{m.title}</div>
                <div className="module-card-desc">{m.desc}</div>
              </div>
              <span className="module-card-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="landing-section-title">Coming sometime</div>
        <div className="module-cards">
          {COMING_SOON.map(m => (
            <div key={m.title} className="module-card-soon">
              <span className="module-card-icon" style={{ fontSize: '1.3rem' }}>{m.icon}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{m.title}</span>
              <span className="soon-badge">soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
