import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sport from '@/models/Sport';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const filter = eventId ? { eventId } : {};
    const sports = await Sport.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json(sports);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
