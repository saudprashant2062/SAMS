import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.utils.js';

/**
 * Log an activity
 * @param {Object} data - Activity data
 * @param {string} data.user_id - User who performed the action
 * @param {string} data.action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} data.entity_type - Type of entity (User, Student, Teacher, etc.)
 * @param {string} [data.entity_id] - ID of the entity
 * @param {string} data.description - Human-readable description
 * @param {Object} [data.metadata] - Additional metadata
 * @param {string} [data.ip_address] - User's IP address
 * @param {string} [data.user_agent] - User's browser user agent
 */
export const logActivity = async data => {
    const {
        user_id,
        action,
        entity_type,
        entity_id = null,
        description,
        metadata = null,
        ip_address = null,
        user_agent = null,
    } = data;

    return prisma.activityLog.create({
        data: {
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            metadata,
            ip_address,
            user_agent,
        },
    });
};

/**
 * Get recent activities
 * @param {Object} filters - Filters
 * @param {number} [filters.limit=20] - Number of records to return
 * @param {string} [filters.entity_type] - Filter by entity type
 * @param {string} [filters.user_id] - Filter by user
 * @param {string} [filters.startDate] - Filter by start date
 * @param {string} [filters.endDate] - Filter by end date
 */
export const getRecentActivitiesService = async (filters = {}) => {
    const {
        limit = 20,
        entity_type = null,
        user_id = null,
        startDate = null,
        endDate = null,
    } = filters;

    const where = {};

    if (entity_type) {
        where.entity_type = entity_type;
    }

    if (user_id) {
        where.user_id = user_id;
    }

    if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = new Date(startDate);
        if (endDate) where.created_at.lte = new Date(endDate);
    }

    const activities = await prisma.activityLog.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                    role: true,
                    photo_url: true,
                },
            },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
    });

    return activities;
};

/**
 * Get activity count
 */
export const getActivityCountService = async () => {
    return prisma.activityLog.count();
};

/**
 * Get activity by entity
 */
export const getActivitiesByEntityService = async (entity_type, entity_id) => {
    return prisma.activityLog.findMany({
        where: {
            entity_type,
            entity_id,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: { created_at: 'desc' },
    });
};

/**
 * Get user activity
 */
export const getUserActivityService = async (user_id, limit = 50) => {
    return prisma.activityLog.findMany({
        where: { user_id },
        orderBy: { created_at: 'desc' },
        take: limit,
    });
};
