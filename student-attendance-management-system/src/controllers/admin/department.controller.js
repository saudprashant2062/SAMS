import * as departmentService from '../../services/admin/department.service.js';
import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import { createDepartmentSchema } from '../../validators/department.validator.js';
import ApiError from '../../utils/ApiError.utils.js';

export const createDepartment = asyncHandler(async (req, res) => {
    const parsed = createDepartmentSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.flatten());

    const dept = await departmentService.createDepartmentService(parsed.data);
    res.status(201).json(new ApiResponse(201, dept, 'Department created'));
});

export const getAllDepartments = asyncHandler(async (req, res) => {
    const depts = await departmentService.getAllDepartmentsService();
    res.status(200).json(new ApiResponse(200, depts, 'Departments fetched'));
});

export const getDepartmentById = asyncHandler(async (req, res) => {
    const dept = await departmentService.getDepartmentByIdService(req.params.id);
    res.status(200).json(new ApiResponse(200, dept, 'Department fetched'));
});

export const updateDepartment = asyncHandler(async (req, res) => {
    const dept = await departmentService.updateDepartmentService(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, dept, 'Department updated'));
});

export const deleteDepartment = asyncHandler(async (req, res) => {
    await departmentService.deleteDepartmentService(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Department deleted'));
});
