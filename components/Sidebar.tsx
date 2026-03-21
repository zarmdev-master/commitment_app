'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

const NAV = [
  { href: '/', label: 'Home', icon: '🏠', exact: true },
  { href: '/tracker', label: 'WhatsApp Tracker', icon: '💬' },
];

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const { users, activeUser, setActiveUser, addUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when add row appears
  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setAdding(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addUser(name);
    setNewName('');
    setAdding(false);
    setMenuOpen(false);
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Pacepal</div>

      <nav className="sidebar-nav">
        {NAV.map(({ href, label, icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link${isActive(href, exact) ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* User switcher */}
      <div className="sidebar-user-area" ref={menuRef}>
        {menuOpen && (
          <div className="user-menu">
            {users.map(u => (
              <button
                key={u}
                className={`user-menu-item${u === activeUser ? ' active' : ''}`}
                onClick={() => { setActiveUser(u); setMenuOpen(false); setAdding(false); }}
              >
                <span className="user-avatar-sm">{initials(u)}</span>
                {u}
                {u === activeUser && <span className="user-check">✓</span>}
              </button>
            ))}

            <div className="user-menu-divider" />

            {adding ? (
              <div className="user-add-row">
                <input
                  ref={inputRef}
                  placeholder="Name…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                  }}
                />
                <button onClick={handleAdd}>Add</button>
              </div>
            ) : (
              <button className="user-menu-item" onClick={() => setAdding(true)}>
                <span style={{ fontSize: '1rem' }}>+</span> Add user
              </button>
            )}
          </div>
        )}

        <button
          className="user-switcher-btn"
          onClick={() => { setMenuOpen(o => !o); setAdding(false); setNewName(''); }}
        >
          <span className="user-avatar">{initials(activeUser)}</span>
          <span className="user-name">{activeUser}</span>
          <span className="user-chevron">{menuOpen ? '▲' : '▼'}</span>
        </button>
      </div>
    </aside>
  );
}
