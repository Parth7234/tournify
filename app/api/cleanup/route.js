import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import Team from '@/models/Team';
import Sport from '@/models/Sport';
import Squad from '@/models/Squad';
import Match from '@/models/Match';
import Player from '@/models/Player';
import Medal from '@/models/Medal';

export async function POST() {
  try {
    await dbConnect();

    // Wipe everything except Users (admin stays)
    await Promise.all([
      Event.deleteMany({}),
      Team.deleteMany({}),
      Sport.deleteMany({}),
      Squad.deleteMany({}),
      Match.deleteMany({}),
      Player.deleteMany({}),
      Medal.deleteMany({}),
    ]);

    return NextResponse.json({
      message: 'Database cleaned. All events, teams, sports, squads, matches, players, and medals deleted. Admin user preserved.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
