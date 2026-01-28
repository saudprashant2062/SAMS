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
    const { limit = 20, entity_type } = req.query;

    const activities = await getRecentActivitiesService({
        limit: parseInt(limit) || 20,
        entity_type,
    });

    const count = await getActivityCountService();

    res.status(200).json(new ApiResponse(200, { activities, total: count }, 'Activities fetched'));
});

/**
 * Get activity logs with pagination and filters
 * GET /admin/activity-logs/all
 */
export const getAllActivities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, entity_type, user_id, start_date, end_date } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await getRecentActivitiesService({
        limit: parseInt(limit),
        entity_type,
        user_id,
        startDate: start_date,
        endDate: end_date,
    });

    const count = await getActivityCountService();

    res.status(200).json(
        new ApiResponse(
            200,
            {
                activities,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / parseInt(limit)),
                },
            },
            'Activities fetched',
        ),
    );
});
