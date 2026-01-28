import ApiError from './ApiError.utils.js';

export const validateSchema = (schema, data, errorMessage = 'Validation failed') => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        throw new ApiError(422, errorMessage, parsed.error.format());
    }
    return parsed.data;
};

export const validateBody = (schema, body) => {
    return validateSchema(schema, body);
};

export const validateParams = (schema, params) => {
    return validateSchema(schema, params);
};

export const validateQuery = (schema, query) => {
    return validateSchema(schema, query);
};

export default validateSchema;
