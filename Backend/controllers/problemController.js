const axios = require('axios');
const Problem = require('../models/Problem');

// @desc    Create a new problem (Citizen only)
// @route   POST /api/problems
// @access  Private (Citizen)
const createProblem = async (req, res) => {
  try {
    const { title, description, location, imageUrl } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ message: 'Please provide both title and description' });
    }

    // Default category fallback
    let category = 'Uncategorized';
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';

    // Call external AI service to classify the problem
    try {
      const response = await axios.post(
        `${aiServiceUrl}/classify`,
        { title, description },
        { timeout: 3000 } // 3 second timeout so the backend never hangs if AI service is down
      );

      // If AI service successfully returns a category, assign it
      if (response.data && response.data.category) {
        category = response.data.category;
      }
    } catch (aiError) {
      // If AI service call fails for any reason, log a warning and use "Uncategorized"
      console.warn('AI service call failed or timed out. Falling back to "Uncategorized":', aiError.message);
    }

    // Save the problem to database with submittedBy set to logged-in citizen
    const problem = await Problem.create({
      title,
      description,
      category,
      location: location || '',
      imageUrl: imageUrl || '',
      submittedBy: req.user._id,
      status: 'pending',
    });

    res.status(201).json(problem);
  } catch (error) {
    console.error('Create problem error:', error.message);
    res.status(500).json({ message: 'Server error creating problem', error: error.message });
  }
};

// @desc    Get problems (Citizen sees own problems; University & Industry see all)
// @route   GET /api/problems
// @access  Private
const getProblems = async (req, res) => {
  try {
    let filter = {};

    // If role is citizen, only show problems submitted by this citizen
    if (req.user.role === 'citizen') {
      filter = { submittedBy: req.user._id };
    }
    // If role is university or industry, filter remains {} (all problems)

    const problems = await Problem.find(filter)
      .populate('submittedBy', 'name email role')
      .populate('assignedUniversity', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(problems);
  } catch (error) {
    console.error('Get problems error:', error.message);
    res.status(500).json({ message: 'Server error retrieving problems', error: error.message });
  }
};

// @desc    Get single problem by ID
// @route   GET /api/problems/:id
// @access  Private
const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('submittedBy', 'name email role')
      .populate('assignedUniversity', 'name email role');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.status(200).json(problem);
  } catch (error) {
    console.error('Get problem by ID error:', error.message);
    // If invalid ObjectId format
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Problem not found with given ID format' });
    }
    res.status(500).json({ message: 'Server error retrieving problem', error: error.message });
  }
};

// @desc    Assign problem to the logged-in university
// @route   PUT /api/problems/:id/assign
// @access  Private (University only)
const assignProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update assignment and status
    problem.assignedUniversity = req.user._id;
    problem.status = 'assigned';

    await problem.save();

    // Populate user info for response
    await problem.populate('submittedBy', 'name email role');
    await problem.populate('assignedUniversity', 'name email role');

    res.status(200).json({
      message: 'Problem assigned successfully',
      problem,
    });
  } catch (error) {
    console.error('Assign problem error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Problem not found with given ID format' });
    }
    res.status(500).json({ message: 'Server error assigning problem', error: error.message });
  }
};

// @desc    Update problem status (in_progress or solved)
// @route   PUT /api/problems/:id/status
// @access  Private (University or Industry)
const updateProblemStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate allowed statuses
    const allowedStatuses = ['in_progress', 'solved'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Status must be either "in_progress" or "solved"',
      });
    }

    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update status
    problem.status = status;
    await problem.save();

    // Populate user info for response
    await problem.populate('submittedBy', 'name email role');
    await problem.populate('assignedUniversity', 'name email role');

    res.status(200).json({
      message: 'Problem status updated successfully',
      problem,
    });
  } catch (error) {
    console.error('Update status error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Problem not found with given ID format' });
    }
    res.status(500).json({ message: 'Server error updating problem status', error: error.message });
  }
};

module.exports = {
  createProblem,
  getProblems,
  getProblemById,
  assignProblem,
  updateProblemStatus,
};
