import mongoose from 'mongoose';

const SquadSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  }],
  groupLabel: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

SquadSchema.index({ teamId: 1, sportId: 1 }, { unique: true });

export default mongoose.models.Squad || mongoose.model('Squad', SquadSchema);
