/**
 * Validates a password against system requirements
 * @param {string} password - The password string to validate
 * @returns {Object} Requirements status
 */
export const validatePassword = (password) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[#@$!%*?&]/.test(password),
  };
};

/**
 * Checks if all password requirements are met
 * @param {Object} requirements - The object returned by validatePassword
 * @returns {boolean}
 */
export const isPasswordValid = (requirements) => {
  return Object.values(requirements).every(Boolean);
};
