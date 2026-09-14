const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Problem = require('../models/Problem');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { classifyProblem } = require('../utils/classifier');
const { uploadDir } = require('../middleware/uploadMiddleware');

/**
 * @desc    Create a new problem with optional media uploads (Citizen only)
 * @route   POST /api/problems
 * @access  Private (Citizen with verified email)
 */
const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      category: requestedCategory,
      state,
      district,
      landmark,
      latitude,
      longitude,
    } = req.body;

    // 1. Validate required inputs
    if (!title || !description) {
      return res.status(400).json({
        message: 'Please provide both title and description for the problem.',
      });
    }

    const trimmedTitle = String(title).trim();
    const trimmedDescription = String(description).trim();

    if (trimmedTitle.length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters long.' });
    }
    if (trimmedDescription.length < 10) {
      return res.status(400).json({ message: 'Description must be at least 10 characters long.' });
    }

    // 2. Determine Category (User choice vs AI suggestion)
    let finalCategory = requestedCategory && requestedCategory.trim() !== '' && requestedCategory !== 'auto'
      ? requestedCategory.trim()
      : null;
    let categorySource = 'citizen';

    if (!finalCategory) {
      finalCategory = await classifyProblem(trimmedTitle, trimmedDescription);
      categorySource = 'ai';
    }

    // 3. Process Coordinates & Location
    const parsedLat = latitude && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : null;
    const parsedLng = longitude && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null;

    const locationObj = {
      latitude: parsedLat,
      longitude: parsedLng,
      address: [landmark, district, state || 'Jharkhand'].filter(Boolean).join(', '),
    };

    // 4. Process Uploaded Media Evidence (from multer)
    const mediaItems = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        mediaItems.push({
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/api/problems/media/${file.filename}`,
          uploadedAt: new Date(),
        });
      }
    }

    // 5. Create Problem in Database
    const problem = await Problem.create({
      title: trimmedTitle,
      description: trimmedDescription,
      category: finalCategory,
      categorySource,
      state: state ? String(state).trim() : 'Jharkhand',
      district: district ? String(district).trim() : '',
      landmark: landmark ? String(landmark).trim() : '',
      location: locationObj,
      latitude: parsedLat,
      longitude: parsedLng,
      media: mediaItems,
      imageUrl: mediaItems.length > 0 ? mediaItems[0].url : '',
      submittedBy: req.user._id,
      status: 'pending',
      timeline: [
        {
          stage: 'submitted',
          timestamp: new Date(),
          updatedBy: req.user._id,
          note: 'Problem reported by citizen via 3-step submission portal.',
        },
      ],
    });

    // 6. Record Notification for the Citizen
    try {
      await Notification.create({
        recipient: req.user._id,
        problem: problem._id,
        title: 'Problem Submitted',
        message: `Your challenge "${problem.title}" has been registered (Ref: ${problem._id}) and queued for administrative review.`,
        type: 'problem_submitted',
      });
    } catch (notifErr) {
      console.warn('Non-blocking notification error:', notifErr.message);
    }

    return res.status(201).json({
      message: 'Problem submitted successfully',
      referenceId: problem._id,
      problem,
    });
  } catch (error) {
    console.error('Create problem error:', error.message);
    return res.status(500).json({
      message: 'Server error creating problem',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all problems submitted by the currently logged-in citizen
 * @route   GET /api/problems/my-submissions
 * @access  Private (Citizen)
 */
const getMySubmissions = async (req, res) => {
  try {
    const problems = await Problem.find({ submittedBy: req.user._id })
      .populate('assignedUniversity', 'name organization role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: problems.length,
      problems,
    });
  } catch (error) {
    console.error('Get my submissions error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving your submissions',
      error: error.message,
    });
  }
};

/**
 * @desc    Get catalog of problems for Universities & Industry with filtering
 * @route   GET /api/problems
 * @access  Private (University / Industry)
 */
const getProblems = async (req, res) => {
  try {
    const { category, district, status, search } = req.query;
    const filter = {};

    // Closed Verified Network enforcement:
    // Universities and industries can ONLY browse problems assigned to them by Government Admin.
    if (req.user.role === 'university') {
      filter.$or = [
        { assignedUniversity: req.user._id },
        { 'assignedInstitutions.institution': req.user._id },
      ];
    } else if (req.user.role === 'industry') {
      filter.$or = [
        { collaboratingIndustries: req.user._id },
        { 'assignedInstitutions.institution': req.user._id },
      ];
    }

    // Apply filters
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (district && district !== 'All') {
      filter.district = district;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search && search.trim() !== '') {
      filter.$text = { $search: search.trim() };
    }

    // Fetch problems without exposing citizen sensitive private information
    const problems = await Problem.find(filter)
      .select('-__v')
      .populate('submittedBy', 'name role')
      .populate('assignedUniversity', 'name role organization')
      .populate('collaboratingIndustries', 'name role organization')
      .populate('assignedInstitutions.institution', 'name role organization')
      .populate('solution.submittedBy', 'name role organization')
      .sort({ createdAt: -1 });

    return res.status(200).json(problems);
  } catch (error) {
    console.error('Get problems error:', error.message);
    return res.status(500).json({
      message: 'Server error fetching problems catalog',
      error: error.message,
    });
  }
};

/**
 * @desc    Get details of a single problem by ID with role-based access
 * @route   GET /api/problems/:id
 * @access  Private
 */
const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('submittedBy', 'name role')
      .populate('assignedUniversity', 'name role organization')
      .populate('collaboratingIndustries', 'name role organization')
      .populate('assignedInstitutions.institution', 'name role organization')
      .populate('solution.submittedBy', 'name role organization')
      .populate('progressUpdates.postedBy', 'name role organization')
      .populate('timeline.updatedBy', 'name role');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Role check: Citizens can only access their own submissions
    if (
      req.user.role === 'citizen' &&
      !problem.submittedBy._id.equals(req.user._id)
    ) {
      return res.status(403).json({
        message: 'Access denied. Citizens can only view their own submissions.',
      });
    }

    // Role check: University/Industry can only view if assigned
    if (['university', 'industry'].includes(req.user.role)) {
      const isAssigned =
        (problem.assignedUniversity && problem.assignedUniversity.equals(req.user._id)) ||
        (problem.collaboratingIndustries &&
          problem.collaboratingIndustries.some((id) => id.equals(req.user._id))) ||
        (problem.assignedInstitutions &&
          problem.assignedInstitutions.some((item) =>
            item.institution && item.institution._id
              ? item.institution._id.equals(req.user._id)
              : item.institution.equals(req.user._id)
          ));

      if (!isAssigned) {
        return res.status(403).json({
          message: 'Access denied. This problem has not been assigned to your institution by Government Administration.',
        });
      }
    }

    return res.status(200).json(problem);
  } catch (error) {
    console.error('Get problem by id error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Problem not found with given ID' });
    }
    return res.status(500).json({
      message: 'Server error retrieving problem details',
      error: error.message,
    });
  }
};

/**
 * @desc    Securely serve media evidence files with authentication verification
 * @route   GET /api/problems/media/:filename
 * @access  Private
 */
const getMediaFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // Check token from Authorization header OR query parameter (for img / video tags)
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access token required to view media evidence' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ message: 'Invalid or expired media access token' });
    }

    const requestingUser = await User.findById(decoded.id);
    if (!requestingUser) {
      return res.status(401).json({ message: 'User not recognized' });
    }

    // Verify problem ownership or institutional privilege
    const problem = await Problem.findOne({ 'media.filename': filename });
    if (!problem) {
      return res.status(404).json({ message: 'Evidence media file not found' });
    }

    // If citizen, verify ownership
    if (
      requestingUser.role === 'citizen' &&
      !problem.submittedBy.equals(requestingUser._id)
    ) {
      return res.status(403).json({ message: 'Access denied to this media evidence' });
    }

    const filePath = path.join(uploadDir, path.basename(filename));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Media file no longer exists on server disk' });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error('Serve media error:', error.message);
    return res.status(500).json({ message: 'Server error serving media file' });
  }
};

/**
 * @desc    University assigns a problem to itself
 * @route   PUT /api/problems/:id/assign
 * @access  Private (University only with verified email)
 */
const assignProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (problem.assignedUniversity) {
      return res.status(400).json({
        message: 'This problem is already assigned to a university institution',
      });
    }

    problem.assignedUniversity = req.user._id;
    problem.status = 'assigned';
    await problem.save();

    // Create Notification for the Citizen
    try {
      await Notification.create({
        recipient: problem.submittedBy,
        problem: problem._id,
        title: 'Problem Adopted by University',
        message: `Your challenge "${problem.title}" has been adopted by ${req.user.name || 'a verified university'} for research and development.`,
        type: 'problem_assigned',
      });
    } catch (e) {
      console.warn('Non-blocking notification error:', e.message);
    }

    await problem.populate('submittedBy', 'name email role');
    await problem.populate('assignedUniversity', 'name email role organization');

    return res.status(200).json({
      message: 'Problem adopted successfully by university',
      problem,
    });
  } catch (error) {
    console.error('Assign problem error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Problem not found' });
    }
    return res.status(500).json({
      message: 'Server error assigning problem',
      error: error.message,
    });
  }
};

/**
 * @desc    Get problems assigned to the logged-in University or Industry
 * @route   GET /api/problems/assigned
 * @access  Private (University / Industry)
 */
const getAssignedProblems = async (req, res) => {
  try {
    const filter = {
      $or: [
        { assignedUniversity: req.user._id },
        { collaboratingIndustries: req.user._id },
        { 'assignedInstitutions.institution': req.user._id },
      ],
    };

    const problems = await Problem.find(filter)
      .populate('submittedBy', 'name email role')
      .populate('assignedUniversity', 'name role organization')
      .populate('collaboratingIndustries', 'name role organization')
      .populate('assignedInstitutions.institution', 'name role organization')
      .populate('solution.submittedBy', 'name role organization')
      .populate('progressUpdates.postedBy', 'name role organization')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      count: problems.length,
      problems,
    });
  } catch (error) {
    console.error('Get assigned problems error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving assigned problems',
      error: error.message,
    });
  }
};

/**
 * @desc    Accept assignment of a problem (Institution)
 * @route   PUT /api/problems/:id/accept
 * @access  Private (University / Industry)
 */
const acceptProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const isAssigned =
      (problem.assignedUniversity && problem.assignedUniversity.equals(req.user._id)) ||
      (problem.collaboratingIndustries && problem.collaboratingIndustries.some((id) => id.equals(req.user._id))) ||
      (problem.assignedInstitutions && problem.assignedInstitutions.some((item) => item.institution.equals(req.user._id)));

    if (!isAssigned && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'This problem is not assigned to your institution' });
    }

    if (problem.assignedInstitutions) {
      problem.assignedInstitutions.forEach((item) => {
        if (item.institution.equals(req.user._id)) {
          item.status = 'accepted';
        }
      });
    }

    problem.timeline.push({
      stage: 'accepted',
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: `${req.user.organization || req.user.name} accepted problem assignment.`,
    });

    await problem.save();

    return res.status(200).json({
      message: 'Assignment accepted successfully',
      problem,
    });
  } catch (error) {
    console.error('Accept problem error:', error.message);
    return res.status(500).json({
      message: 'Server error accepting problem assignment',
      error: error.message,
    });
  }
};

/**
 * @desc    Start work on an assigned problem (University / Industry)
 * @route   PUT /api/problems/:id/start
 * @access  Private (University / Industry)
 */
const startProblemWork = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const isAssigned =
      (problem.assignedUniversity && problem.assignedUniversity.equals(req.user._id)) ||
      (problem.collaboratingIndustries && problem.collaboratingIndustries.some((id) => id.equals(req.user._id))) ||
      (problem.assignedInstitutions && problem.assignedInstitutions.some((item) => item.institution.equals(req.user._id)));

    if (!isAssigned && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'This problem is not assigned to your institution' });
    }

    problem.status = 'in_progress';

    if (problem.assignedInstitutions) {
      problem.assignedInstitutions.forEach((item) => {
        if (item.institution.equals(req.user._id)) {
          item.status = 'in_progress';
        }
      });
    }

    problem.timeline.push({
      stage: 'work_started',
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: `Research & development initiated by ${req.user.organization || req.user.name}.`,
    });

    await problem.save();

    // Notify citizen
    try {
      await Notification.create({
        recipient: problem.submittedBy,
        problem: problem._id,
        title: 'Work Started on Your Problem',
        message: `${req.user.organization || req.user.name} has begun active research and engineering on "${problem.title}".`,
        type: 'work_started',
      });
    } catch (notifErr) {
      console.warn('Notification error:', notifErr.message);
    }

    return res.status(200).json({
      message: 'Problem marked as In Progress',
      problem,
    });
  } catch (error) {
    console.error('Start work error:', error.message);
    return res.status(500).json({
      message: 'Server error starting problem work',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a periodic progress update to an assigned problem
 * @route   POST /api/problems/:id/progress
 * @access  Private (University / Industry)
 */
const addProgressUpdate = async (req, res) => {
  try {
    const { message, progressPercentage } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Please provide a progress update message' });
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const isAssigned =
      (problem.assignedUniversity && problem.assignedUniversity.equals(req.user._id)) ||
      (problem.collaboratingIndustries && problem.collaboratingIndustries.some((id) => id.equals(req.user._id))) ||
      (problem.assignedInstitutions && problem.assignedInstitutions.some((item) => item.institution.equals(req.user._id)));

    if (!isAssigned && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to post updates for this problem' });
    }

    const pct = progressPercentage !== undefined && !isNaN(Number(progressPercentage))
      ? Math.min(100, Math.max(0, Number(progressPercentage)))
      : 0;

    problem.progressUpdates.push({
      message: message.trim(),
      progressPercentage: pct,
      postedBy: req.user._id,
      createdAt: new Date(),
    });

    problem.timeline.push({
      stage: 'progress_update',
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: `${message.trim()} (${pct}% progress)`,
    });

    await problem.save();

    // Simplified notification to citizen
    try {
      await Notification.create({
        recipient: problem.submittedBy,
        problem: problem._id,
        title: 'Progress Update on Your Problem',
        message: `Milestone update for "${problem.title}": ${message.trim()}`,
        type: 'progress_update',
      });
    } catch (notifErr) {
      console.warn('Notification error:', notifErr.message);
    }

    return res.status(200).json({
      message: 'Progress update added successfully',
      problem,
    });
  } catch (error) {
    console.error('Add progress update error:', error.message);
    return res.status(500).json({
      message: 'Server error adding progress update',
      error: error.message,
    });
  }
};

/**
 * @desc    Submit solution for Government Administrator verification
 * @route   POST /api/problems/:id/solution
 * @access  Private (University / Industry)
 */
const submitSolution = async (req, res) => {
  try {
    const {
      title,
      description,
      implementationDetails,
      expectedImpact,
      repositoryUrl,
      demoUrl,
      attachments,
    } = req.body;

    if (!title || !description || !implementationDetails || !expectedImpact) {
      return res.status(400).json({
        message: 'Please provide title, description, implementation details, and expected impact.',
      });
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const isAssigned =
      (problem.assignedUniversity && problem.assignedUniversity.equals(req.user._id)) ||
      (problem.collaboratingIndustries && problem.collaboratingIndustries.some((id) => id.equals(req.user._id))) ||
      (problem.assignedInstitutions && problem.assignedInstitutions.some((item) => item.institution.equals(req.user._id)));

    if (!isAssigned && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'This problem is not assigned to your institution' });
    }

    problem.solution = {
      title: title.trim(),
      description: description.trim(),
      implementationDetails: implementationDetails.trim(),
      expectedImpact: expectedImpact.trim(),
      repositoryUrl: repositoryUrl ? repositoryUrl.trim() : '',
      demoUrl: demoUrl ? demoUrl.trim() : '',
      attachments: attachments || [],
      submittedBy: req.user._id,
      submittedAt: new Date(),
      verificationStatus: 'pending',
    };

    problem.status = 'solution_submitted';

    problem.timeline.push({
      stage: 'solution_submitted',
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: `Solution "${title.trim()}" submitted for Government review by ${req.user.organization || req.user.name}.`,
    });

    await problem.save();

    // Notify citizen
    try {
      await Notification.create({
        recipient: problem.submittedBy,
        problem: problem._id,
        title: 'Solution Submitted for Review',
        message: `A complete solution for "${problem.title}" has been submitted and is currently undergoing Government verification.`,
        type: 'solution_submitted',
      });
    } catch (notifErr) {
      console.warn('Notification error:', notifErr.message);
    }

    // Notify Government Admins
    try {
      const admins = await User.find({ role: 'admin' });
      for (const adm of admins) {
        await Notification.create({
          recipient: adm._id,
          problem: problem._id,
          title: 'New Solution Awaiting Verification',
          message: `${req.user.name} (${req.user.organization || req.user.role}) has submitted a solution for "${problem.title}".`,
          type: 'solution_submitted',
        });
      }
    } catch (admNotifErr) {
      console.warn('Admin notification error:', admNotifErr.message);
    }

    return res.status(200).json({
      message: 'Solution submitted successfully and queued for Government verification',
      problem,
    });
  } catch (error) {
    console.error('Submit solution error:', error.message);
    return res.status(500).json({
      message: 'Server error submitting solution',
      error: error.message,
    });
  }
};

/**
 * @desc    Update problem status (Strict role control: only Admin can set Solved)
 * @route   PUT /api/problems/:id/status
 * @access  Private (University / Industry / Admin with verified email)
 */
const updateProblemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    // Non-admin users cannot manually mark problems solved; only government verification does that
    const allowedStatuses =
      req.user.role === 'admin'
        ? ['under_review', 'approved', 'assigned', 'in_progress', 'solution_submitted', 'solved', 'rejected']
        : ['assigned', 'in_progress', 'solution_submitted'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid or unauthorized status update. Allowed values for your role: ${allowedStatuses.join(', ')}`,
      });
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    problem.status = status;
    problem.timeline.push({
      stage: status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: `Status transitioned to ${status.replace('_', ' ')} by ${req.user.name}.`,
    });

    await problem.save();

    return res.status(200).json({
      message: 'Problem status updated successfully',
      problem,
    });
  } catch (error) {
    console.error('Update status error:', error.message);
    return res.status(500).json({
      message: 'Server error updating problem status',
      error: error.message,
    });
  }
};

/**
 * @desc    Get public impact statistics (for Impact Page)
 * @route   GET /api/problems/public-stats
 * @access  Public
 */
const getPublicStats = async (req, res) => {
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
      totalUniversities,
      totalIndustries,
      byCategory,
      byLocation,
      byStatus,
      recentSolvedProblems,
      problems,
    ] = await Promise.all([
      Problem.countDocuments(),
      Problem.countDocuments({ status: 'pending' }),
      Problem.countDocuments({ status: 'under_review' }),
      Problem.countDocuments({ status: 'approved' }),
      Problem.countDocuments({ status: 'assigned' }),
      Problem.countDocuments({ status: 'in_progress' }),
      Problem.countDocuments({ status: 'solution_submitted' }),
      Problem.countDocuments({ status: 'solved' }),
      User.countDocuments({ role: 'university' }),
      User.countDocuments({ role: 'industry' }),
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
      Problem.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Problem.find({ status: 'solved' })
        .select('title category district state createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5),
      Problem.find({})
        .select(
          'title category district state status assignedUniversity collaboratingIndustries assignedInstitutions solution.title solution.verificationStatus solution.expectedImpact createdAt updatedAt',
        )
        .populate('assignedUniversity', 'name organization role')
        .populate('collaboratingIndustries', 'name organization role')
        .populate('assignedInstitutions.institution', 'name organization role')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const resolutionRate =
      totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

    return res.status(200).json({
      totalProblems,
      pendingProblems,
      underReviewProblems,
      approvedProblems,
      assignedProblems,
      inProgressProblems,
      solutionSubmittedProblems,
      solvedProblems,
      resolutionRate,
      totalUniversities,
      totalIndustries,
      byCategory,
      byLocation,
      byStatus,
      recentSolvedProblems,
      problems,
      mostCommonCategory: byCategory[0]?._id || 'General',
      mostAffectedDistrict: byLocation[0]?._id || 'Ranchi',
    });
  } catch (error) {
    console.error('Get public stats error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving impact statistics',
      error: error.message,
    });
  }
};

module.exports = {
  createProblem,
  getMySubmissions,
  getProblems,
  getAssignedProblems,
  getProblemById,
  getMediaFile,
  assignProblem,
  acceptProblem,
  startProblemWork,
  addProgressUpdate,
  submitSolution,
  updateProblemStatus,
  getPublicStats,
};

