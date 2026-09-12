const express = require('express');
const router = express.Router();
const {
  createProblem,
  getProblems,
  getProblemById,
  assignProblem,
  updateProblemStatus,
} = require('../controllers/problemController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Route: POST /api/problems
// Description: Citizen submits a new problem (calls AI service to auto-classify)
// Access: Private (only role "citizen")
router.post('/', protect, authorizeRoles('citizen'), createProblem);

// Route: GET /api/problems
// Description: List problems (Citizen sees only their own; University & Industry see all)
// Access: Private (authenticated users)
router.get('/', protect, getProblems);

// Route: GET /api/problems/:id
// Description: Get details of a single problem by ID
// Access: Private (authenticated users)
router.get('/:id', protect, getProblemById);

// Route: PUT /api/problems/:id/assign
// Description: University assigns a problem to itself
// Access: Private (only role "university")
router.put('/:id/assign', protect, authorizeRoles('university'), assignProblem);

// Route: PUT /api/problems/:id/status
// Description: Update problem status to "in_progress" or "solved"
// Access: Private (only role "university" or "industry")
router.put('/:id/status', protect, authorizeRoles('university', 'industry'), updateProblemStatus);

module.exports = router;
