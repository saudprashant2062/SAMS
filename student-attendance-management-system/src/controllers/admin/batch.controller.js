import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import {
    createBatchService,
    getAllBatchesService,
    getBatchByIdService,
    updateBatchService,
    deleteBatchService,
} from '../../services/admin/batch.service.js';

export const createBatch = asyncHandler(async (req, res) => {
    const batch = await createBatchService(req.body);
    res.status(201).json(new ApiResponse(201, batch, 'Batch created successfully'));
});

export const getAllBatches = asyncHandler(async (req, res) => {
    const batches = await getAllBatchesService();
    res.json(new ApiResponse(200, batches));
});

export const getBatchById = asyncHandler(async (req, res) => {
    const batch = await getBatchByIdService(req.params.id);
    res.json(new ApiResponse(200, batch));
});

export const updateBatch = asyncHandler(async (req, res) => {
    const batch = await updateBatchService(req.params.id, req.body);
    res.json(new ApiResponse(200, batch, 'Batch updated successfully'));
});

export const deleteBatch = asyncHandler(async (req, res) => {
    await deleteBatchService(req.params.id);
    res.json(new ApiResponse(200, null, 'Batch deleted successfully'));
});
