const Problem = require('../models/Problem');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Helper to dispatch in-app notifications
 */
const sendNotification = async ({ recipient, problem, title, message, type }) => {
  try {
    if (!recipient) return;
    await Notification.create({
      recipient,
      problem: problem || null,
      title,
      message,
      type: type || 'system',
    });
  } catch (err) {
    console.warn('Notification dispatch error:', err.message);
  }
};

/**
 * @desc    Get complete administrative dashboard overview metrics
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalProblems,
      pendingProblems,
      underReviewProblems,
      approvedProblems,
      assignedProblems,
      inProgressProblems,
      solutionSubmittedProblems,
      solvedProblems,
      rejectedProblems,
      totalUniversities,
      totalIndustries,
      verifiedUniversities,
      verifiedIndustries,
      pendingInstitutions,
      categoryDistribution,
      districtDistribution,
      recentProblems,
      reviewQueue,
    ] = await Promise.all([
      Problem.countDocuments(),
      Problem.countDocuments({ status: 'pending' }),
      Problem.countDocuments({ status: 'under_review' }),
      Problem.countDocuments({ status: 'approved' }),
      Problem.countDocuments({ status: 'assigned' }),
      Problem.countDocuments({ status: 'in_progress' }),
      Problem.countDocuments({ status: 'solution_submitted' }),
      Problem.countDocuments({ status: 'solved' }),
      Problem.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'university' }),
      User.countDocuments({ role: 'industry' }),
      User.countDocuments({ role: 'university', isVerified: true }),
      User.countDocuments({ role: 'industry', isVerified: true }),
      User.countDocuments({
        role: { $in: ['university', 'industry'] },
        isVerified: { $ne: true },
      }),
      Problem.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Problem.aggregate([
        { $match: { district: { $ne: '' } } },
        { $group: { _id: '$district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 24 },
      ]),
      Problem.find()
        .populate('submittedBy', 'name email role organization')
        .populate('assignedUniversity', 'name organization')
        .sort({ createdAt: -1 })
        .limit(10),
      Problem.find({
        status: { $in: ['pending', 'under_review', 'solution_submitted'] },
      })
        .populate('submittedBy', 'name email role organization')
        .populate('solution.submittedBy', 'name organization role')
        .sort({ updatedAt: -1 })
        .limit(15),
    ]);

    const resolutionRate =
      totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

    return res.status(200).json({
      metrics: {
        totalProblems,
        pendingProblems,
        underReviewProblems,
        approvedProblems,
        assignedProblems,
        inProgressProblems,
        solutionSubmittedProblems,
        solvedProblems,
        rejectedProblems,
        resolutionRate,
        totalUniversities,
        totalIndustries,
        verifiedUniversities,
        verifiedIndustries,
        pendingInstitutions,
      },
      categoryDistribution,
      districtDistribution,
      recentProblems,
      reviewQueue,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving admin dashboard metrics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all problems with administrative filtering and pagination
 * @route   GET /api/admin/problems
 * @access  Private (Admin)
 */
const getAllProblems = async (req, res) => {
  try {
    const { status, category, district, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (district && district !== 'All') {
      filter.district = district;
    }
    if (search && search.trim() !== '') {
      filter.$text = { $search: search.trim() };
    }

    const problems = await Problem.find(filter)
      .populate('submittedBy', 'name email phone organization role')
      .populate('assignedUniversity', 'name organization phone email')
      .populate('collaboratingIndustries', 'name organization phone email')
      .populate('assignedInstitutions.institution', 'name organization role email phone')
      .populate('solution.submittedBy', 'name organization role email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: problems.length,
      problems,
    });
  } catch (error) {
    console.error('Admin get all problems error:', error.message);
    return res.status(500).json({
      message: 'Server error fetching problems for admin',
      error: error.message,
    });
  }
};

/**
 * @desc    Get details of a single problem for admin view
 * @route   GET /api/admin/problems/:id
 * @access  Private (Admin)
 */
const getAdminProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('submittedBy', 'name email phone organization role createdAt')
      .populate('assignedUniversity', 'name organization email phone isVerified')
      .populate('collaboratingIndustries', 'name organization email phone isVerified')
      .populate('assignedInstitutions.institution', 'name organization role email phone isVerified')
      .populate('solution.submittedBy', 'name organization role email')
      .populate('progressUpdates.postedBy', 'name organization role')
      .populate('timeline.updatedBy', 'name role');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    return res.status(200).json(problem);
  } catch (error) {
    console.error('Admin get problem by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Problem not found with given ID' });
    }
    return res.status(500).json({
      message: 'Server error retrieving problem details for admin',
      error: error.message,
    });
  }
};

/**
 * @desc    Review a citizen-submitted problem (Approve, Reject, or Request Info)
 * @route   PUT /api/admin/problems/:id/review
 * @access  Private (Admin)
 */
const reviewProblem = async (req, res) => {
  try {
    const { action, reason, message } = req.body;
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (!['approve', 'reject', 'request_info'].includes(action)) {
      return res.status(400).json({
        message: "Invalid action. Must be 'approve', 'reject', or 'request_info'",
      });
    }

    if (action === 'approve') {
      problem.status = 'approved';
      problem.adminFeedback = reason || 'Approved by Government Administrator for institutional assignment.';

      problem.timeline.push({
        stage: 'approved',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: 'Approved for institutional matching and resolution by Government Administrator.',
      });

      await problem.save();

      await sendNotification({
        recipient: problem.submittedBy,
        problem: problem._id,
        title: 'Problem Approved by Government',
        message: `Your reported problem "${problem.title}" has been reviewed and approved. It is now queued for assignment to verified researchers.`,
        type: 'problem_approved',
      });

      return res.status(200).json({
        message: 'Problem approved successfully',
        problem,
      });
    }

    if (action === 'reject') {
      problem.status = 'rejected';
      problem.adminFeedback = reason || 'Does not meet civic submission guidelines.';

      problem.timeline.push({
        stage: 'rejected',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: `Rejected: ${problem.adminFeedback}`,
      });

      await problem.save();

      await sendNotification({
        recipient: problem.submittedBy,
        problem: problem._id,
        title: 'Problem Update: Rejected',
        message: `Your reported problem "${problem.title}" was rejected. Reason: ${problem.adminFeedback}`,
        type: 'problem_rejected',
      });

      return res.status(200).json({
        message: 'Problem rejected',
        problem,
      });
    }

    if (action === 'request_info') {
      problem.status = 'under_review';
      problem.adminFeedback = message || 'Please provide additional details regarding location or impact.';

      problem.timeline.push({
        stage: 'under_review',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: `More info requested: ${problem.adminFeedback}`,
      });

      await problem.save();

      await sendNotification({
        recipient: problem.submittedBy,
        problem: problem._id,
        title: 'Additional Information Requested',
        message: `Government Admin requested clarification for "${problem.title}": ${problem.adminFeedback}`,
        type: 'more_info_requested',
      });

      return res.status(200).json({
        message: 'Information request sent to citizen',
        problem,
      });
    }
  } catch (error) {
    console.error('Admin review error:', error.message);
    return res.status(500).json({
      message: 'Server error processing problem review',
      error: error.message,
    });
  }
};

/**
 * @desc    Assign a problem to one or more verified institutions (University and/or Industry)
 * @route   PUT /api/admin/problems/:id/assign
 * @access  Private (Admin)
 */
const assignInstitutions = async (req, res) => {
  try {
    const { universityId, industryId, notes } = req.body;

    if (!universityId && !industryId) {
      return res.status(400).json({
        message: 'Please select at least one institution (University or Industry) for assignment',
      });
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const assignedNames = [];

    // Validate University if provided
    if (universityId) {
      const university = await User.findById(universityId);
      if (!university || university.role !== 'university') {
        return res.status(400).json({ message: 'Invalid university account selected' });
      }
      if (!university.isVerified) {
        return res.status(400).json({
          message: `University ${university.name} is not verified. Only verified institutions can receive assignments.`,
        });
      }

      problem.assignedUniversity = university._id;
      // Add or update in assignedInstitutions
      const exists = problem.assignedInstitutions.some((item) =>
        item.institution.equals(university._id)
      );
      if (!exists) {
        problem.assignedInstitutions.push({
          institution: university._id,
          role: 'university',
          assignedAt: new Date(),
          status: 'assigned',
        });
      }
      assignedNames.push(university.name || 'University');

      // Notify university
      await sendNotification({
        recipient: university._id,
        problem: problem._id,
        title: 'New Problem Assigned by Government',
        message: `Government of Jharkhand has assigned the problem "${problem.title}" (${problem.district}) to your institution.`,
        type: 'problem_assigned',
      });
    }

    // Validate Industry if provided
    if (industryId) {
      const industry = await User.findById(industryId);
      if (!industry || industry.role !== 'industry') {
        return res.status(400).json({ message: 'Invalid industry account selected' });
      }
      if (!industry.isVerified) {
        return res.status(400).json({
          message: `Industry partner ${industry.name} is not verified. Only verified institutions can receive assignments.`,
        });
      }

      const existsInCollab = problem.collaboratingIndustries.some((id) => id.equals(industry._id));
      if (!existsInCollab) {
        problem.collaboratingIndustries.push(industry._id);
      }

      const existsInAssigned = problem.assignedInstitutions.some((item) =>
        item.institution.equals(industry._id)
      );
      if (!existsInAssigned) {
        problem.assignedInstitutions.push({
          institution: industry._id,
          role: 'industry',
          assignedAt: new Date(),
          status: 'assigned',
        });
      }
      assignedNames.push(industry.name || 'Industry');

      // Notify industry
      await sendNotification({
        recipient: industry._id,
        problem: problem._id,
        title: 'New Collaboration Opportunity Assigned',
        message: `Government of Jharkhand has invited your organization to collaborate on problem: "${problem.title}".`,
        type: 'problem_assigned',
      });
    }

    problem.status = 'assigned';

    problem.timeline.push({
      stage: 'assigned',
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: `Assigned to: ${assignedNames.join(', ')}. ${notes || ''}`.trim(),
    });

    await problem.save();

    // Notify citizen that problem is assigned
    await sendNotification({
      recipient: problem.submittedBy,
      problem: problem._id,
      title: 'Institution Assigned to Your Problem',
      message: `Government Administrator has assigned verified partners (${assignedNames.join(', ')}) to research and resolve your problem: "${problem.title}".`,
      type: 'problem_assigned',
    });

    return res.status(200).json({
      message: `Problem successfully assigned to ${assignedNames.join(' and ')}`,
      problem,
    });
  } catch (error) {
    console.error('Admin assignment error:', error.message);
    return res.status(500).json({
      message: 'Server error assigning institutions to problem',
      error: error.message,
    });
  }
};

/**
 * @desc    Get list of University & Industry accounts for verification management
 * @route   GET /api/admin/institutions
 * @access  Private (Admin)
 */
const getInstitutions = async (req, res) => {
  try {
    const { role, status } = req.query;
    const filter = { role: { $in: ['university', 'industry'] } };

    if (role && (role === 'university' || role === 'industry')) {
      filter.role = role;
    }
    if (status) {
      if (status === 'Verified') {
        filter.isVerified = true;
      } else if (status === 'Pending Verification') {
        filter.isVerified = { $ne: true };
        filter.verificationStatus = { $ne: 'Rejected' };
      } else if (status === 'Rejected') {
        filter.verificationStatus = 'Rejected';
      }
    }

    const institutions = await User.find(filter)
      .select('-password -emailVerificationToken -resetPasswordToken')
      .sort({ createdAt: -1 });

    const totalUniversities = await User.countDocuments({ role: 'university' });
    const totalIndustries = await User.countDocuments({ role: 'industry' });
    const verifiedCount = await User.countDocuments({
      role: { $in: ['university', 'industry'] },
      isVerified: true,
    });
    const pendingCount = await User.countDocuments({
      role: { $in: ['university', 'industry'] },
      isVerified: { $ne: true },
      verificationStatus: { $ne: 'Rejected' },
    });

    return res.status(200).json({
      institutions,
      counts: {
        totalUniversities,
        totalIndustries,
        verifiedCount,
        pendingCount,
      },
    });
  } catch (error) {
    console.error('Admin get institutions error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving institutions',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify or Reject University/Industry institutional account
 * @route   PUT /api/admin/institutions/:id/verify
 * @access  Private (Admin)
 */
const verifyInstitution = async (req, res) => {
  try {
    const { status, isActive } = req.body;

    if (!['Verified', 'Rejected', 'Pending Verification'].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'Verified', 'Rejected', or 'Pending Verification'",
      });
    }

    const institution = await User.findById(req.params.id);
    if (!institution || !['university', 'industry'].includes(institution.role)) {
      return res.status(404).json({ message: 'Institution account not found' });
    }

    institution.verificationStatus = status;
    institution.isVerified = status === 'Verified';

    if (isActive !== undefined) {
      institution.isActive = Boolean(isActive);
    }

    await institution.save();

    await sendNotification({
      recipient: institution._id,
      title: `Account Verification: ${status}`,
      message:
        status === 'Verified'
          ? 'Congratulations! Your institution has been verified by the Government of Jharkhand. You are now eligible to receive problem assignments.'
          : `Your institutional account verification status has been updated to "${status}".`,
      type: 'institution_verified',
    });

    return res.status(200).json({
      message: `Institution status updated to ${status}`,
      institution: {
        _id: institution._id,
        name: institution.name,
        role: institution.role,
        organization: institution.organization,
        isVerified: institution.isVerified,
        verificationStatus: institution.verificationStatus,
        isActive: institution.isActive,
      },
    });
  } catch (error) {
    console.error('Admin verify institution error:', error.message);
    return res.status(500).json({
      message: 'Server error verifying institution account',
      error: error.message,
    });
  }
};

/**
 * @desc    Review and Verify submitted solution (Approve, Request Changes, or Reject)
 * @route   PUT /api/admin/solutions/:id/review
 * @access  Private (Admin)
 */
const verifySolution = async (req, res) => {
  try {
    const { action, notes } = req.body;
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (!['approve', 'request_changes', 'reject'].includes(action)) {
      return res.status(400).json({
        message: "Action must be 'approve', 'request_changes', or 'reject'",
      });
    }

    if (action === 'approve') {
      problem.status = 'solved';
      problem.solution.verificationStatus = 'approved';
      problem.solution.verifiedBy = req.user._id;
      problem.solution.verifiedAt = new Date();
      problem.solution.verificationNotes = notes || 'Verified and approved by Government Administrator';

      problem.timeline.push({
        stage: 'government_verified',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: `Government verification approved: ${problem.solution.verificationNotes}`,
      });

      problem.timeline.push({
        stage: 'solved',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: 'Problem successfully resolved through university-industry collaboration.',
      });

      await problem.save();

      // Notify citizen that problem is officially Solved
      await sendNotification({
        recipient: problem.submittedBy,
        problem: problem._id,
        title: 'Problem Solved & Verified by Government!',
        message: `Your reported civic challenge "${problem.title}" has been successfully resolved and verified by the Government of Jharkhand. Thank you for making a difference!`,
        type: 'problem_solved',
      });

      // Notify solution submitter
      if (problem.solution.submittedBy) {
        await sendNotification({
          recipient: problem.solution.submittedBy,
          problem: problem._id,
          title: 'Solution Approved by Government',
          message: `Your submitted solution for "${problem.title}" has been verified and marked Solved. Outstanding work!`,
          type: 'solution_approved',
        });
      }

      return res.status(200).json({
        message: 'Solution verified and problem marked as Solved!',
        problem,
      });
    }

    if (action === 'request_changes') {
      problem.status = 'in_progress';
      problem.solution.verificationStatus = 'changes_requested';
      problem.solution.verificationNotes = notes || 'Revision required before official government sign-off.';

      problem.timeline.push({
        stage: 'in_progress',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: `Government revision requested: ${problem.solution.verificationNotes}`,
      });

      await problem.save();

      if (problem.solution.submittedBy) {
        await sendNotification({
          recipient: problem.solution.submittedBy,
          problem: problem._id,
          title: 'Solution Revision Requested',
          message: `Government Administrator requested changes on "${problem.title}": ${problem.solution.verificationNotes}`,
          type: 'solution_changes_requested',
        });
      }

      return res.status(200).json({
        message: 'Changes requested. Problem returned to In Progress state.',
        problem,
      });
    }

    if (action === 'reject') {
      problem.solution.verificationStatus = 'rejected';
      problem.solution.verificationNotes = notes || 'Solution rejected by Government Administrator';

      problem.timeline.push({
        stage: 'in_progress',
        timestamp: new Date(),
        updatedBy: req.user._id,
        note: `Solution rejected: ${problem.solution.verificationNotes}`,
      });

      await problem.save();

      if (problem.solution.submittedBy) {
        await sendNotification({
          recipient: problem.solution.submittedBy,
          problem: problem._id,
          title: 'Submitted Solution Rejected',
          message: `Your solution for "${problem.title}" was not approved: ${problem.solution.verificationNotes}`,
          type: 'solution_rejected',
        });
      }

      return res.status(200).json({
        message: 'Solution rejected. Status maintained in collaboration queue.',
        problem,
      });
    }
  } catch (error) {
    console.error('Admin verify solution error:', error.message);
    return res.status(500).json({
      message: 'Server error processing solution verification',
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAllProblems,
  getAdminProblemById,
  reviewProblem,
  assignInstitutions,
  getInstitutions,
  verifyInstitution,
  verifySolution,
};
