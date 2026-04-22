'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ events: 0, teams: 0, sports: 0, liveMatches: 0, upcomingMatches: 0, completedMatches: 0 });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      // DB not connected yet
    }
  }

  const statCards = [
    { label: 'Events', value: stats.events, color: '#6366f1', href: '/admin/events', icon: '📅' },
    { label: 'Teams', value: stats.teams, color: '#8b5cf6', href: '/admin/teams', icon: '👥' },
    { label: 'Sports', value: stats.sports, color: '#06b6d4', href: '/admin/sports', icon: '🏅' },
    { label: 'Live', value: stats.liveMatches, color: '#ef4444', href: '/admin/live', icon: '🔴' },
    { label: 'Upcoming', value: stats.upcomingMatches, color: '#f59e0b', href: '/admin/tournaments', icon: '📋' },
    { label: 'Completed', value: stats.completedMatches, color: '#22c55e', href: '/admin/live', icon: '✅' },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome to Tournify Admin Panel</p>
      </div>
      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <Link href={card.href} key={card.label} className={styles.statCard} style={{ '--accent': card.color }}>
            <div className={styles.statInfo}>
              <span className={styles.statIcon}>{card.icon}</span>
              <span className={styles.statValue}>{card.value}</span>
              <span className={styles.statLabel}>{card.label}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link href="/admin/events" className={styles.actionCard}>
            <span className={styles.actionIcon}>📅</span>
            <span>Create Event</span>
          </Link>
          <Link href="/admin/teams" className={styles.actionCard}>
            <span className={styles.actionIcon}>👥</span>
            <span>Manage Teams</span>
          </Link>
          <Link href="/admin/tournaments" className={styles.actionCard}>
            <span className={styles.actionIcon}>🏆</span>
            <span>Generate Brackets</span>
          </Link>
          <Link href="/admin/live" className={styles.actionCard}>
            <span className={styles.actionIcon}>🎯</span>
            <span>Live Desk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
