/**
 * Pagination utility helpers
 * Provides consistent pagination patterns across all services
 */

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Parse and validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @param {number|string} params.page - Page number (1-indexed)
 * @param {number|string} params.limit - Items per page
 * @returns {Object} Validated pagination params with skip/take for Prisma
 */
export const parsePagination = (params = {}) => {
    let page = parseInt(params.page) || DEFAULT_PAGE;
    let limit = parseInt(params.limit) || DEFAULT_LIMIT;

    // Ensure valid bounds
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), MAX_LIMIT);

    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        take: limit,
    };
};

/**
 * Build pagination metadata for response
 * @param {Object} params - Pagination data
 * @param {number} params.total - Total number of items
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @returns {Object} Pagination metadata
 */
export const buildPaginationMeta = ({ total, page, limit }) => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
    };
};

/**
 * Create paginated response wrapper
 * @param {Array} data - The data array
 * @param {number} total - Total count
 * @param {Object} pagination - Pagination params (page, limit)
 * @returns {Object} Paginated response with data and meta
 */
export const paginatedResponse = (data, total, { page, limit }) => {
    return {
        data,
        pagination: buildPaginationMeta({ total, page, limit }),
    };
};

/**
 * Build cursor-based pagination params (for future use)
 * @param {Object} params - Cursor pagination parameters
 * @param {string} params.cursor - Cursor ID
 * @param {number} params.limit - Items per page
 * @returns {Object} Prisma cursor pagination params
 */
export const buildCursorPagination = ({ cursor, limit = DEFAULT_LIMIT }) => {
    const take = Math.min(Math.max(1, parseInt(limit) || DEFAULT_LIMIT), MAX_LIMIT);

    if (!cursor) {
        return { take };
    }

    return {
        take,
        skip: 1, // Skip the cursor item
        cursor: { id: cursor },
    };
};
