'use server';

import dbConnect from '@/lib/mongodb';
import Squad from '@/models/Squad';

export async function getSquads(sportId) {
  await dbConnect();
  const filter = sportId ? { sportId } : {};
  const squads = await Squad.find(filter)
    .populate('teamId')
    .populate('players')
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(squads));
}

export async function getSquadsByTeam(teamId) {
  await dbConnect();
  const squads = await Squad.find({ teamId })
    .populate('sportId')
    .populate('players')
    .lean();
  return JSON.parse(JSON.stringify(squads));
}

export async function createSquad(data) {
  await dbConnect();
  const existing = await Squad.findOne({ teamId: data.teamId, sportId: data.sportId });
  if (existing) {
    throw new Error('Squad already exists for this team and sport');
  }
  const squad = await Squad.create({
    teamId: data.teamId,
    sportId: data.sportId,
    players: data.players || [],
  });
  return JSON.parse(JSON.stringify(squad));
}

export async function updateSquad(id, data) {
  await dbConnect();
  const updateData = {};
  if (data.players !== undefined) updateData.players = data.players;
  if (data.groupLabel !== undefined) updateData.groupLabel = data.groupLabel;
  const squad = await Squad.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return JSON.parse(JSON.stringify(squad));
}

export async function deleteSquad(id) {
  await dbConnect();
  await Squad.findByIdAndDelete(id);
  return { success: true };
}
