import { useState } from 'react';

// Custom hook to prevent double submissions
export function usePreventDoubleSubmit(delay = 2000) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const executeOnce = async (callback) => {
    if (isSubmitting) {
      console.warn('Request already in progress, ignoring duplicate submission');
      return null;
    }

    try {
      setIsSubmitting(true);
      const result = await callback();
      return result;
    } finally {
      // Reset after delay to prevent accidental double submissions
      setTimeout(() => {
        setIsSubmitting(false);
      }, delay);
    }
  };

  return { executeOnce, isSubmitting };
}

// Utility function to create a debounced save function
export function createDebouncedSave(saveFunction, delay = 1000) {
  let timeoutId;
  let isExecuting = false;

  return async (...args) => {
    if (isExecuting) {
      console.warn('Save already in progress, ignoring duplicate call');
      return;
    }

    // Clear any existing timeout
    clearTimeout(timeoutId);

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          isExecuting = true;
          const result = await saveFunction(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          isExecuting = false;
        }
      }, delay);
    });
  };
}