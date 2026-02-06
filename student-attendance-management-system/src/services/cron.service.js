import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { sendAttendanceWarningEmail } from '../utils/email.utils.js';

/**
 * Calculates attendance percentage for a student in a specific teaching assignment
 */
const calculateAttendance = (studentId, assignment) => {
    const sessions = assignment.attendance_sessions;
    if (sessions.length === 0) return 100; // No sessions yet

    let presentCount = 0;
    sessions.forEach(session => {
        const record = session.records.find(r => r.student_id === studentId);
        if (record && record.status === 'PRESENT') {
            presentCount++;
        }
    });

    return (presentCount / sessions.length) * 100;
};

/**
 * Monthly Attendance Job
 * Runs on the 1st of every month at 00:00
 */
const initAttendanceCron = () => {
    // Cron schedule: minute hour day-of-month month day-of-week
    // Running on 1st day of month at midnight
    cron.schedule('0 0 1 * *', async () => {
        console.log('--- Starting Monthly Attendance Warning Job ---');

        try {
            // 1. Fetch all active students with their sections and users
            const students = await prisma.student.findMany({
                where: { is_deleted: false },
                include: {
                    user: true,
                    section: {
                        include: {
                            teaching_assignments: {
                                where: { is_deleted: false },
                                include: {
                                    subject: true,
                                    attendance_sessions: {
                                        where: { is_deleted: false },
                                        include: {
                                            records: true, // This is simplified for logic; in production, you might want to filter records here
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            console.log(`Processing ${students.length} students...`);

            for (const student of students) {
                const warnings = [];
                const assignments = student.section?.teaching_assignments || [];

                for (const assignment of assignments) {
                    const percentage = calculateAttendance(student.id, assignment);
                    
                    if (percentage < 80) {
                        warnings.push({
                            subject: assignment.subject.name,
                            percentage: Math.round(percentage),
                        });
                    }
                }

                if (warnings.length > 0) {
                    try {
                        await sendAttendanceWarningEmail(student, warnings);
                        console.log(`Sent warning to ${student.user.fullname} (${student.user.email})`);
                    } catch (emailError) {
                        console.error(`Failed to send email to ${student.user.email}:`, emailError.message);
                    }
                }
            }

            console.log('--- Monthly Attendance Warning Job Completed ---');
        } catch (error) {
            console.error('--- Monthly Attendance Warning Job Failed ---', error);
        }
    });

    console.log('Attendance Cron Job initialized (Monthly on 1st)');
};

export default initAttendanceCron;
