import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a player name'],
    trim: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);
