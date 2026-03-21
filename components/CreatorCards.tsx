'use client';

import { useState } from 'react';

function CreatorPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="creator-photo creator-initials">
        {alt.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="creator-photo"
      onError={() => setFailed(true)}
    />
  );
}

const CREATORS = [
  { name: 'Zoja',  src: '/zoja.jpg',  sub: 'personal project · built for fun' },
  { name: 'Eliza', src: '/eliza.jpg', sub: 'the inspiration · dreamer · contributing soon' },
];

export default function CreatorCards() {
  return (
    <div className="creator-cards">
      {CREATORS.map(c => (
        <div key={c.name} className="creator-card">
          <CreatorPhoto src={c.src} alt={c.name} />
          <div className="creator-text">
            <span className="creator-name">{c.name}</span>
            <span className="creator-sub">{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
