import ApiError from '../utils/ApiError.utils.js';

// Helper function to make error messages more user-friendly
const formatUserFriendlyMessage = (message, errors) => {
    // Handle Prisma unique constraint violations
    if (message?.includes('Unique constraint failed')) {
        if (message.includes('email'))
            return 'This email address is already registered. Please use a different email.';
        if (message.includes('phone_number'))
            return 'This phone number is already registered. Please use a different number.';
        if (message.includes('stdId')) return 'A student with this ID already exists.';
        if (message.includes('teacherId')) return 'A teacher with this ID already exists.';
        return 'A record with these details already exists. Please check your input.';
    }

    // Handle validation errors
    if (errors && typeof errors === 'object') {
        const fieldErrors = [];
        Object.entries(errors).forEach(([field, error]) => {
            if (field !== '_errors' && error?._errors?.length) {
                const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                fieldErrors.push(`${fieldName}: ${error._errors.join(', ')}`);
            }
        });
        if (fieldErrors.length > 0) {
            return fieldErrors.join('. ');
        }
    }

    // Handle common database errors
    if (message?.includes('Foreign key constraint failed')) {
        return 'The referenced record does not exist. Please check your selection.';
    }

    if (message?.includes('Record to update not found')) {
        return 'The record you are trying to update no longer exists.';
    }

    return message;
};

const errorHandler = (err, req, res, next) => {
    // Log error in dev
    console.error(err);

    // If it's a custom ApiError
    if (err instanceof ApiError) {
        const userFriendlyMessage = formatUserFriendlyMessage(err.message, err.errors);
        return res.status(err.statusCode).json({
            success: false,
            message: userFriendlyMessage,
            errors: err.errors || null,
        });
    }

    // Handle Prisma errors
    if (err.code?.startsWith('P')) {
        let message = 'A database error occurred. Please try again.';
        let statusCode = 400;

        switch (err.code) {
            case 'P2002':
                message = formatUserFriendlyMessage(
                    'Unique constraint failed on ' + (err.meta?.target?.join(', ') || 'field'),
                );
                statusCode = 409;
                break;
            case 'P2003':
                message = 'The referenced record does not exist. Please check your selection.';
                statusCode = 400;
                break;
            case 'P2025':
                message = 'The record you are looking for does not exist.';
                statusCode = 404;
                break;
            default:
                break;
        }

        return res.status(statusCode).json({
            success: false,
            message,
            errors: null,
        });
    }

    // Default: Internal Server Error
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
        success: false,
        message: isDevelopment
            ? err.message || 'Internal server error'
            : 'Something went wrong. Please try again later.',
        errors: isDevelopment ? { stack: err.stack, name: err.name } : null,
    });
};

export default errorHandler;
