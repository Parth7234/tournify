'use server';

import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

export async function getEvents() {
  await dbConnect();
  const events = await Event.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(events));
}

export async function getEvent(id) {
  await dbConnect();
  const event = await Event.findById(id).lean();
  return JSON.parse(JSON.stringify(event));
}

export async function createEvent(data) {
  await dbConnect();
  const event = await Event.create({
    name: data.name,
    description: data.description || '',
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    status: data.status || 'draft',
  });
  return JSON.parse(JSON.stringify(event));
}

export async function updateEvent(id, data) {
  await dbConnect();
  const event = await Event.findByIdAndUpdate(id, {
    name: data.name,
    description: data.description,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    status: data.status,
  }, { new: true }).lean();
  return JSON.parse(JSON.stringify(event));
}

export async function deleteEvent(id) {
  await dbConnect();
  await Event.findByIdAndDelete(id);
  return { success: true };
}
