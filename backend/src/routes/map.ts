import { Router } from 'express';
import {
  getStates,
  getAssembliesByState,
  getPollingBoothsByAssembly,
  getPollingBoothDetails,
  getElectionComparison,
  getMapStatistics,
  // getRajyaSabhaData,
  getVidhanSabhaData,
} from '../controllers/mapController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (accessible to all user roles)
router.get('/states', getStates);
router.get('/states/:stateId/assemblies', getAssembliesByState);
router.get(
  '/assemblies/:constituencyId/polling-booths',
  getPollingBoothsByAssembly
);
router.get(
  '/assemblies/:constituencyId/polling-booths/:boothName',
  getPollingBoothDetails
);
router.get('/states/:stateId/election-comparison', getElectionComparison);
router.get('/statistics', getMapStatistics);
// router.get('/rajyasabha-data', getRajyaSabhaData);
router.get('/vidhansabha-data', getVidhanSabhaData);

// Protected routes (require authentication but accessible to all authenticated users)
router.use(authenticate);

export default router;
