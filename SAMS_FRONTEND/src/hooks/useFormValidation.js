import { useState, useCallback } from "react";

/**
 * Custom hook for form validation using Zod schemas
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 * @returns {Object} - Validation functions and error state
 */
export const useFormValidation = (schema) => {
  const [errors, setErrors] = useState({});

  /**
   * Validate entire form data
   * @param {Object} data - Form data to validate
   * @returns {Object} - { isValid: boolean, data?: validated data, errors?: validation errors }
   */
  const validate = useCallback(
    (data) => {
      const result = schema.safeParse(data);

      if (result.success) {
        setErrors({});
        return { isValid: true, data: result.data };
      }

      // Format Zod errors into a simple object
      const formattedErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!formattedErrors[path]) {
          formattedErrors[path] = issue.message;
        }
      });

      setErrors(formattedErrors);
      return { isValid: false, errors: formattedErrors };
    },
    [schema],
  );

  /**
   * Validate a single field
   * @param {string} fieldName - Name of the field to validate
   * @param {*} value - Value of the field
   * @param {Object} fullData - Full form data for context-dependent validation
   * @returns {string|null} - Error message or null if valid
   */
  const validateField = useCallback(
    (fieldName, value, fullData = {}) => {
      // Create partial data with the field
      const dataToValidate = { ...fullData, [fieldName]: value };

      // Try to validate just this field using partial schema
      const fieldSchema = schema.shape?.[fieldName];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          const errorMessage =
            result.error.issues[0]?.message || "Invalid value";
          setErrors((prev) => ({ ...prev, [fieldName]: errorMessage }));
          return errorMessage;
        }
      }

      // Clear error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return null;
    },
    [schema],
  );

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Clear error for a specific field
   * @param {string} fieldName - Name of the field
   */
  const clearFieldError = useCallback((fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Set a custom error for a field
   * @param {string} fieldName - Name of the field
   * @param {string} message - Error message
   */
  const setFieldError = useCallback((fieldName, message) => {
    setErrors((prev) => ({ ...prev, [fieldName]: message }));
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
};

export default useFormValidation;
