const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllProblems,
  getAdminProblemById,
  reviewProblem,
  assignInstitutions,
  getInstitutions,
  verifyInstitution,
  verifySolution,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All admin routes strictly require valid JWT and role 'admin'
router.use(protect, authorizeRoles('admin'));

// Route: GET /api/admin/dashboard
// Description: Summary counters, queues, and distributions
router.get('/dashboard', getAdminDashboard);

// Route: GET /api/admin/problems
// Description: All problems with administrative filters
router.get('/problems', getAllProblems);

// Route: GET /api/admin/problems/:id
// Description: Detailed single problem with timeline, solution, and assignments
router.get('/problems/:id', getAdminProblemById);

// Route: PUT /api/admin/problems/:id/review
// Description: Approve, reject, or request more information from citizen
router.put('/problems/:id/review', reviewProblem);

// Route: PUT /api/admin/problems/:id/assign
// Description: Assign verified University and/or Industry to a problem
router.put('/problems/:id/assign', assignInstitutions);

// Route: GET /api/admin/institutions
// Description: List universities and industries for verification management
router.get('/institutions', getInstitutions);

// Route: PUT /api/admin/institutions/:id/verify
// Description: Verify or reject institution account
router.put('/institutions/:id/verify', verifyInstitution);

// Route: PUT /api/admin/solutions/:id/review
// Description: Government verification of submitted solution (Approve/Request Changes/Reject)
router.put('/solutions/:id/review', verifySolution);

module.exports = router;
