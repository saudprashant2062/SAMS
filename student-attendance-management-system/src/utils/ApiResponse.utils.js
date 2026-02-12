class ApiResponse {
    constructor(statusCode, data, message = 'Success') {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;

        // If data is a paginated response ({ data, pagination }),
        // spread it so data stays the array and pagination is a sibling
        if (data && data.pagination && Array.isArray(data.data)) {
            const { data: items, pagination, ...rest } = data;
            this.data = items;
            this.pagination = pagination;
            // Preserve any extra fields (e.g., subjects, summary)
            Object.assign(this, rest);
        } else {
            this.data = data;
        }
    }
}

export default ApiResponse;
