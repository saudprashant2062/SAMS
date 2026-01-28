import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiError from '../../utils/ApiError.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import {
    createSectionService,
    getAllSectionsService,
    getSectionByIdService,
    updateSectionService,
    deleteSectionService,
    promoteSemesterService,
} from '../../services/admin/section.service.js';
import { createSectionSchema } from '../../validators/section.validator.js';
import { promoteSemesterSchema } from '../../validators/attendance.validator.js';

/* ---------- CREATE ---------- */
export const createSection = asyncHandler(async (req, res) => {
    const parsed = createSectionSchema.safeParse({ body: req.body });
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.format());

    const section = await createSectionService(parsed.data.body);
    res.status(201).json(new ApiResponse(201, section, 'Section created'));
});

/* ---------- GET ALL ---------- */
export const getAllSections = asyncHandler(async (req, res) => {
    const sections = await getAllSectionsService();
    res.status(200).json(new ApiResponse(200, sections, 'Sections fetched'));
});

/* ---------- GET BY ID ---------- */
export const getSectionById = asyncHandler(async (req, res) => {
    const section = await getSectionByIdService(req.params.id);
    res.status(200).json(new ApiResponse(200, section, 'Section fetched'));
});

/* ---------- UPDATE ---------- */
export const updateSection = asyncHandler(async (req, res) => {
    const parsed = createSectionSchema.safeParse({ body: req.body });
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.format());

    const updated = await updateSectionService(req.params.id, parsed.data.body);
    res.status(200).json(new ApiResponse(200, updated, 'Section updated'));
});

/* ---------- DELETE ---------- */
export const deleteSection = asyncHandler(async (req, res) => {
    const result = await deleteSectionService(req.params.id);
    res.status(200).json(new ApiResponse(200, null, result.message));
});

/* ---------- PROMOTE SEMESTER ---------- */
export const promoteSemester = asyncHandler(async (req, res) => {
    const parsed = promoteSemesterSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.format());

    const result = await promoteSemesterService(parsed.data);
    res.status(200).json(new ApiResponse(200, result, 'Semester promotion completed'));
});
