'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/events', label: 'Events', icon: 'event' },
  { href: '/admin/teams', label: 'Teams', icon: 'groups' },
  { href: '/admin/sports', label: 'Sports', icon: 'sports_kabaddi' },
  { href: '/admin/squads', label: 'Squads', icon: 'monitoring' },
  { href: '/admin/tournaments', label: 'Brackets', icon: 'account_tree' },
  { href: '/admin/live', label: 'Live Desk', icon: 'live_tv' },
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [status, router, pathname]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (pathname === '/admin/login') return <>{children}</>;

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-on-surface-variant flex-col gap-3">
        <div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  const Sidebar = (
    <nav className={`fixed md:static z-50 h-screen w-[260px] bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col shrink-0 shadow-xl shadow-primary/[0.03] transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="px-5 pt-6 pb-4">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-primary-container/30">T</div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-primary tracking-tight">Tournify</span>
            <span className="text-xs text-outline font-medium -mt-0.5">Admin Panel</span>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-3 px-5 py-4 mx-3 mb-2 border-y border-outline-variant/15">
        <div className="w-9 h-9 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary font-bold text-sm">{(session.user?.name || 'A')[0]}</div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-on-surface text-sm truncate">{session.user?.name || 'Admin'}</span>
          <span className="text-xs text-outline truncate">{session.user?.email}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-0.5 px-3 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`px-3 py-2.5 rounded-lg flex items-center gap-3 text-xs font-semibold transition-all duration-200 relative ${isActive ? 'bg-primary-fixed/30 text-primary shadow-sm shadow-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}>
              {isActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary-container" />}
              <span className={`material-symbols-outlined text-xl ${isActive ? 'text-primary' : 'text-outline'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="px-3 py-4 border-t border-outline-variant/15">
        <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full px-3 py-2.5 rounded-lg text-xs font-medium text-outline hover:bg-error-container/30 hover:text-error flex items-center gap-3 transition-colors">
          <span className="material-symbols-outlined text-xl">logout</span>Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}
      {Sidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-outline-variant/15 bg-surface-container-lowest shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <span className="text-sm font-bold text-primary">Tournify</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-8 md:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
