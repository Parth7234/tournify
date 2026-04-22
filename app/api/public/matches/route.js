import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import Squad from '@/models/Squad';
import Team from '@/models/Team';
import Sport from '@/models/Sport';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sportId = searchParams.get('sportId');
    const status = searchParams.get('status');
    const matchId = searchParams.get('matchId');

    if (matchId) {
      const match = await Match.findById(matchId)
        .populate({ path: 'squadA', populate: [{ path: 'teamId' }, { path: 'players' }] })
        .populate({ path: 'squadB', populate: [{ path: 'teamId' }, { path: 'players' }] })
        .populate('sportId')
        .lean();
      return NextResponse.json(match);
    }

    const filter = {};
    if (sportId) filter.sportId = sportId;
    if (status) filter.status = status;

    const matches = await Match.find(filter)
      .populate({ path: 'squadA', populate: { path: 'teamId' } })
      .populate({ path: 'squadB', populate: { path: 'teamId' } })
      .populate('sportId')
      .sort({ scheduledAt: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
