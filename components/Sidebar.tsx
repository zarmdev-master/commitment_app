'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

const NAV = [
  { href: '/',        label: 'Home',             icon: '🏠', exact: true },
  { href: '/tracker', label: 'WhatsApp Tracker',  icon: '💬' },
];

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

// Shared user menu content (used in both desktop and mobile)
function UserMenuContent({
  users, activeUser, adding, newName, inputRef,
  onSelect, onStartAdding, onNameChange, onNameKey, onAdd,
}: {
  users: string[]; activeUser: string; adding: boolean; newName: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (u: string) => void; onStartAdding: () => void;
  onNameChange: (v: string) => void; onNameKey: (e: React.KeyboardEvent) => void;
  onAdd: () => void;
}) {
  return (
    <>
      {users.map(u => (
        <button
          key={u}
          className={`user-menu-item${u === activeUser ? ' active' : ''}`}
          onClick={() => onSelect(u)}
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
            onChange={e => onNameChange(e.target.value)}
            onKeyDown={onNameKey}
          />
          <button onClick={onAdd}>Add</button>
        </div>
      ) : (
        <button className="user-menu-item" onClick={onStartAdding}>
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add user
        </button>
      )}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { users, activeUser, setActiveUser, addUser } = useUser();

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [adding,    setAdding]    = useState(false);
  const [newName,   setNewName]   = useState('');

  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Focus input when add row appears
  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  // Close desktop menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setAdding(false); setNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const closeMenu = () => { setMenuOpen(false); setAdding(false); setNewName(''); };

  const handleSelect = (u: string) => { setActiveUser(u); closeMenu(); };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addUser(name);
    setNewName(''); setAdding(false); closeMenu();
  };

  const handleNameKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') { setAdding(false); setNewName(''); }
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const menuProps = {
    users, activeUser, adding, newName, inputRef,
    onSelect: handleSelect,
    onStartAdding: () => setAdding(true),
    onNameChange: setNewName,
    onNameKey: handleNameKey,
    onAdd: handleAdd,
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-white">pace</span><span className="logo-accent">pal</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ href, label, icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${isActive(href, exact) ? ' active' : ''}`}
            >
              <span className="nav-dot" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-user-area" ref={desktopMenuRef}>
          {menuOpen && (
            <div className="user-menu">
              <UserMenuContent {...menuProps} />
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

      {/* ── Mobile user menu overlay ── */}
      {menuOpen && (
        <div className="mobile-user-overlay" onClick={closeMenu}>
          <div className="mobile-user-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-sheet-handle" />
            <UserMenuContent {...menuProps} />
          </div>
        </div>
      )}

      {/* ── Mobile bottom tab bar ── */}
      <nav className="bottom-tabs">
        {NAV.map(({ href, label, icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`bottom-tab${isActive(href, exact) ? ' active' : ''}`}
          >
            <span className="bottom-tab-indicator" />
            <span className="bottom-tab-icon">{icon}</span>
            {label.split(' ')[0]}
          </Link>
        ))}
        {/* User tab */}
        <button
          className={`bottom-tab${menuOpen ? ' active' : ''}`}
          onClick={() => { setMenuOpen(o => !o); setAdding(false); setNewName(''); }}
        >
          <span className="bottom-tab-indicator" />
          <span className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.58rem' }}>
            {initials(activeUser)}
          </span>
          {activeUser.split(' ')[0]}
        </button>
      </nav>
    </>
  );
}
