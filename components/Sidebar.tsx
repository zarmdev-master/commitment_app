'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

const NAV = [
  { href: '/',        label: 'Home',         icon: '🏠', exact: true },
  { href: '/tracker', label: 'Workout Log',  icon: '💬' },
];

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function UserPhoto({ name, className, style }: {
  name: string; className?: string; style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className={className} style={style}>{initials(name)}</span>;
  }
  return (
    <img
      src={`/${name.toLowerCase()}.jpg`}
      alt={name}
      className={className}
      style={{ objectFit: 'cover', objectPosition: 'center top', ...style }}
      onError={() => setFailed(true)}
    />
  );
}

const ADMIN_PASSWORD = 'gingagooddes';

// Shared user menu content (used in both desktop and mobile)
function UserMenuContent({
  users, activeUser, adding, newName, inputRef,
  onSelect, onStartAdding, onNameChange, onNameKey, onAdd, onDelete,
}: {
  users: string[]; activeUser: string; adding: boolean; newName: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (u: string) => void; onStartAdding: () => void;
  onNameChange: (v: string) => void; onNameKey: (e: React.KeyboardEvent) => void;
  onAdd: () => void; onDelete: (name: string) => void;
}) {
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deletePass, setDeletePass]     = useState('');
  const [deleteError, setDeleteError]   = useState(false);
  const [deleteErrKey, setDeleteErrKey] = useState(0);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (deletingUser) passRef.current?.focus(); }, [deletingUser]);

  const startDelete = (u: string) => {
    setDeletingUser(u); setDeletePass(''); setDeleteError(false);
  };

  const cancelDelete = () => {
    setDeletingUser(null); setDeletePass(''); setDeleteError(false);
  };

  const confirmDelete = () => {
    if (deletePass === ADMIN_PASSWORD) {
      onDelete(deletingUser!);
      cancelDelete();
    } else {
      setDeleteError(true);
      setDeleteErrKey(k => k + 1);
      setDeletePass('');
      setTimeout(() => setDeleteError(false), 600);
    }
  };

  const handlePassKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmDelete();
    if (e.key === 'Escape') cancelDelete();
  };

  return (
    <>
      {users.map(u => (
        <div key={u}>
          <div className={`user-menu-item${u === activeUser ? ' active' : ''}`}>
            <button className="user-menu-item-inner" onClick={() => onSelect(u)}>
              <UserPhoto name={u} className="user-avatar-sm" style={{ borderRadius: '50%' }} />
              {u}
              {u === activeUser && <span className="user-check">✓</span>}
            </button>
            {users.length > 1 && (
              <button
                className="user-delete-btn"
                title={`Delete ${u}`}
                onClick={e => { e.stopPropagation(); deletingUser === u ? cancelDelete() : startDelete(u); }}
              >🗑</button>
            )}
          </div>
          {deletingUser === u && (
            <div key={deleteErrKey} className={`user-delete-row${deleteError ? ' delete-error' : ''}`}>
              <input
                ref={passRef}
                type="password"
                placeholder="Admin password…"
                value={deletePass}
                onChange={e => setDeletePass(e.target.value)}
                onKeyDown={handlePassKey}
              />
              <button onClick={confirmDelete}>Delete</button>
            </div>
          )}
        </div>
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
        <button className="user-menu-item user-menu-item-inner" onClick={onStartAdding}>
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add user
        </button>
      )}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { users, activeUser, setActiveUser, addUser, deleteUser } = useUser();

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [adding,    setAdding]    = useState(false);
  const [newName,   setNewName]   = useState('');

  const desktopMenuRef  = useRef<HTMLDivElement>(null);
  const mobileSheetRef  = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);

  // Focus input when add row appears
  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  // Close desktop menu on outside pointer (mouse + touch) — excludes both
  // the desktop sidebar area and the mobile bottom sheet
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: PointerEvent) => {
      const inDesktop = desktopMenuRef.current?.contains(e.target as Node);
      const inMobile  = mobileSheetRef.current?.contains(e.target as Node);
      if (!inDesktop && !inMobile) {
        setMenuOpen(false); setAdding(false); setNewName('');
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
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
    onDelete: deleteUser,
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-white">ginga</span><span className="logo-accent">rinha</span>
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
            <UserPhoto name={activeUser} className="user-avatar" style={{ borderRadius: '50%' }} />
            <span className="user-name">{activeUser}</span>
            <span className="user-chevron">{menuOpen ? '▲' : '▼'}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile user menu overlay ── */}
      {menuOpen && (
        <div
          className="mobile-user-overlay"
          onClick={closeMenu}
          onPointerDown={closeMenu}
        >
          <div
            ref={mobileSheetRef}
            className="mobile-user-sheet"
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
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
          <UserPhoto name={activeUser} className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.58rem', borderRadius: '50%' }} />
          {activeUser.split(' ')[0]}
        </button>
      </nav>
    </>
  );
}
