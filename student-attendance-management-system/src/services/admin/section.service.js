import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';

/* ============================================================
   SECTION SERVICE - Redesigned for Batch Context
   ============================================================
   
   Key Changes:
   - All sections now have batch_id for historical context
   - Unique constraint: (name, batch_id, semester_id)
   - is_archived flag for promotion workflow
============================================================ */

/* ---------- CREATE ---------- */
export const createSectionService = async data => {
    const { name, department_id, semester_id, batch_id } = data;

    // Validate department exists
    const department = await prisma.department.findUnique({
        where: { id: department_id },
    });
    if (!department || department.is_deleted) {
        throw new ApiError(404, 'The selected department does not exist or has been removed.');
    }

    // Validate semester exists and belongs to department
    const semester = await prisma.semester.findUnique({
        where: { id: semester_id },
    });
    if (!semester || semester.is_deleted) {
        throw new ApiError(404, 'The selected semester does not exist or has been removed.');
    }
    if (semester.department_id !== department_id) {
        throw new ApiError(
            400,
            'The selected semester does not belong to the selected department.',
        );
    }

    // Validate batch exists and belongs to department
    const batch = await prisma.batch.findUnique({
        where: { id: batch_id },
    });
    if (!batch || batch.is_deleted) {
        throw new ApiError(404, 'The selected batch does not exist or has been removed.');
    }
    if (batch.department_id !== department_id) {
        throw new ApiError(400, 'The selected batch does not belong to the selected department.');
    }

    // Check unique constraint: name + batch_id + semester_id
    const exists = await prisma.section.findFirst({
        where: {
            name,
            batch_id,
            semester_id,
            is_deleted: false,
        },
    });
    if (exists) {
        throw new ApiError(
            409,
            `Section "${name}" already exists in ${batch.name}, Semester ${semester.number}. Please use a different name.`,
        );
    }

    const section = await prisma.section.create({
        data: {
            name,
            department_id,
            semester_id,
            batch_id,
        },
        include: {
            department: true,
            semester: true,
            batch: true,
        },
    });

    return section;
};

/* ---------- GET ALL (with batch context) ---------- */
export const getAllSectionsService = async (filters = {}) => {
    const { department_id, batch_id, semester_id, include_archived = false } = filters;

    const where = {
        is_deleted: false,
        ...(department_id && { department_id }),
        ...(batch_id && { batch_id }),
        ...(semester_id && { semester_id }),
        ...(!include_archived && { is_archived: false }),
    };

    const sections = await prisma.section.findMany({
        where,
        include: {
            department: true,
            semester: true,
            batch: true,
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
        orderBy: [
            { batch: { start_year: 'desc' } },
            { semester: { number: 'asc' } },
            { name: 'asc' },
        ],
    });

    return sections;
};

/* ---------- GET BY ID ---------- */
export const getSectionByIdService = async id => {
    const section = await prisma.section.findUnique({
        where: { id },
    });
    if (!section || section.is_deleted) {
        throw new ApiError(404, 'Section not found');
    }

    return await prisma.section.findUnique({
        where: { id },
        include: {
            department: true,
            semester: true,
            batch: true,
            students: {
                where: { is_deleted: false },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullname: true,
                            email: true,
                            phone_number: true,
                            photo_url: true,
                            is_active: true,
                        },
                    },
                    batch: true,
                },
                orderBy: { roll_no: 'asc' },
            },
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
                                },
                            },
                        },
                    },
                    subject: true,
                },
            },
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
    });
};

/* ---------- UPDATE ---------- */
export const updateSectionService = async (id, data) => {
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section || section.is_deleted) {
        throw new ApiError(404, 'Section not found');
    }

    // Can't update archived sections
    if (section.is_archived) {
        throw new ApiError(400, 'Cannot update an archived section. Restore it first if needed.');
    }

    const { name, department_id, semester_id, batch_id } = data;

    // Validate all references if provided
    if (department_id) {
        const department = await prisma.department.findUnique({
            where: { id: department_id },
        });
        if (!department || department.is_deleted) {
            throw new ApiError(404, 'The selected department does not exist or has been removed.');
        }
    }

    if (semester_id) {
        const semester = await prisma.semester.findUnique({
            where: { id: semester_id },
        });
        if (!semester || semester.is_deleted) {
            throw new ApiError(404, 'The selected semester does not exist or has been removed.');
        }
        if (department_id && semester.department_id !== department_id) {
            throw new ApiError(
                400,
                'The selected semester does not belong to the selected department.',
            );
        }
    }

    if (batch_id) {
        const batch = await prisma.batch.findUnique({
            where: { id: batch_id },
        });
        if (!batch || batch.is_deleted) {
            throw new ApiError(404, 'The selected batch does not exist or has been removed.');
        }
        if (department_id && batch.department_id !== department_id) {
            throw new ApiError(
                400,
                'The selected batch does not belong to the selected department.',
            );
        }
    }

    // Use current values if not provided
    const actualBatchId = batch_id || section.batch_id;
    const actualSemesterId = semester_id || section.semester_id;
    const actualName = name || section.name;

    // Check unique constraint for new values
    const exists = await prisma.section.findFirst({
        where: {
            name: actualName,
            batch_id: actualBatchId,
            semester_id: actualSemesterId,
            NOT: { id },
            is_deleted: false,
        },
    });
    if (exists) {
        throw new ApiError(
            409,
            `Section "${actualName}" already exists in this batch and semester. Please use a different name.`,
        );
    }

    return await prisma.section.update({
        where: { id },
        data: {
            name: actualName,
            department_id,
            semester_id,
            batch_id,
        },
        include: {
            department: true,
            semester: true,
            batch: true,
        },
    });
};

/* ---------- DELETE (HARD DELETE) ---------- */
export const deleteSectionService = async id => {
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section) {
        throw new ApiError(404, 'Section not found');
    }

    // Check if section has students
    const studentCount = await prisma.student.count({
        where: { section_id: id },
    });
    if (studentCount > 0) {
        throw new ApiError(
            400,
            'Cannot delete section with existing students. Please reassign or remove students first.',
        );
    }

    // Hard delete cascade: assignments and attendance sessions/records
    await prisma.$transaction(async tx => {
        // Find all attendance sessions for this section
        const sessions = await tx.attendanceSession.findMany({
            where: { section_id: id },
            select: { id: true },
        });
        const sessionIds = sessions.map(s => s.id);

        if (sessionIds.length > 0) {
            // Delete attendance records first
            await tx.attendanceRecord.deleteMany({
                where: { session_id: { in: sessionIds } },
            });
            // Delete sessions
            await tx.attendanceSession.deleteMany({
                where: { id: { in: sessionIds } },
            });
        }

        // Delete teaching assignments
        await tx.teachingAssignment.deleteMany({
            where: { section_id: id },
        });

        // Finally delete the section
        await tx.section.delete({
            where: { id },
        });
    });

    return { message: 'Section and all related assignments/sessions deleted permanently' };
};

/* ---------- ARCHIVE (for promotion) ---------- */
export const archiveSectionService = async id => {
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section || section.is_deleted) {
        throw new ApiError(404, 'Section not found');
    }
    if (section.is_archived) {
        throw new ApiError(400, 'Section is already archived');
    }

    return await prisma.section.update({
        where: { id },
        data: { is_archived: true },
        include: {
            department: true,
            semester: true,
            batch: true,
        },
    });
};

/* ---------- RESTORE (from archive) ---------- */
export const restoreSectionService = async id => {
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section || section.is_deleted) {
        throw new ApiError(404, 'Section not found');
    }
    if (!section.is_archived) {
        throw new ApiError(400, 'Section is not archived');
    }

    // Check for duplicate before restore
    const exists = await prisma.section.findFirst({
        where: {
            name: section.name,
            batch_id: section.batch_id,
            semester_id: section.semester_id,
            is_deleted: false,
            NOT: { id },
        },
    });
    if (exists) {
        throw new ApiError(
            409,
            `Cannot restore: Section "${section.name}" already exists in this batch and semester.`,
        );
    }

    return await prisma.section.update({
        where: { id },
        data: { is_archived: false },
        include: {
            department: true,
            semester: true,
            batch: true,
        },
    });
};

/* ---------- PROMOTE SEMESTER (Bulk Operation) ----------
   This is the CRITICAL operation for academic workflow.
   
   Process:
   1. Get all active sections in source semester for a batch
   2. Archive those sections (preserve historical data)
   3. Get/create sections in target semester
   4. Move students to new sections
   5. Update student's current_semester
   6. Return promotion summary
------------------------------------------------------------ */
export const promoteSemesterService = async ({
    department_id,
    from_semester_id,
    to_semester_id,
    batch_id,
    options = { copy_teaching_assignments: false },
}) => {
    // Validate department
    const department = await prisma.department.findUnique({
        where: { id: department_id },
    });
    if (!department || department.is_deleted) {
        throw new ApiError(404, 'Department not found');
    }

    // Validate source semester
    const fromSemester = await prisma.semester.findUnique({
        where: { id: from_semester_id },
    });
    if (!fromSemester || fromSemester.is_deleted) {
        throw new ApiError(404, 'Source semester not found');
    }
    if (fromSemester.department_id !== department_id) {
        throw new ApiError(400, 'Source semester does not belong to the specified department');
    }

    // Validate target semester
    const toSemester = await prisma.semester.findUnique({
        where: { id: to_semester_id },
    });
    if (!toSemester || toSemester.is_deleted) {
        throw new ApiError(404, 'Target semester not found');
    }
    if (toSemester.department_id !== department_id) {
        throw new ApiError(400, 'Target semester does not belong to the specified department');
    }

    // Validate target semester is higher than source
    if (toSemester.number <= fromSemester.number) {
        throw new ApiError(
            400,
            `Cannot promote from Semester ${fromSemester.number} to Semester ${toSemester.number}. Target semester must be higher.`,
        );
    }

    // Validate batch
    const batch = await prisma.batch.findUnique({
        where: { id: batch_id },
    });
    if (!batch || batch.is_deleted) {
        throw new ApiError(404, 'Batch not found');
    }
    if (batch.department_id !== department_id) {
        throw new ApiError(400, 'Batch does not belong to the specified department');
    }

    // Get all ACTIVE (not archived) sections in source semester for this batch
    const sourceSections = await prisma.section.findMany({
        where: {
            department_id,
            semester_id: from_semester_id,
            batch_id,
            is_deleted: false,
            is_archived: false,
        },
        include: {
            students: {
                where: { is_deleted: false },
            },
            teaching_assignments: {
                where: { is_deleted: false },
                include: { subject: true },
            },
        },
    });

    if (sourceSections.length === 0) {
        throw new ApiError(404, 'No active sections found in the source semester for this batch');
    }

    const promotionResults = [];
    let totalStudentsPromoted = 0;

    // Use transaction for data integrity
    const result = await prisma.$transaction(async tx => {
        for (const section of sourceSections) {
            // Step 1: Archive the source section
            await tx.section.update({
                where: { id: section.id },
                data: { is_archived: true },
            });

            // Step 2: Check if target section already exists
            let targetSection = await tx.section.findFirst({
                where: {
                    name: section.name,
                    batch_id,
                    semester_id: to_semester_id,
                    is_deleted: false,
                },
            });

            // Step 3: Create target section if doesn't exist
            if (!targetSection) {
                targetSection = await tx.section.create({
                    data: {
                        name: section.name,
                        department_id,
                        semester_id: to_semester_id,
                        batch_id,
                    },
                });
            }

            // Step 4: Move students to new section
            const studentIds = section.students.map(s => s.id);
            if (studentIds.length > 0) {
                await tx.student.updateMany({
                    where: { id: { in: studentIds } },
                    data: {
                        section_id: targetSection.id,
                        current_semester: toSemester.number,
                    },
                });
            }

            // Step 5: Optionally copy teaching assignments
            if (options.copy_teaching_assignments && section.teaching_assignments.length > 0) {
                for (const assignment of section.teaching_assignments) {
                    // Check if assignment already exists in target section
                    const exists = await tx.teachingAssignment.findFirst({
                        where: {
                            teacher_id: assignment.teacher_id,
                            subject_id: assignment.subject_id,
                            section_id: targetSection.id,
                            is_deleted: false,
                        },
                    });

                    if (!exists) {
                        await tx.teachingAssignment.create({
                            data: {
                                teacher_id: assignment.teacher_id,
                                subject_id: assignment.subject_id,
                                section_id: targetSection.id,
                            },
                        });
                    }
                }
            }

            promotionResults.push({
                source_section_id: section.id,
                source_section_name: section.name,
                source_semester: fromSemester.number,
                target_section_id: targetSection.id,
                target_section_name: targetSection.name,
                students_moved: studentIds.length,
                teaching_assignments_copied: options.copy_teaching_assignments
                    ? section.teaching_assignments.length
                    : 0,
            });

            totalStudentsPromoted += studentIds.length;
        }

        return promotionResults;
    });

    return {
        success: true,
        message: 'Semester promotion completed successfully',
        from_semester: {
            id: fromSemester.id,
            number: fromSemester.number,
            name: fromSemester.name,
        },
        to_semester: {
            id: toSemester.id,
            number: toSemester.number,
            name: toSemester.name,
        },
        batch: {
            id: batch.id,
            name: batch.name,
            start_year: batch.start_year,
            end_year: batch.end_year,
        },
        department: {
            id: department.id,
            name: department.name,
        },
        sections_promoted: promotionResults.length,
        total_students_promoted: totalStudentsPromoted,
        details: result,
        archived_source_sections: true,
        created_target_sections:
            promotionResults.filter(
                r =>
                    !r.target_section_id.startsWith(
                        sourceSections.find(s => s.name === r.target_section_name)?.id || '',
                    ),
            ).length > 0,
    };
};

/* ---------- GET SECTIONS BY BATCH AND SEMESTER (Helper) ---------- */
export const getSectionsByBatchAndSemesterService = async (batch_id, semester_id) => {
    return await prisma.section.findMany({
        where: {
            batch_id,
            semester_id,
            is_deleted: false,
            is_archived: false,
        },
        include: {
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
        orderBy: { name: 'asc' },
    });
};

/* ---------- GET ARCHIVED SECTIONS (for history) ---------- */
export const getArchivedSectionsService = async (filters = {}) => {
    const { department_id, batch_id, semester_id } = filters;

    return await prisma.section.findMany({
        where: {
            is_deleted: false,
            is_archived: true,
            ...(department_id && { department_id }),
            ...(batch_id && { batch_id }),
            ...(semester_id && { semester_id }),
        },
        include: {
            department: true,
            semester: true,
            batch: true,
            _count: {
                select: { students: { where: { is_deleted: false } } },
            },
        },
        orderBy: [
            { batch: { start_year: 'desc' } },
            { semester: { number: 'asc' } },
            { name: 'asc' },
        ],
    });
};
