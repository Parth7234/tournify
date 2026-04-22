import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import Team from '@/models/Team';
import Sport from '@/models/Sport';
import Match from '@/models/Match';

export async function GET() {
  try {
    await dbConnect();
    const [events, teams, sports, liveMatches, upcomingMatches, completedMatches] = await Promise.all([
      Event.countDocuments(),
      Team.countDocuments(),
      Sport.countDocuments(),
      Match.countDocuments({ status: 'live' }),
      Match.countDocuments({ status: 'upcoming' }),
      Match.countDocuments({ status: 'completed' }),
    ]);
    return NextResponse.json({ events, teams, sports, liveMatches, upcomingMatches, completedMatches });
  } catch (error) {
    return NextResponse.json({ events: 0, teams: 0, sports: 0, liveMatches: 0, upcomingMatches: 0, completedMatches: 0 }, { status: 500 });
  }
}
