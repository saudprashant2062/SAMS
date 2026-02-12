import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';

export const createSubjectService = async ({ name, code, department_id, semester_id }) => {
    const department = await prisma.department.findUnique({ where: { id: department_id } });
    if (!department) throw new ApiError(404, 'Department not found');

    const semester = await prisma.semester.findUnique({ where: { id: semester_id } });
    if (!semester) throw new ApiError(404, 'Semester not found');
    if (semester.department_id !== department_id)
        throw new ApiError(400, 'Semester does not belong to this department');

    const exists = await prisma.subject.findFirst({ where: { code, semester_id } });
    if (exists) throw new ApiError(409, 'Subject code already exists in this semester');

    const created = await prisma.subject.create({
        data: { name, code, department_id, semester_id },
    });
    return created;
};

export const getAllSubjectsService = async () => {
    const subjects = await prisma.subject.findMany({
        where: { is_deleted: false },
        include: {
            department: true,
            semester: true,
            _count: {
                select: { teaching_assignments: { where: { is_deleted: false } } },
            },
        },
    });

    return subjects;
};

export const getSubjectByIdService = async id => {
    const subj = await prisma.subject.findUnique({
        where: { id },
        include: {
            department: true,
            semester: true,
            teaching_assignments: {
                where: { is_deleted: false },
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullname: true,
                                    email: true,
                                    photo_url: true,
                                },
                            },
                        },
                    },
                    section: true,
                },
            },
            _count: {
                select: { teaching_assignments: { where: { is_deleted: false } } },
            },
        },
    });
    if (!subj) throw new ApiError(404, 'Subject not found');
    return subj;
};

export const updateSubjectService = async (id, data) => {
    const subj = await prisma.subject.findUnique({ where: { id } });
    if (!subj) throw new ApiError(404, 'Subject not found');

    const updated = await prisma.subject.update({ where: { id }, data });
    return updated;
};

export const deleteSubjectService = async id => {
    const subj = await prisma.subject.findUnique({ where: { id } });
    if (!subj) throw new ApiError(404, 'Subject not found');

    // Hard delete cascade
    await prisma.$transaction(async tx => {
        // Find all assignments for this subject
        const assignments = await tx.teachingAssignment.findMany({
            where: { subject_id: id },
            select: { id: true },
        });
        const assignmentIds = assignments.map(a => a.id);

        if (assignmentIds.length > 0) {
            // Find all sessions for these assignments
            const sessions = await tx.attendanceSession.findMany({
                where: { teaching_assignment_id: { in: assignmentIds } },
                select: { id: true },
            });
            const sessionIds = sessions.map(s => s.id);

            if (sessionIds.length > 0) {
                // Delete records
                await tx.attendanceRecord.deleteMany({
                    where: { session_id: { in: sessionIds } },
                });
                // Delete sessions
                await tx.attendanceSession.deleteMany({
                    where: { id: { in: sessionIds } },
                });
            }

            // Delete assignments
            await tx.teachingAssignment.deleteMany({
                where: { id: { in: assignmentIds } },
            });
        }

        // Finally delete the subject
        return await tx.subject.delete({ where: { id } });
    });

    return { message: 'Subject and all related data deleted permanently' };
};

/* ---------- Parse CSV or Excel file ---------- */
const parseSubjectFile = async filePath => {
    const results = [];
    const extension = filePath.split('.').pop().toLowerCase();

    if (extension === 'csv') {
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', row => results.push(row))
                .on('end', () => resolve(results))
                .on('error', err => reject(err));
        });
    } else if (extension === 'xlsx' || extension === 'xls') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    } else {
        throw new ApiError(400, 'Unsupported file format. Please use CSV or Excel (.xlsx, .xls)');
    }
};

/* ---------- Bulk Create Subjects via CSV/Excel ---------- */
export const bulkCreateSubjectsService = async (filePath, departmentId, semesterId) => {
    const errors = [];

    // Validate department
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department || department.is_deleted) {
        throw new ApiError(404, 'Department not found');
    }

    // Validate semester
    const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (!semester || semester.is_deleted) {
        throw new ApiError(404, 'Semester not found');
    }
    if (semester.department_id !== departmentId) {
        throw new ApiError(400, 'Semester does not belong to this department');
    }

    // Parse file
    let rows;
    try {
        rows = await parseSubjectFile(filePath);
    } catch (err) {
        throw new ApiError(400, `Failed to parse file: ${err.message}`);
    }

    if (!rows || rows.length === 0) {
        throw new ApiError(400, 'The file is empty or contains no valid data.');
    }

    // Import the validator
    const { bulkSubjectRowSchema } = await import('../../validators/subject.validator.js');

    // First pass: validate all rows
    const validatedRows = [];
    for (const [index, row] of rows.entries()) {
        // Normalize keys to lowercase
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] =
                typeof row[key] === 'string' ? row[key].trim() : row[key];
        });

        const parsed = bulkSubjectRowSchema.safeParse(normalizedRow);
        if (!parsed.success) {
            const errorMessages = Object.entries(parsed.error.format())
                .filter(([key]) => key !== '_errors')
                .map(([field, err]) =>
                    err._errors?.length > 0
                        ? `${field}: ${err._errors.join(', ')}`
                        : `${field}: Invalid value`,
                )
                .join('; ');
            errors.push({ row: index + 1, error: errorMessages || 'Validation failed' });
            continue;
        }
        validatedRows.push({ index, data: parsed.data });
    }

    // Batch-check existing codes in ONE query
    const allCodes = validatedRows.map(r => r.data.code);
    const existingSubjects = await prisma.subject.findMany({
        where: { code: { in: allCodes } },
        select: { code: true },
    });
    const existingCodeSet = new Set(existingSubjects.map(s => s.code));

    // Also check for duplicate codes within the file itself
    const seenCodes = new Set();
    const finalRows = [];
    for (const row of validatedRows) {
        if (existingCodeSet.has(row.data.code)) {
            errors.push({
                row: row.index + 1,
                error: `Subject code "${row.data.code}" already exists`,
            });
            continue;
        }
        if (seenCodes.has(row.data.code.toLowerCase())) {
            errors.push({ row: row.index + 1, error: `Duplicate code "${row.data.code}" in file` });
            continue;
        }
        seenCodes.add(row.data.code.toLowerCase());
        finalRows.push(row);
    }

    // Create subjects in a transaction
    const created = [];
    if (finalRows.length > 0) {
        await prisma.$transaction(async tx => {
            for (const row of finalRows) {
                try {
                    const subject = await tx.subject.create({
                        data: {
                            name: row.data.name,
                            code: row.data.code,
                            credit_hours: row.data.credit_hours,
                            department_id: departmentId,
                            semester_id: semesterId,
                        },
                    });
                    created.push(subject);
                } catch (err) {
                    errors.push({
                        row: row.index + 1,
                        error: err.message || 'Failed to create subject',
                    });
                }
            }
        });
    }

    // Clean up uploaded file
    try {
        fs.unlinkSync(filePath);
    } catch (_) {
        // ignore cleanup errors
    }

    return {
        total: rows.length,
        created,
        successCount: created.length,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
    };
};
