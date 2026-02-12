/* ============================================================
   SECTION CONTROLLER - Updated for Batch Context
   ============================================================
   
   Changes:
   - All operations now include batch_id
   - Added archive/restore endpoints
   - Enhanced promotion with options
============================================================ */

import { createSectionSchema, promoteSemesterSchema } from '../../validators/section.validator.js';
import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiError from '../../utils/ApiError.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import {
    createSectionService,
    getAllSectionsService,
    getSectionByIdService,
    updateSectionService,
    deleteSectionService,
    archiveSectionService,
    restoreSectionService,
    promoteSemesterService,
    getArchivedSectionsService,
} from '../../services/admin/section.service.js';

/* ---------- CREATE ---------- */
export const createSection = asyncHandler(async (req, res) => {
    const parsed = createSectionSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const section = await createSectionService(parsed.data);
    res.status(201).json(new ApiResponse(201, section, 'Section created successfully'));
});

/* ---------- GET ALL ---------- */
export const getAllSections = asyncHandler(async (req, res) => {
    const { department_id, batch_id, semester_id, include_archived, page, limit } = req.query;

    const filters = {
        ...(department_id && { department_id }),
        ...(batch_id && { batch_id }),
        ...(semester_id && { semester_id }),
        ...(include_archived === 'true' && { include_archived: true }),
        page,
        limit,
    };

    const result = await getAllSectionsService(filters);

    res.status(200).json(new ApiResponse(200, result, 'Sections fetched successfully'));
});

/* ---------- GET BY ID ---------- */
export const getSectionById = asyncHandler(async (req, res) => {
    const section = await getSectionByIdService(req.params.id);
    res.status(200).json(new ApiResponse(200, section, 'Section fetched successfully'));
});

/* ---------- UPDATE ---------- */
export const updateSection = asyncHandler(async (req, res) => {
    const parsed = createSectionSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const updated = await updateSectionService(req.params.id, parsed.data);
    res.status(200).json(new ApiResponse(200, updated, 'Section updated successfully'));
});

/* ---------- DELETE ---------- */
export const deleteSection = asyncHandler(async (req, res) => {
    const result = await deleteSectionService(req.params.id);
    res.status(200).json(new ApiResponse(200, null, result.message));
});

/* ---------- ARCHIVE ---------- */
export const archiveSection = asyncHandler(async (req, res) => {
    const section = await archiveSectionService(req.params.id);
    res.status(200).json(new ApiResponse(200, section, 'Section archived successfully'));
});

/* ---------- RESTORE ---------- */
export const restoreSection = asyncHandler(async (req, res) => {
    const section = await restoreSectionService(req.params.id);
    res.status(200).json(new ApiResponse(200, section, 'Section restored successfully'));
});

/* ---------- PROMOTE SEMESTER ---------- */
export const promoteSemester = asyncHandler(async (req, res) => {
    const parsed = promoteSemesterSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const result = await promoteSemesterService(parsed.data);
    res.status(200).json(new ApiResponse(200, result, 'Semester promotion completed successfully'));
});

/* ---------- GET ARCHIVED SECTIONS ---------- */
export const getArchivedSections = asyncHandler(async (req, res) => {
    const { department_id, batch_id, semester_id, page, limit } = req.query;

    const filters = {
        ...(department_id && { department_id }),
        ...(batch_id && { batch_id }),
        ...(semester_id && { semester_id }),
        page,
        limit,
    };

    const result = await getArchivedSectionsService(filters);
    res.status(200).json(new ApiResponse(200, result, 'Archived sections fetched successfully'));
});
