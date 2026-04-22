import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Medal from '@/models/Medal';
import Team from '@/models/Team';
import Event from '@/models/Event';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const filter = {};
    if (eventId) filter.eventId = eventId;

    const medals = await Medal.find(filter)
      .populate('teamId')
      .populate('sportId')
      .lean();

    // Aggregate medals per team
    const teamMap = {};

    for (const m of medals) {
      const teamId = m.teamId?._id?.toString();
      if (!teamId) continue;

      if (!teamMap[teamId]) {
        teamMap[teamId] = {
          teamId,
          teamName: m.teamId?.name || 'Unknown',
          gold: 0,
          silver: 0,
          bronze: 0,
          details: [],
        };
      }

      if (m.medal === 'gold') teamMap[teamId].gold++;
      else if (m.medal === 'silver') teamMap[teamId].silver++;
      else if (m.medal === 'bronze') teamMap[teamId].bronze++;

      teamMap[teamId].details.push({
        sport: m.sportId?.name || 'Unknown',
        medal: m.medal,
      });
    }

    // Sort: Gold desc → Silver desc → Bronze desc
    const sorted = Object.values(teamMap).sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
