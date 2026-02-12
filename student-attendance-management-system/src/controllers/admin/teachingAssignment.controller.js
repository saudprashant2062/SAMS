import * as taService from '../../services/admin/teachingAssignment.service.js';
import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import { createTeachingAssignmentSchema } from '../../validators/teachingAssignment.validator.js';
import ApiError from '../../utils/ApiError.utils.js';
import { logActivity } from '../../services/admin/activityLog.service.js';

export const createTeachingAssignment = asyncHandler(async (req, res) => {
    const parsed = createTeachingAssignmentSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.flatten());

    const ta = await taService.createTeachingAssignment(parsed.data);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'CREATE',
        entity_type: 'TeachingAssignment',
        entity_id: ta.id,
        description: `Created teaching assignment: ${ta.subject?.name || 'Subject'} for ${ta.section?.name || 'Section'} by ${ta.teacher?.user?.fullname || 'Teacher'}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(201).json(new ApiResponse(201, ta, 'Teaching assignment created'));
});

export const getAllTeachingAssignments = asyncHandler(async (req, res) => {
    const { teacher_id, subject_id, section_id, department_id, page, limit } = req.query;
    const filters = { teacher_id, subject_id, section_id, department_id, page, limit };
    const result = await taService.getAllTeachingAssignments(filters);
    res.status(200).json(new ApiResponse(200, result, 'Teaching assignments fetched'));
});

export const getTeachingAssignmentById = asyncHandler(async (req, res) => {
    const ta = await taService.getTeachingAssignmentById(req.params.id);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'VIEW',
        entity_type: 'TeachingAssignment',
        entity_id: req.params.id,
        description: `Viewed teaching assignment details`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(200).json(new ApiResponse(200, ta, 'Teaching assignment fetched'));
});

export const deleteTeachingAssignment = asyncHandler(async (req, res) => {
    const ta = await taService.getTeachingAssignmentById(req.params.id);
    await taService.deleteTeachingAssignment(req.params.id);

    // Log activity
    await logActivity({
        user_id: req.user.id,
        action: 'DELETE',
        entity_type: 'TeachingAssignment',
        entity_id: req.params.id,
        description: `Deleted teaching assignment: ${ta.subject?.name || 'Subject'} for ${ta.section?.name || 'Section'}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(200).json(new ApiResponse(200, null, 'Teaching assignment deleted'));
});
