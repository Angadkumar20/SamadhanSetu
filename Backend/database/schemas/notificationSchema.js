const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'problem_submitted',
        'problem_under_review',
        'problem_approved',
        'more_info_requested',
        'problem_assigned',
        'assignment_accepted',
        'work_started',
        'progress_update',
        'solution_submitted',
        'solution_approved',
        'solution_changes_requested',
        'solution_rejected',
        'problem_solved',
        'problem_rejected',
        'institution_verified',
        'system',
      ],
      default: 'system',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

module.exports = {
  notificationSchema,
  Notification,
};
