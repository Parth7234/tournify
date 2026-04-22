import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    trim: true,
  },
  optOutSports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
