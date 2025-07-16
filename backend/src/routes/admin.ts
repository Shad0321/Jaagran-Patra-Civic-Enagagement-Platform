import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdminRole } from '../middleware/adminAuth';
import {
  // Dashboard
  getDashboardStats,

  // User Management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  exportUsers,

  // MLA Management
  getAllMLAs,
  createMLA,
  updateMLA,
  deleteMLA,

  // Member Management
  getAllMembers,
  createMember,
  updateMember,
  deleteMember,

  // Issue Management
  getAllIssuesAdmin,
  getIssueStats,
  updateIssueStatus,
  exportIssues,

  // News Management
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
  toggleNews,

  // Analytics
  getAnalytics,

  // Settings
  getSettings,
  updateSettings,

  // Location Management
  getStates,
  getConstituencies,
  getConstituencyDetails,
  getLocalBodies,
  initializeLocationData,
} from '../controllers/adminController';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Public MLA profiles route
router.get('/public/mlas', getAllMLAs);

// Apply authentication middleware to all admin routes
router.use(authenticate);

// TODO: Uncomment when admin role enforcement is needed
// router.use(requireAdminRole);

// Dashboard Routes
router.get('/dashboard', getDashboardStats);

// User Management Routes
router.get('/users', getAllUsers);
router.get('/users/export', exportUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// MLA Management Routes
const mlaUpload = upload.fields([{ name: 'avatar', maxCount: 1 }]);
router.get('/mlas', getAllMLAs);
router.post('/mlas', mlaUpload, createMLA);
router.put('/mlas/:id', mlaUpload, updateMLA);
router.delete('/mlas/:id', deleteMLA);

// Member Management Routes
router.get('/members', getAllMembers);
router.post('/members', createMember);
router.put('/members/:id', updateMember);
router.delete('/members/:id', deleteMember);

// Issue Management Routes
router.get('/issues', getAllIssuesAdmin);
router.get('/issues/stats', getIssueStats);
router.get('/issues/export', exportIssues);
router.put('/issues/:id/status', updateIssueStatus);

// News Management Routes
router.get('/news', getAllNews);
router.post('/news', createNews);
router.put('/news/:id', updateNews);
router.patch('/news/:id/toggle', toggleNews);
router.delete('/news/:id', deleteNews);

// Analytics Routes
router.get('/analytics', getAnalytics);

// Settings Routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Location Management Routes
router.get('/states', getStates);
router.get('/constituencies', getConstituencies);
router.get('/constituencies/:id', getConstituencyDetails);
router.get('/local-bodies', getLocalBodies);
router.post('/initialize-location-data', initializeLocationData);

export default router;
