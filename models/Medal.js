import mongoose from 'mongoose';

const MedalSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  medal: {
    type: String,
    enum: ['gold', 'silver', 'bronze'],
    required: true,
  },
}, {
  timestamps: true,
});

// Prevent duplicate medals: one medal type per team per sport
MedalSchema.index({ sportId: 1, teamId: 1, medal: 1 }, { unique: true });

export default mongoose.models.Medal || mongoose.model('Medal', MedalSchema);
