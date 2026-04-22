import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an event name'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
