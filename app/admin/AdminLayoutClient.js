'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './layout.module.css';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/events', label: 'Events', icon: '📅' },
  { href: '/admin/teams', label: 'Teams', icon: '👥' },
  { href: '/admin/sports', label: 'Sports', icon: '🏅' },
  { href: '/admin/squads', label: 'Squads', icon: '📋' },
  { href: '/admin/tournaments', label: 'Brackets', icon: '🏆' },
  { href: '/admin/live', label: 'Live Desk', icon: '🎯' },
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [status, router, pathname]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.logo}>
            <span className={styles.logoText}>Tournify</span>
          </Link>
          <span className={styles.badge}>Admin</span>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{session.user?.name}</span>
            <span className={styles.userEmail}>{session.user?.email}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
