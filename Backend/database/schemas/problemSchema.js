const mongoose = require('mongoose');

/**
 * Problem Schema
 * Defines citizen-submitted societal challenges, verification status,
 * AI classification, geographic coordinates, and media evidence.
 */
const mediaItemSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a problem title'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a problem description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
    },
    category: {
      type: String,
      default: 'Uncategorized',
      trim: true,
      index: true,
    },
    categorySource: {
      type: String,
      enum: ['citizen', 'ai'],
      default: 'citizen',
    },
    state: {
      type: String,
      default: 'Jharkhand',
      trim: true,
    },
    district: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    landmark: {
      type: String,
      default: '',
      trim: true,
    },
    // Flexible location to support both historical strings and geo-coordinate objects
    location: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ latitude: null, longitude: null, address: '' }),
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    // Photos & Video evidence (stored on disk, referenced by metadata)
    media: [mediaItemSchema],
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
        values: [
          'pending',
          'under_review',
          'approved',
          'assigned',
          'in_progress',
          'solution_submitted',
          'solved',
          'rejected',
        ],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },
    adminFeedback: {
      type: String,
      default: '',
      trim: true,
    },
    // Multi-institution assignment support (University, Industry, or Both)
    assignedInstitutions: [
      {
        institution: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['university', 'industry'],
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['assigned', 'accepted', 'in_progress', 'completed'],
          default: 'assigned',
        },
      },
    ],
    // Solution submission and verification
    solution: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      implementationDetails: { type: String, default: '', trim: true },
      expectedImpact: { type: String, default: '', trim: true },
      repositoryUrl: { type: String, default: '', trim: true },
      demoUrl: { type: String, default: '', trim: true },
      attachments: [
        {
          fileName: String,
          fileUrl: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      submittedAt: { type: Date },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      verifiedAt: { type: Date },
      verificationNotes: { type: String, default: '', trim: true },
      verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'changes_requested', 'rejected'],
        default: 'pending',
      },
    },
    // Periodic progress updates posted by assigned institution
    progressUpdates: [
      {
        message: { type: String, required: true, trim: true },
        progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
        postedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Audit timeline tracking all lifecycle transitions
    timeline: [
      {
        stage: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        note: { type: String, default: '' },
      },
    ],
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

// Search & filtering indexes
problemSchema.index({ title: 'text', description: 'text' });
problemSchema.index({ district: 1, category: 1, status: 1 });
problemSchema.index({ createdAt: -1 });

const Problem = mongoose.models.Problem || mongoose.model('Problem', problemSchema);

module.exports = {
  problemSchema,
  Problem,
};
