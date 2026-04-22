import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Squad from '@/models/Squad';
import Team from '@/models/Team';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sportId = searchParams.get('sportId');
    if (!sportId) return NextResponse.json([], { status: 400 });

    const matches = await Match.find({ sportId })
      .populate({ path: 'squadA', populate: { path: 'teamId' } })
      .populate({ path: 'squadB', populate: { path: 'teamId' } })
      .lean();

    const standings = {};

    for (const match of matches) {
      if (match.status !== 'completed') continue;
      
      const teamA = match.squadA?.teamId?.name || 'Unknown';
      const teamB = match.squadB?.teamId?.name || 'Unknown';
      const idA = match.squadA?.teamId?._id?.toString() || 'a';
      const idB = match.squadB?.teamId?._id?.toString() || 'b';

      if (!standings[idA]) standings[idA] = { team: teamA, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
      if (!standings[idB]) standings[idB] = { team: teamB, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };

      standings[idA].played++;
      standings[idB].played++;
      standings[idA].gf += match.scoreA;
      standings[idA].ga += match.scoreB;
      standings[idB].gf += match.scoreB;
      standings[idB].ga += match.scoreA;

      if (match.scoreA > match.scoreB) {
        standings[idA].won++;
        standings[idA].points += 3;
        standings[idB].lost++;
      } else if (match.scoreB > match.scoreA) {
        standings[idB].won++;
        standings[idB].points += 3;
        standings[idA].lost++;
      } else {
        standings[idA].drawn++;
        standings[idB].drawn++;
        standings[idA].points += 1;
        standings[idB].points += 1;
      }
    }

    const allSquads = await Squad.find({ sportId }).populate('teamId').lean();
    for (const sq of allSquads) {
      const id = sq.teamId?._id?.toString();
      if (id && !standings[id]) {
        standings[id] = { team: sq.teamId?.name || 'Unknown', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
      }
    }

    const sorted = Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });

    return NextResponse.json(sorted);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
