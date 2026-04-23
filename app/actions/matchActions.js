'use server';

import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Squad from '@/models/Squad';
import Sport from '@/models/Sport';
import Event from '@/models/Event';
import Team from '@/models/Team';
import Medal from '@/models/Medal';

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
    try {
      await checkSportCompletion(match);
    } catch (e) {
      console.error('Sport completion check error:', e);
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

// ============ EVENT FINALIZATION & MEDALS ============

async function checkSportCompletion(completedMatch) {
  const sportId = completedMatch.sportId._id || completedMatch.sportId;

  // Get all matches for this sport
  const allMatches = await Match.find({ sportId }).lean();
  const allDone = allMatches.length > 0 && allMatches.every(m => m.status === 'completed');
  if (!allDone) return;

  // All matches in this sport are done — allocate medals
  const sport = await Sport.findById(sportId).lean();
  if (!sport) return;

  await allocateMedals(sport, allMatches);

  // Now check if ALL sports in the event are finalized
  const allSports = await Sport.find({ eventId: sport.eventId }).lean();
  let eventComplete = true;

  for (const sp of allSports) {
    if (!sp.tournamentGenerated) { eventComplete = false; break; }
    const sportMatches = await Match.find({ sportId: sp._id }).lean();
    if (sportMatches.length === 0 || !sportMatches.every(m => m.status === 'completed')) {
      eventComplete = false;
      break;
    }
  }

  if (eventComplete) {
    await Event.findByIdAndUpdate(sport.eventId, { status: 'ended' });
  }
}

async function allocateMedals(sport, allMatches) {
  const sportId = sport._id;
  const eventId = sport.eventId;

  // Skip if medals already allocated for this sport
  const existing = await Medal.findOne({ sportId });
  if (existing) return;

  const format = sport.tournamentFormat;

  if (format === 'knockout') {
    // Find the Final match
    const finalMatch = allMatches.find(m => m.round === 'Final');
    if (!finalMatch) return;

    // Get squads to find teamIds
    const squadA = await Squad.findById(finalMatch.squadA).lean();
    const squadB = await Squad.findById(finalMatch.squadB).lean();
    if (!squadA || !squadB) return;

    let goldTeam, silverTeam;
    if (finalMatch.scoreA > finalMatch.scoreB) {
      goldTeam = squadA.teamId;
      silverTeam = squadB.teamId;
    } else if (finalMatch.scoreB > finalMatch.scoreA) {
      goldTeam = squadB.teamId;
      silverTeam = squadA.teamId;
    } else {
      // Draw in final — default to squadA as winner
      goldTeam = squadA.teamId;
      silverTeam = squadB.teamId;
    }

    const medals = [
      { eventId, sportId, teamId: goldTeam, medal: 'gold' },
      { eventId, sportId, teamId: silverTeam, medal: 'silver' },
    ];

    // Try to find a bronze (3rd place) — semi-final losers
    const semiFinals = allMatches.filter(m => m.round === 'Semi Final');
    if (semiFinals.length === 2) {
      // The two losers of semis who are NOT in the final
      const finalists = [finalMatch.squadA.toString(), finalMatch.squadB.toString()];
      for (const sf of semiFinals) {
        let loserSquadId;
        if (sf.scoreA > sf.scoreB) loserSquadId = sf.squadB;
        else if (sf.scoreB > sf.scoreA) loserSquadId = sf.squadA;
        else loserSquadId = sf.squadB;

        if (!finalists.includes(loserSquadId.toString())) {
          const loserSquad = await Squad.findById(loserSquadId).lean();
          if (loserSquad) {
            medals.push({ eventId, sportId, teamId: loserSquad.teamId, medal: 'bronze' });
            break; // Only one bronze
          }
        }
      }
    }

    try {
      await Medal.insertMany(medals, { ordered: false });
    } catch (e) {
      // Ignore duplicate key errors
      if (e.code !== 11000) console.error('Medal insert error:', e);
    }

  } else {
    // Points-based: round_robin, double_round_robin, hybrid
    // Compute standings
    const standings = {};
    for (const match of allMatches) {
      if (match.status !== 'completed') continue;
      const squadA = await Squad.findById(match.squadA).lean();
      const squadB = await Squad.findById(match.squadB).lean();
      if (!squadA || !squadB) continue;

      const idA = squadA.teamId.toString();
      const idB = squadB.teamId.toString();

      if (!standings[idA]) standings[idA] = { teamId: squadA.teamId, points: 0, gf: 0, ga: 0 };
      if (!standings[idB]) standings[idB] = { teamId: squadB.teamId, points: 0, gf: 0, ga: 0 };

      standings[idA].gf += match.scoreA;
      standings[idA].ga += match.scoreB;
      standings[idB].gf += match.scoreB;
      standings[idB].ga += match.scoreA;

      if (match.scoreA > match.scoreB) {
        standings[idA].points += 3;
      } else if (match.scoreB > match.scoreA) {
        standings[idB].points += 3;
      } else {
        standings[idA].points += 1;
        standings[idB].points += 1;
      }
    }

    const sorted = Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });

    const medals = [];
    if (sorted[0]) medals.push({ eventId, sportId, teamId: sorted[0].teamId, medal: 'gold' });
    if (sorted[1]) medals.push({ eventId, sportId, teamId: sorted[1].teamId, medal: 'silver' });
    if (sorted[2]) medals.push({ eventId, sportId, teamId: sorted[2].teamId, medal: 'bronze' });

    try {
      await Medal.insertMany(medals, { ordered: false });
    } catch (e) {
      if (e.code !== 11000) console.error('Medal insert error:', e);
    }
  }
}
