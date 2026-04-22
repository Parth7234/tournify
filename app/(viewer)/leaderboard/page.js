'use client';

import { useState, useEffect } from 'react';

const medalEmoji = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const medalColors = {
  gold: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  silver: 'text-gray-500 bg-gray-50 border-gray-200',
  bronze: 'text-amber-700 bg-amber-50 border-amber-200',
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/leaderboard')
      .then(r => r.json())
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      <span className="text-on-surface-variant text-sm">Loading leaderboard...</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-16 md:pb-0 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Master Leaderboard</h1>
        </div>
        <p className="text-sm text-on-surface-variant">
          Overall medal tally across all sports. Ranked by Gold → Silver → Bronze.
        </p>
      </header>

      {leaderboard.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-14 text-center border border-outline-variant/20 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-outline-variant">emoji_events</span>
          <p className="text-on-surface-variant text-sm">No medals awarded yet. Complete sports tournaments to see the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Podium — Top 3 */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto w-full">
              {/* 2nd place */}
              <div className="flex flex-col items-center gap-2 pt-8">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-xl md:text-2xl font-bold text-gray-600">
                  {leaderboard[1].teamName[0]}
                </div>
                <span className="text-2xl">🥈</span>
                <span className="text-sm font-bold text-on-surface text-center truncate w-full">{leaderboard[1].teamName}</span>
                <div className="flex gap-1.5 text-xs font-bold">
                  <span className="text-yellow-600">{leaderboard[1].gold}G</span>
                  <span className="text-gray-400">{leaderboard[1].silver}S</span>
                  <span className="text-amber-700">{leaderboard[1].bronze}B</span>
                </div>
              </div>
              {/* 1st place */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-yellow-50 border-2 border-yellow-400 flex items-center justify-center text-2xl md:text-3xl font-bold text-yellow-700 shadow-lg shadow-yellow-200/40">
                  {leaderboard[0].teamName[0]}
                </div>
                <span className="text-3xl">🥇</span>
                <span className="text-sm font-bold text-on-surface text-center truncate w-full">{leaderboard[0].teamName}</span>
                <div className="flex gap-1.5 text-xs font-bold">
                  <span className="text-yellow-600">{leaderboard[0].gold}G</span>
                  <span className="text-gray-400">{leaderboard[0].silver}S</span>
                  <span className="text-amber-700">{leaderboard[0].bronze}B</span>
                </div>
              </div>
              {/* 3rd place */}
              <div className="flex flex-col items-center gap-2 pt-12">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-lg md:text-xl font-bold text-amber-700">
                  {leaderboard[2].teamName[0]}
                </div>
                <span className="text-2xl">🥉</span>
                <span className="text-sm font-bold text-on-surface text-center truncate w-full">{leaderboard[2].teamName}</span>
                <div className="flex gap-1.5 text-xs font-bold">
                  <span className="text-yellow-600">{leaderboard[2].gold}G</span>
                  <span className="text-gray-400">{leaderboard[2].silver}S</span>
                  <span className="text-amber-700">{leaderboard[2].bronze}B</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Table */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/25">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-primary">
                    <th className="px-4 md:px-5 py-3 text-center w-16 text-xs font-bold uppercase tracking-wider text-on-primary">Rank</th>
                    <th className="px-4 md:px-5 py-3 text-xs font-bold uppercase tracking-wider text-on-primary">Team</th>
                    <th className="px-3 py-3 text-center w-20 text-xs font-bold uppercase tracking-wider text-on-primary">🥇 Gold</th>
                    <th className="px-3 py-3 text-center w-20 text-xs font-bold uppercase tracking-wider text-on-primary">🥈 Silver</th>
                    <th className="px-3 py-3 text-center w-20 text-xs font-bold uppercase tracking-wider text-on-primary">🥉 Bronze</th>
                    <th className="px-3 py-3 text-center w-20 text-xs font-bold uppercase tracking-wider text-on-primary">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr key={row.teamId} className={`border-b border-outline-variant/15 transition-colors hover:bg-surface-container-low ${i === 0 ? 'bg-primary-fixed/20' : i === 1 ? 'bg-primary-fixed/10' : i === 2 ? 'bg-primary-fixed/5' : 'bg-surface-container-lowest'}`}>
                      <td className="px-4 md:px-5 py-3 text-center font-bold text-on-surface-variant">{i + 1}</td>
                      <td className="px-4 md:px-5 py-3 font-semibold text-on-surface">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
                            {row.teamName[0]}
                          </div>
                          {row.teamName}
                          {i === 0 && <span className="material-symbols-outlined text-yellow-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-extrabold text-yellow-600">{row.gold}</td>
                      <td className="px-3 py-3 text-center font-bold text-gray-500">{row.silver}</td>
                      <td className="px-3 py-3 text-center font-bold text-amber-700">{row.bronze}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-on-surface">{row.gold + row.silver + row.bronze}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medal Details */}
          {leaderboard.some(r => r.details.length > 0) && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-on-surface tracking-tight">Medal Breakdown</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
                {leaderboard.map(row => (
                  <div key={row.teamId} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/15">
                      <div className="w-7 h-7 rounded-full bg-primary-fixed/20 flex items-center justify-center text-xs font-bold text-primary">
                        {row.teamName[0]}
                      </div>
                      <span className="font-bold text-sm text-on-surface">{row.teamName}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {row.details.map((d, j) => (
                        <div key={j} className="flex items-center justify-between text-sm">
                          <span className="text-on-surface-variant">{d.sport}</span>
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${medalColors[d.medal]}`}>
                            {medalEmoji[d.medal]} {d.medal}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
