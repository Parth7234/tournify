import mongoose from 'mongoose';

const SportSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a sport name'],
    trim: true,
  },
  tournamentFormat: {
    type: String,
    enum: ['knockout', 'round_robin', 'double_round_robin', 'hybrid'],
    required: true,
  },
  groups: [{
    label: { type: String, required: true },
    squads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Squad' }],
  }],
  tournamentGenerated: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Sport || mongoose.model('Sport', SportSchema);
