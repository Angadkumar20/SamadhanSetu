const mongoose = require('mongoose');

/**
 * Collaboration Schema
 * Defines partnerships where industry entities provide funding, mentorship, or technology
 * to universities working on civic challenges.
 */
const collaborationSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Collaboration must reference a problem'],
      index: true,
    },
    industryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Industry user reference required'],
      index: true,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    supportType: {
      type: String,
      enum: ['funding', 'mentorship', 'technology', 'infrastructure', 'internship', 'other'],
      default: 'mentorship',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Collaboration = mongoose.models.Collaboration || mongoose.model('Collaboration', collaborationSchema);

module.exports = {
  collaborationSchema,
  Collaboration,
};
