import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

export async function GET() {
  try {
    await dbConnect();
    const events = await Event.find({ status: { $in: ['active', 'draft'] } })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
