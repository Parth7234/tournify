import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Sport from '@/models/Sport';
import Squad from '@/models/Squad';
import Event from '@/models/Event';
import Medal from '@/models/Medal';

export async function POST() {
  try {
    await dbConnect();

    // Clear existing medals to recalculate
    await Medal.deleteMany({});

    const sports = await Sport.find({}).lean();
    const results = [];

    for (const sport of sports) {
      const allMatches = await Match.find({ sportId: sport._id }).lean();
      if (allMatches.length === 0) continue;

      const allDone = allMatches.every(m => m.status === 'completed');
      if (!allDone) {
        results.push({ sport: sport.name, status: 'skipped — not all matches completed' });
        continue;
      }

      const format = sport.tournamentFormat;
      const eventId = sport.eventId;
      const sportId = sport._id;

      if (format === 'knockout') {
        const finalMatch = allMatches.find(m => m.round === 'Final');
        if (!finalMatch) {
          results.push({ sport: sport.name, status: 'skipped — no Final match found' });
          continue;
        }

        const squadA = await Squad.findById(finalMatch.squadA).populate('teamId').lean();
        const squadB = await Squad.findById(finalMatch.squadB).populate('teamId').lean();
        if (!squadA || !squadB) {
          results.push({ sport: sport.name, status: 'skipped — squads not found' });
          continue;
        }

        let goldTeam, silverTeam, goldName, silverName;
        if (finalMatch.scoreA > finalMatch.scoreB) {
          goldTeam = squadA.teamId._id; goldName = squadA.teamId.name;
          silverTeam = squadB.teamId._id; silverName = squadB.teamId.name;
        } else if (finalMatch.scoreB > finalMatch.scoreA) {
          goldTeam = squadB.teamId._id; goldName = squadB.teamId.name;
          silverTeam = squadA.teamId._id; silverName = squadA.teamId.name;
        } else {
          goldTeam = squadA.teamId._id; goldName = squadA.teamId.name;
          silverTeam = squadB.teamId._id; silverName = squadB.teamId.name;
        }

        const medals = [
          { eventId, sportId, teamId: goldTeam, medal: 'gold' },
          { eventId, sportId, teamId: silverTeam, medal: 'silver' },
        ];

        // Bronze from semi-final losers
        const semiFinals = allMatches.filter(m => m.round === 'Semi Final');
        if (semiFinals.length >= 1) {
          const finalists = [finalMatch.squadA.toString(), finalMatch.squadB.toString()];
          for (const sf of semiFinals) {
            let loserSquadId;
            if (sf.scoreA > sf.scoreB) loserSquadId = sf.squadB;
            else if (sf.scoreB > sf.scoreA) loserSquadId = sf.squadA;
            else loserSquadId = sf.squadB;

            if (!finalists.includes(loserSquadId.toString())) {
              const loserSquad = await Squad.findById(loserSquadId).populate('teamId').lean();
              if (loserSquad) {
                medals.push({ eventId, sportId, teamId: loserSquad.teamId._id, medal: 'bronze' });
                break;
              }
            }
          }
        }

        await Medal.insertMany(medals);
        results.push({
          sport: sport.name,
          status: 'medals allocated',
          gold: goldName,
          silver: silverName,
          medals: medals.length,
        });

      } else {
        // Points-based
        const standings = {};
        for (const match of allMatches) {
          if (match.status !== 'completed') continue;
          const sA = await Squad.findById(match.squadA).populate('teamId').lean();
          const sB = await Squad.findById(match.squadB).populate('teamId').lean();
          if (!sA || !sB) continue;

          const idA = sA.teamId._id.toString();
          const idB = sB.teamId._id.toString();

          if (!standings[idA]) standings[idA] = { teamId: sA.teamId._id, name: sA.teamId.name, points: 0, gf: 0, ga: 0 };
          if (!standings[idB]) standings[idB] = { teamId: sB.teamId._id, name: sB.teamId.name, points: 0, gf: 0, ga: 0 };

          standings[idA].gf += match.scoreA;
          standings[idA].ga += match.scoreB;
          standings[idB].gf += match.scoreB;
          standings[idB].ga += match.scoreA;

          if (match.scoreA > match.scoreB) standings[idA].points += 3;
          else if (match.scoreB > match.scoreA) standings[idB].points += 3;
          else { standings[idA].points += 1; standings[idB].points += 1; }
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

        await Medal.insertMany(medals);
        results.push({
          sport: sport.name,
          status: 'medals allocated',
          gold: sorted[0]?.name,
          silver: sorted[1]?.name,
          bronze: sorted[2]?.name,
        });
      }
    }

    // Check event finalization
    const events = await Event.find({}).lean();
    for (const event of events) {
      const eventSports = await Sport.find({ eventId: event._id }).lean();
      if (eventSports.length === 0) continue;

      let allDone = true;
      for (const sp of eventSports) {
        if (!sp.tournamentGenerated) { allDone = false; break; }
        const sm = await Match.find({ sportId: sp._id }).lean();
        if (sm.length === 0 || !sm.every(m => m.status === 'completed')) { allDone = false; break; }
      }

      if (allDone && event.status !== 'ended') {
        await Event.findByIdAndUpdate(event._id, { status: 'ended' });
        results.push({ event: event.name, status: 'auto-ended' });
      }
    }

    return NextResponse.json({ message: 'Medals recalculated', results });
  } catch (error) {
    console.error('Recalculate error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
