'use server';

import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Squad from '@/models/Squad';
import Sport from '@/models/Sport';

export async function getMatches(sportId, status) {
  await dbConnect();
  const filter = {};
  if (sportId) filter.sportId = sportId;
  if (status) filter.status = status;

  const matches = await Match.find(filter)
    .populate({ path: 'squadA', populate: { path: 'teamId' } })
    .populate({ path: 'squadB', populate: { path: 'teamId' } })
    .populate('sportId')
    .sort({ scheduledAt: 1, createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(matches));
}

export async function getMatch(id) {
  await dbConnect();
  const match = await Match.findById(id)
    .populate({ path: 'squadA', populate: [{ path: 'teamId' }, { path: 'players' }] })
    .populate({ path: 'squadB', populate: [{ path: 'teamId' }, { path: 'players' }] })
    .populate('sportId')
    .lean();
  return JSON.parse(JSON.stringify(match));
}

export async function updateMatchScore(id, data) {
  await dbConnect();
  const updateData = {};
  if (data.scoreA !== undefined) updateData.scoreA = data.scoreA;
  if (data.scoreB !== undefined) updateData.scoreB = data.scoreB;
  if (data.status) updateData.status = data.status;
  if (data.winner !== undefined) updateData.winner = data.winner;

  const match = await Match.findByIdAndUpdate(id, updateData, { new: true })
    .populate({ path: 'squadA', populate: { path: 'teamId' } })
    .populate({ path: 'squadB', populate: { path: 'teamId' } })
    .populate('sportId')
    .lean();

  // Auto-advance knockout if match completed
  if (data.status === 'completed' && match) {
    try {
      await advanceKnockout(match);
    } catch (e) {
      console.error('Knockout advance error:', e);
    }
  }

  return JSON.parse(JSON.stringify(match));
}

export async function addMatchEvent(matchId, event) {
  await dbConnect();
  const match = await Match.findByIdAndUpdate(
    matchId,
    { $push: { matchEvents: { ...event, timestamp: new Date() } } },
    { new: true }
  )
    .populate({ path: 'squadA', populate: { path: 'teamId' } })
    .populate({ path: 'squadB', populate: { path: 'teamId' } })
    .lean();
  return JSON.parse(JSON.stringify(match));
}

export async function addGoalScorer(matchId, data) {
  await dbConnect();
  const match = await Match.findByIdAndUpdate(
    matchId,
    { $push: { goalScorers: { player: data.player, team: data.team, minute: data.minute } } },
    { new: true }
  ).lean();
  return JSON.parse(JSON.stringify(match));
}

export async function removeGoalScorer(matchId, scorerId) {
  await dbConnect();
  const match = await Match.findByIdAndUpdate(
    matchId,
    { $pull: { goalScorers: { _id: scorerId } } },
    { new: true }
  ).lean();
  return JSON.parse(JSON.stringify(match));
}

export async function updateMatchSchedule(id, scheduledAt) {
  await dbConnect();
  const match = await Match.findByIdAndUpdate(id, { scheduledAt: new Date(scheduledAt) }, { new: true }).lean();
  return JSON.parse(JSON.stringify(match));
}

// ============ KNOCKOUT AUTO-ADVANCEMENT ============

async function advanceKnockout(completedMatch) {
  const sport = await Sport.findById(completedMatch.sportId).lean();
  if (!sport || sport.tournamentFormat !== 'knockout') return;

  const currentRound = completedMatch.round;
  const allMatches = await Match.find({
    sportId: completedMatch.sportId,
    round: currentRound,
  }).lean();

  // Check if ALL matches in this round are completed
  const allDone = allMatches.every(m => m.status === 'completed');
  if (!allDone) return;

  // Collect winners from this round
  const winners = [];
  for (const m of allMatches) {
    if (m.scoreA > m.scoreB) winners.push(m.squadA);
    else if (m.scoreB > m.scoreA) winners.push(m.squadB);
    else winners.push(m.squadA); // tiebreak: default to squadA
  }

  if (winners.length < 2) return; // Final already played

  // Determine next round label
  let nextRoundLabel;
  if (winners.length === 2) {
    nextRoundLabel = 'Final';
  } else if (winners.length <= 4) {
    nextRoundLabel = 'Semi Final';
  } else if (winners.length <= 8) {
    nextRoundLabel = 'Quarter Final';
  } else {
    const roundNum = parseInt(currentRound.replace(/\D/g, '')) || 1;
    nextRoundLabel = `Round ${roundNum + 1}`;
  }

  // Check if next round matches already exist
  const existingNext = await Match.find({
    sportId: completedMatch.sportId,
    round: nextRoundLabel,
  }).lean();
  if (existingNext.length > 0) return;

  // Create next round matches by pairing winners
  const nextMatches = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      nextMatches.push({
        sportId: completedMatch.sportId,
        squadA: winners[i],
        squadB: winners[i + 1],
        round: nextRoundLabel,
        status: 'upcoming',
      });
    }
  }

  if (nextMatches.length > 0) {
    await Match.insertMany(nextMatches);
  }
}

// ============ TOURNAMENT GENERATION ============

export async function generateTournamentMatches(sportId) {
  await dbConnect();
  const sport = await Sport.findById(sportId).lean();
  if (!sport) throw new Error('Sport not found');

  const squads = await Squad.find({ sportId }).lean();
  if (squads.length < 2) throw new Error('Need at least 2 squads to generate matches');

  // Clear existing matches for this sport
  await Match.deleteMany({ sportId });

  let matches = [];

  switch (sport.tournamentFormat) {
    case 'knockout':
      matches = generateKnockout(squads, sportId);
      break;
    case 'round_robin':
      matches = generateRoundRobin(squads, sportId);
      break;
    case 'double_round_robin':
      matches = generateDoubleRoundRobin(squads, sportId);
      break;
    case 'hybrid':
      matches = generateHybrid(sport, squads, sportId);
      break;
    default:
      throw new Error('Unknown tournament format');
  }

  const created = await Match.insertMany(matches);
  await Sport.findByIdAndUpdate(sportId, { tournamentGenerated: true });

  return JSON.parse(JSON.stringify(created));
}

function generateKnockout(squads, sportId) {
  const matches = [];
  const n = squads.length;
  const totalRounds = Math.ceil(Math.log2(n));
  const totalSlots = Math.pow(2, totalRounds);
  const byes = totalSlots - n;

  let squadIndex = 0;

  for (let i = 0; i < totalSlots / 2; i++) {
    if (i < byes) continue;
    const a = squads[squadIndex++];
    const b = squads[squadIndex++];
    if (a && b) {
      matches.push({
        sportId,
        squadA: a._id,
        squadB: b._id,
        round: 'Round 1',
        status: 'upcoming',
      });
    }
  }

  return matches;
}

function generateRoundRobin(squads, sportId) {
  const matches = [];
  for (let i = 0; i < squads.length; i++) {
    for (let j = i + 1; j < squads.length; j++) {
      matches.push({
        sportId,
        squadA: squads[i]._id,
        squadB: squads[j]._id,
        round: 'Group Stage',
        group: squads[i].groupLabel || '',
        status: 'upcoming',
      });
    }
  }
  return matches;
}

function generateDoubleRoundRobin(squads, sportId) {
  const matches = [];
  for (let i = 0; i < squads.length; i++) {
    for (let j = i + 1; j < squads.length; j++) {
      matches.push({
        sportId,
        squadA: squads[i]._id,
        squadB: squads[j]._id,
        round: 'Leg 1',
        group: squads[i].groupLabel || '',
        status: 'upcoming',
      });
      matches.push({
        sportId,
        squadA: squads[j]._id,
        squadB: squads[i]._id,
        round: 'Leg 2',
        group: squads[j].groupLabel || '',
        status: 'upcoming',
      });
    }
  }
  return matches;
}

function generateHybrid(sport, squads, sportId) {
  const matches = [];

  if (sport.groups && sport.groups.length > 0) {
    for (const group of sport.groups) {
      const groupSquads = squads.filter(s =>
        group.squads.some(gs => gs.toString() === s._id.toString())
      );
      for (let i = 0; i < groupSquads.length; i++) {
        for (let j = i + 1; j < groupSquads.length; j++) {
          matches.push({
            sportId,
            squadA: groupSquads[i]._id,
            squadB: groupSquads[j]._id,
            round: 'Group Stage',
            group: group.label,
            status: 'upcoming',
          });
        }
      }
    }
  } else {
    return generateRoundRobin(squads, sportId);
  }

  return matches;
}
