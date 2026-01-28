/**
 * Common Prisma select patterns for reuse across services
 * Reduces duplication and ensures consistent response shapes
 */

/* ---------- USER SELECT PATTERNS ---------- */
export const userBasicSelect = {
    id: true,
    fullname: true,
    email: true,
    phone_number: true,
    photo_url: true,
};

export const userWithRoleSelect = {
    ...userBasicSelect,
    role: true,
};

export const userMinimalSelect = {
    id: true,
    fullname: true,
    email: true,
};

export const userPublicSelect = {
    id: true,
    fullname: true,
    email: true,
    photo_url: true,
};

/* ---------- INCLUDE PATTERNS ---------- */
export const userInclude = {
    user: { select: userBasicSelect },
};

export const userMinimalInclude = {
    user: { select: userMinimalSelect },
};

export const userPublicInclude = {
    user: { select: userPublicSelect },
};

/* ---------- SECTION INCLUDE PATTERNS ---------- */
export const sectionWithDeptSemInclude = {
    department: true,
    semester: true,
};

export const sectionFullInclude = {
    ...sectionWithDeptSemInclude,
    students: {
        where: { is_deleted: false },
        include: { user: { select: userPublicSelect } },
    },
};

/* ---------- TEACHING ASSIGNMENT INCLUDE PATTERNS ---------- */
export const teachingAssignmentBasicInclude = {
    teacher: { include: { user: { select: userMinimalSelect } } },
    subject: true,
    section: { include: sectionWithDeptSemInclude },
};

export const teachingAssignmentFullInclude = {
    teacher: { include: { user: { select: userBasicSelect } } },
    subject: true,
    section: { include: sectionFullInclude },
    attendance_sessions: {
        where: { is_deleted: false },
        orderBy: { session_date: 'desc' },
    },
};
