const mongoose = require('mongoose');

/**
 * Solution Schema
 * Defines solutions developed by universities, students, or researchers for adopted civic problems.
 */
const solutionSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Solution must reference a problem'],
      index: true,
    },
    submittedByUniversity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Solution must be submitted by a university user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a solution title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a solution description'],
      trim: true,
    },
    repositoryUrl: {
      type: String,
      trim: true,
      default: '',
    },
    demoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'accepted', 'rejected'],
      default: 'draft',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Solution = mongoose.models.Solution || mongoose.model('Solution', solutionSchema);

module.exports = {
  solutionSchema,
  Solution,
};
