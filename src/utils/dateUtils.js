/**
 * Date utility functions for the WatchService application
 */

// Constants for month indices (0-indexed)
const MONTHS = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  APRIL: 3,
  MAY: 4,
  JUNE: 5,
  JULY: 6,
  AUGUST: 7,
  SEPTEMBER: 8,
  OCTOBER: 9,
  NOVEMBER: 10,
  DECEMBER: 11
};

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 * @param {Date} date - The date to format
 * @returns {string} ISO formatted date string (YYYY-MM-DD)
 */
export const formatDateToISO = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Calculates the current financial year date range.
 * Financial year runs from April 1st to March 31st.
 * 
 * @returns {{from: string, to: string}} Object containing ISO formatted date strings
 * @example
 * // If current date is February 15, 2024
 * getFinancialYearDates()
 * // Returns: { from: '2023-04-01', to: '2024-03-31' }
 * 
 * @example
 * // If current date is June 20, 2024
 * getFinancialYearDates()
 * // Returns: { from: '2024-04-01', to: '2025-03-31' }
 */
export const getFinancialYearDates = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Financial year runs from April 1 to March 31
  // If current month is Jan-Mar, FY started last year
  // If current month is Apr-Dec, FY started this year
  const fyStartYear = currentMonth < MONTHS.APRIL ? currentYear - 1 : currentYear;
  const fyEndYear = fyStartYear + 1;
  
  // Create dates for financial year boundaries
  const fromDate = new Date(fyStartYear, MONTHS.APRIL, 1); // April 1st
  const toDate = new Date(fyEndYear, MONTHS.MARCH, 31); // March 31st
  
  return {
    from: formatDateToISO(fromDate),
    to: formatDateToISO(toDate)
  };
};

/**
 * Gets the current date in ISO format (YYYY-MM-DD)
 * @returns {string} Today's date in ISO format
 */
export const getTodayISO = () => {
  return formatDateToISO(new Date());
};

/**
 * Parses an ISO date string to a Date object
 * @param {string} isoString - ISO date string (YYYY-MM-DD)
 * @returns {Date} Date object
 */
export const parseISODate = (isoString) => {
  return new Date(isoString);
};

/**
 * Checks if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date, false otherwise
 */
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

