'use server';

import dbConnect from '@/lib/mongodb';
import Sport from '@/models/Sport';

export async function getSports(eventId) {
  await dbConnect();
  const filter = eventId ? { eventId } : {};
  const sports = await Sport.find(filter).sort({ name: 1 }).lean();
  return JSON.parse(JSON.stringify(sports));
}

export async function getSport(id) {
  await dbConnect();
  const sport = await Sport.findById(id).lean();
  return JSON.parse(JSON.stringify(sport));
}

export async function createSport(data) {
  await dbConnect();
  const sport = await Sport.create({
    eventId: data.eventId,
    name: data.name,
    tournamentFormat: data.tournamentFormat,
  });
  return JSON.parse(JSON.stringify(sport));
}

export async function updateSport(id, data) {
  await dbConnect();
  const updateData = {
    name: data.name,
    tournamentFormat: data.tournamentFormat,
  };
  if (data.groups !== undefined) {
    updateData.groups = data.groups;
  }
  if (data.tournamentGenerated !== undefined) {
    updateData.tournamentGenerated = data.tournamentGenerated;
  }
  const sport = await Sport.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return JSON.parse(JSON.stringify(sport));
}

export async function deleteSport(id) {
  await dbConnect();
  await Sport.findByIdAndDelete(id);
  return { success: true };
}
