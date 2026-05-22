'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  MessageSquare,
  Users,
  Bot,
  FileText,
  ClipboardList,
  LogOut,
} from 'lucide-react';

const mainNavItems = [
  { href: '/', label: 'Analyse', icon: Sparkles },
  { href: '/people', label: 'People', icon: Users },
  { href: '/reports', label: 'Reports', icon: ClipboardList },
  { href: '/conversations', label: 'Conversations', icon: MessageSquare },
];

const settingsNavItems = [
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/contexts', label: 'Contexts', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  if (pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/logout')) {
    return null;
  }

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-brand flex flex-col border-r border-border">
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-5 border-b border-border transition-colors hover:bg-surface-raised"
      >
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-fg font-bold text-sm">
          C
        </div>
        <span className="text-lg font-semibold text-text-primary">Converser</span>
      </Link>

      <nav className="flex-1 py-4 flex flex-col">
        {/* Main navigation */}
        <ul className="space-y-1 px-3">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border ${
                    active
                      ? 'bg-interactive-selected-bg text-interactive-selected-fg border-interactive-selected-border'
                      : 'text-text-tertiary border-transparent hover:bg-surface-raised hover:text-text-primary hover:border-squirrel-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Separator */}
        <div className="my-4 mx-3 border-t border-border" />

        {/* Settings */}
        <div className="px-3">
          <p className="px-3 mb-2 text-xs font-medium text-text-muted uppercase tracking-wider">Settings</p>
          <ul className="space-y-1">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border ${
                      active
                        ? 'bg-interactive-selected-bg text-interactive-selected-fg border-interactive-selected-border'
                        : 'text-text-tertiary border-transparent hover:bg-surface-raised hover:text-text-primary hover:border-squirrel-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Spacer */}
        <div className="flex-1" />
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-tertiary border border-transparent transition-colors hover:bg-surface-raised hover:text-text-primary hover:border-squirrel-300"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
