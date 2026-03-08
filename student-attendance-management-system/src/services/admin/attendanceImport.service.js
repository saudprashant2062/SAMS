import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';

/* ---------- Parse CSV or Excel file ---------- */
const parseFile = async filePath => {
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

/* ---------- Normalize status string ---------- */
const normalizeStatus = statusStr => {
    if (!statusStr) return null;
    const s = statusStr.toString().trim().toUpperCase();
    if (s === 'PRESENT' || s === 'P' || s === '1') return 'PRESENT';
    if (s === 'ABSENT' || s === 'A' || s === '0') return 'ABSENT';
    return null;
};

/* =====================================================
   IMPORT ATTENDANCE FROM CSV/XLSX
   
   Expected columns:
   - student_id (the custom stdId like STD-CSIT-24-001)
   - date (YYYY-MM-DD)
   - status (present/absent)
   - subject_code (the subject code)
   
   Context provided via request body:
   - teaching_assignment_id (which section+subject+teacher)
===================================================== */
export const importAttendanceService = async (filePath, teachingAssignmentId) => {
    const errors = [];
    const created = [];
    const skipped = [];

    // Validate teaching assignment
    const assignment = await prisma.teachingAssignment.findUnique({
        where: { id: teachingAssignmentId },
        select: {
            id: true,
            is_deleted: true,
            section_id: true,
            section: {
                select: {
                    students: {
                        where: { is_deleted: false },
                        select: { id: true, stdId: true, roll_no: true },
                    },
                },
            },
        },
    });

    if (!assignment || assignment.is_deleted) {
        throw new ApiError(404, 'Teaching assignment not found');
    }

    // Parse file
    let rows;
    try {
        rows = await parseFile(filePath);
    } catch (err) {
        throw new ApiError(400, `Failed to parse file: ${err.message}`);
    }

    if (!rows || rows.length === 0) {
        throw new ApiError(400, 'The file is empty or contains no valid data.');
    }

    // Build student lookup maps (by stdId and roll_no)
    const studentByStdId = new Map();
    const studentByRollNo = new Map();
    assignment.section.students.forEach(s => {
        studentByStdId.set(s.stdId.toUpperCase(), s.id);
        if (s.roll_no) studentByRollNo.set(s.roll_no.toString(), s.id);
    });

    // Group valid records by date to create sessions
    const sessionMap = new Map(); // date_string -> { records: [{student_id, status}] }

    for (const [index, row] of rows.entries()) {
        // Normalize keys
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim().replace(/\s+/g, '_')] = row[key];
        });

        // Extract fields
        const studentIdField =
            normalizedRow.student_id || normalizedRow.studentid || normalizedRow.std_id || '';
        const rollNoField =
            normalizedRow.roll_no || normalizedRow.rollno || normalizedRow.roll || '';
        const dateField = normalizedRow.date || '';
        const statusField = normalizedRow.status || '';

        // Validate date
        if (!dateField) {
            errors.push({ row: index + 2, error: 'Date is required' });
            continue;
        }

        // Parse date - handle multiple formats
        let parsedDate;
        const dateStr = dateField.toString().trim();
        parsedDate = new Date(dateStr);

        if (isNaN(parsedDate.getTime())) {
            errors.push({ row: index + 2, error: `Invalid date: "${dateStr}"` });
            continue;
        }

        // Validate status
        const status = normalizeStatus(statusField);
        if (!status) {
            errors.push({
                row: index + 2,
                error: `Invalid status: "${statusField}". Use present/absent/P/A`,
            });
            continue;
        }

        // Find student
        let studentId = null;
        const stdIdStr = studentIdField.toString().trim().toUpperCase();
        const rollNoStr = rollNoField.toString().trim();

        if (stdIdStr && studentByStdId.has(stdIdStr)) {
            studentId = studentByStdId.get(stdIdStr);
        } else if (rollNoStr && studentByRollNo.has(rollNoStr)) {
            studentId = studentByRollNo.get(rollNoStr);
        }

        if (!studentId) {
            errors.push({
                row: index + 2,
                error: `Student not found: ID="${stdIdStr}" Roll="${rollNoStr}"`,
            });
            continue;
        }

        // Group by date
        const dateKey = parsedDate.toISOString().split('T')[0];
        if (!sessionMap.has(dateKey)) {
            sessionMap.set(dateKey, []);
        }
        sessionMap.get(dateKey).push({ student_id: studentId, status, row: index + 2 });
    }

    // Process each date - create/find session and upsert records
    for (const [dateKey, records] of sessionMap) {
        const sessionDate = new Date(dateKey);
        const startOfDay = new Date(sessionDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(sessionDate);
        endOfDay.setHours(23, 59, 59, 999);

        try {
            // Find or create session for this date
            let session = await prisma.attendanceSession.findFirst({
                where: {
                    teaching_assignment_id: teachingAssignmentId,
                    session_date: { gte: startOfDay, lte: endOfDay },
                    is_deleted: false,
                },
            });

            if (!session) {
                session = await prisma.attendanceSession.create({
                    data: {
                        teaching_assignment_id: teachingAssignmentId,
                        section_id: assignment.section_id,
                        session_date: sessionDate,
                    },
                });
            }

            // Upsert records for this session
            for (const record of records) {
                try {
                    await prisma.attendanceRecord.upsert({
                        where: {
                            session_id_student_id: {
                                session_id: session.id,
                                student_id: record.student_id,
                            },
                        },
                        update: { status: record.status, is_deleted: false },
                        create: {
                            session_id: session.id,
                            student_id: record.student_id,
                            status: record.status,
                        },
                    });
                    created.push({ row: record.row, date: dateKey, status: record.status });
                } catch (err) {
                    if (err.code === 'P2002') {
                        skipped.push({
                            row: record.row,
                            reason: 'Duplicate record (already exists)',
                        });
                    } else {
                        errors.push({ row: record.row, error: err.message });
                    }
                }
            }
        } catch (err) {
            // If session creation fails, mark all records for this date as errored
            records.forEach(r => {
                errors.push({
                    row: r.row,
                    error: `Failed to create session for ${dateKey}: ${err.message}`,
                });
            });
        }
    }

    // Cleanup file
    try {
        await fsPromises.unlink(filePath);
    } catch {
        // Ignore cleanup errors
    }

    return {
        summary: {
            total: rows.length,
            imported: created.length,
            skipped: skipped.length,
            failed: errors.length,
        },
        errors,
        skipped,
    };
};
