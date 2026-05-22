'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageSquare,
  Users,
  Sparkles,
  FileText,
  ClipboardList,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/people', label: 'People', icon: Users },
  { href: '/agents', label: 'Agents', icon: Sparkles },
  { href: '/contexts', label: 'Contexts', icon: FileText },
  { href: '/reports', label: 'Reports', icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();

  // Don't show sidebar on login/auth/logout pages
  if (pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/logout')) {
    return null;
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-squirrel-900 flex flex-col">
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-5 border-b border-squirrel-800 transition-colors hover:bg-squirrel-800"
      >
        <div className="w-8 h-8 bg-squirrel-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          C
        </div>
        <span className="text-lg font-semibold text-white">Converser</span>
      </Link>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-squirrel-800 text-white'
                      : 'text-squirrel-200 hover:bg-squirrel-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-squirrel-800">
        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-squirrel-200 hover:bg-squirrel-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
