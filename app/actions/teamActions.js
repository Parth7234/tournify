'use server';

import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';
import Player from '@/models/Player';

export async function getTeams(eventId) {
  await dbConnect();
  const filter = eventId ? { eventId } : {};
  const teams = await Team.find(filter).populate('optOutSports').sort({ name: 1 }).lean();
  return JSON.parse(JSON.stringify(teams));
}

export async function getTeam(id) {
  await dbConnect();
  const team = await Team.findById(id).lean();
  return JSON.parse(JSON.stringify(team));
}

export async function createTeam(data) {
  await dbConnect();
  const team = await Team.create({
    eventId: data.eventId,
    name: data.name,
    optOutSports: data.optOutSports || [],
  });
  return JSON.parse(JSON.stringify(team));
}

export async function updateTeam(id, data) {
  await dbConnect();
  const team = await Team.findByIdAndUpdate(id, {
    name: data.name,
    optOutSports: data.optOutSports || [],
  }, { new: true }).lean();
  return JSON.parse(JSON.stringify(team));
}

export async function deleteTeam(id) {
  await dbConnect();
  await Player.deleteMany({ teamId: id });
  await Team.findByIdAndDelete(id);
  return { success: true };
}

export async function getPlayers(teamId) {
  await dbConnect();
  const players = await Player.find({ teamId }).sort({ name: 1 }).lean();
  return JSON.parse(JSON.stringify(players));
}

export async function createPlayer(data) {
  await dbConnect();
  const player = await Player.create({
    name: data.name,
    teamId: data.teamId,
  });
  return JSON.parse(JSON.stringify(player));
}

export async function deletePlayer(id) {
  await dbConnect();
  await Player.findByIdAndDelete(id);
  return { success: true };
}
