const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/problemController');
const { protect, authorizeRoles, requireVerifiedEmail } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Route: GET /api/problems/public-stats
// Description: Get public impact statistics (totals, status, categories, locations)
// Access: Public (no auth required)
router.get('/public-stats', getPublicStats);

// Route: GET /api/problems/media/:filename
// Description: Securely stream uploaded photo or video evidence
// Access: Private (owner citizen, university, industry, admin)
router.get('/media/:filename', getMediaFile);

// Route: GET /api/problems/my-submissions
// Description: Citizen views only their own submitted problems
// Access: Private (role "citizen")
router.get('/my-submissions', protect, authorizeRoles('citizen'), getMySubmissions);

// Route: GET /api/problems/assigned
// Description: University/Industry views problems assigned to their institution
// Access: Private (role "university", "industry")
router.get('/assigned', protect, authorizeRoles('university', 'industry'), getAssignedProblems);

// Route: POST /api/problems
// Description: Citizen submits a new problem with optional media uploads
// Access: Private (role "citizen" with verified email)
router.post(
  '/',
  protect,
  requireVerifiedEmail,
  authorizeRoles('citizen'),
  upload.array('media', 5),
  createProblem
);

// Route: GET /api/problems
// Description: Catalog of problems with filtering for academic & industry partners
// Access: Private (role "university", "industry", "admin")
router.get('/', protect, authorizeRoles('university', 'industry', 'admin'), getProblems);

// Route: GET /api/problems/:id
// Description: Get details of a single problem by ID (citizen can view own, partners view assigned, admin views all)
// Access: Private
router.get('/:id', protect, getProblemById);

// Route: PUT /api/problems/:id/accept
// Description: Institution accepts an assignment
// Access: Private (role "university", "industry")
router.put('/:id/accept', protect, authorizeRoles('university', 'industry'), acceptProblem);

// Route: PUT /api/problems/:id/start
// Description: Institution marks problem work started (In Progress)
// Access: Private (role "university", "industry")
router.put('/:id/start', protect, authorizeRoles('university', 'industry'), startProblemWork);

// Route: POST /api/problems/:id/progress
// Description: Post milestone progress update
// Access: Private (role "university", "industry", "admin")
router.post('/:id/progress', protect, authorizeRoles('university', 'industry', 'admin'), addProgressUpdate);

// Route: POST /api/problems/:id/solution
// Description: Submit developed solution for Government verification
// Access: Private (role "university", "industry")
router.post('/:id/solution', protect, authorizeRoles('university', 'industry'), submitSolution);

// Route: PUT /api/problems/:id/assign
// Description: Legacy adoption route (preserved)
// Access: Private (role "university" with verified email)
router.put('/:id/assign', protect, requireVerifiedEmail, authorizeRoles('university'), assignProblem);

// Route: PUT /api/problems/:id/status
// Description: Update problem status in lifecycle
// Access: Private (role "university", "industry", "admin")
router.put(
  '/:id/status',
  protect,
  authorizeRoles('university', 'industry', 'admin'),
  updateProblemStatus
);

module.exports = router;
