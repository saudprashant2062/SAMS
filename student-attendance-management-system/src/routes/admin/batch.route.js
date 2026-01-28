import { Router } from 'express';
import {
    createBatch,
    getAllBatches,
    getBatchById,
    updateBatch,
    deleteBatch,
} from '../../controllers/admin/batch.controller.js';

const router = Router();

router.route('/').get(getAllBatches).post(createBatch);

router.route('/:id').get(getBatchById).patch(updateBatch).delete(deleteBatch);

export default router;
