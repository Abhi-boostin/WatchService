/**
 * Utility functions for handling API errors
 */

/**
 * Gets a user-friendly error message from an API error
 * @param {Error} error - The error object from axios
 * @param {string} fallbackMessage - Default message if no specific error is found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, fallbackMessage = 'An error occurred. Please try again.') => {
    // Check if we have a pre-formatted display message from the interceptor
    if (error.displayMessage) {
        return error.displayMessage;
    }
    
    // Check for standard error response message
    if (error.response?.data?.error?.message) {
        return error.response.data.error.message;
    }
    
    // Check for simple message field
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    
    // Check for detail field (some APIs use this)
    if (error.response?.data?.detail) {
        return typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : fallbackMessage;
    }
    
    // Fallback to default message
    return fallbackMessage;
};

/**
 * Checks if an error is a validation error (422)
 * @param {Error} error - The error object from axios
 * @returns {boolean} True if it's a validation error
 */
export const isValidationError = (error) => {
    return error.response?.status === 422 && error.response?.data?.error?.fields;
};

