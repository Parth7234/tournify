import mongoose from 'mongoose';

const GoalScorerSchema = new mongoose.Schema({
  player: { type: String, required: true },
  team: { type: String, enum: ['A', 'B'], required: true },
  minute: { type: String, default: '' },
}, { _id: true });

const MatchEventSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    required: true,
  },
  player: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['goal', 'foul', 'card', 'substitution', 'timeout', 'other'],
    default: 'other',
  },
}, { _id: true });

const MatchSchema = new mongoose.Schema({
  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  squadA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Squad',
    required: true,
  },
  squadB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Squad',
    required: true,
  },
  scoreA: {
    type: Number,
    default: 0,
  },
  scoreB: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed'],
    default: 'upcoming',
  },
  round: {
    type: String,
    default: '',
  },
  group: {
    type: String,
    default: '',
  },
  scheduledAt: {
    type: Date,
  },
  matchEvents: [MatchEventSchema],
  goalScorers: [GoalScorerSchema],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Squad',
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
