import * as semesterService from '../../services/admin/semester.service.js';
import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import { createSemesterSchema } from '../../validators/semester.validator.js';
import ApiError from '../../utils/ApiError.utils.js';

export const createSemester = asyncHandler(async (req, res) => {
    const parsed = createSemesterSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.flatten());

    const sem = await semesterService.createSemesterService(parsed.data);
    res.status(201).json(new ApiResponse(201, sem, 'Semester created'));
});

export const getAllSemesters = asyncHandler(async (req, res) => {
    const sems = await semesterService.getAllSemestersService();
    res.status(200).json(new ApiResponse(200, sems, 'Semesters fetched'));
});

export const getSemesterById = asyncHandler(async (req, res) => {
    const sem = await semesterService.getSemesterByIdService(req.params.id);
    res.status(200).json(new ApiResponse(200, sem, 'Semester fetched'));
});

export const updateSemester = asyncHandler(async (req, res) => {
    const sem = await semesterService.updateSemesterService(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, sem, 'Semester updated'));
});

export const deleteSemester = asyncHandler(async (req, res) => {
    await semesterService.deleteSemesterService(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Semester deleted'));
});
