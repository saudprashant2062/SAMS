import * as subjectService from '../../services/admin/subject.service.js';
import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import { createSubjectSchema } from '../../validators/subject.validator.js';
import ApiError from '../../utils/ApiError.utils.js';
import { logActivity } from '../../services/admin/activityLog.service.js';

export const createSubject = asyncHandler(async (req, res) => {
    const parsed = createSubjectSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(422, 'Validation failed', parsed.error.flatten());

    const subj = await subjectService.createSubjectService(parsed.data);
    res.status(201).json(new ApiResponse(201, subj, 'Subject created'));
});

export const getAllSubjects = asyncHandler(async (req, res) => {
    const subs = await subjectService.getAllSubjectsService();
    res.status(200).json(new ApiResponse(200, subs, 'Subjects fetched'));
});

export const getSubjectById = asyncHandler(async (req, res) => {
    const sub = await subjectService.getSubjectByIdService(req.params.id);
    res.status(200).json(new ApiResponse(200, sub, 'Subject fetched'));
});

export const updateSubject = asyncHandler(async (req, res) => {
    const sub = await subjectService.updateSubjectService(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, sub, 'Subject updated'));
});

export const deleteSubject = asyncHandler(async (req, res) => {
    await subjectService.deleteSubjectService(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Subject deleted'));
});

export const bulkCreateSubjects = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Please upload a CSV or Excel file');

    const { department_id, semester_id } = req.body;
    if (!department_id) throw new ApiError(400, 'Please select a department');
    if (!semester_id) throw new ApiError(400, 'Please select a semester');

    const result = await subjectService.bulkCreateSubjectsService(
        req.file.path,
        department_id,
        semester_id,
    );

    await logActivity({
        user_id: req.user.id,
        action: 'BULK_CREATE',
        entity_type: 'Subject',
        description: `Bulk created ${result.successCount} subjects from file`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
    });

    res.status(201).json(new ApiResponse(201, result, 'Subjects created successfully'));
});
