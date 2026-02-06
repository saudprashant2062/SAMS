import asyncHandler from '../../utils/asyncHandler.utils.js';
import ApiResponse from '../../utils/ApiResponse.utils.js';
import {
    getRecentActivitiesService,
    getActivityCountService,
} from '../../services/admin/activityLog.service.js';

/**
 * Get recent activities for admin dashboard
 * GET /admin/activity-logs
 */
export const getRecentActivities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, entity_type } = req.query;

    const result = await getRecentActivitiesService({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        entity_type,
    });

    res.status(200).json(new ApiResponse(200, result, 'Activities fetched'));
});

/**
 * Get activity logs with pagination and filters
 * GET /admin/activity-logs/all
 */
export const getAllActivities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, entity_type, action, user_id, start_date, end_date } = req.query;

    const result = await getRecentActivitiesService({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        entity_type,
        action,
        user_id,
        startDate: start_date,
        endDate: end_date,
    });

    res.status(200).json(new ApiResponse(200, result, 'Activities fetched'));
});
