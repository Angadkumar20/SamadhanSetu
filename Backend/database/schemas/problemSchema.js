const mongoose = require('mongoose');

/**
 * Problem Schema
 * Defines citizen-submitted civic and community problems, their AI-assigned category,
 * location, adopting university, and collaboration status.
 */
const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a problem title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a problem description'],
      trim: true,
    },
    category: {
      type: String,
      default: 'Uncategorized', // Automatically detected by AI service
      trim: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Problem must belong to a user (citizen)'],
      index: true,
    },
    assignedUniversity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    collaboratingIndustries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: {
        values: ['pending', 'assigned', 'in_progress', 'solved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for title and description search
problemSchema.index({ title: 'text', description: 'text' });

const Problem = mongoose.models.Problem || mongoose.model('Problem', problemSchema);

module.exports = {
  problemSchema,
  Problem,
};
