"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import analyticsService from "@/lib/analytics-service";

export function useCookingSession(recipe) {
  const [session, setSession] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const intervalRef = useRef(null); // To track elapsed time
  const sessionRef = useRef(null); // To store the start time

  // Start cooking session
  const startSession = useCallback(async () => {
    if (!recipe || isSessionActive) return;

    setIsLoading(true);
    setError(null);

    try {
      const estimatedTime = recipe.prep_time + recipe.cook_time;
      const totalSteps = recipe.instructions.length || 0;

      const newSession = await analyticsService.startCookingSession(
        recipe.id,
        estimatedTime,
        totalSteps
      );

      setSession(newSession);
      setSessionStartTime(Date.now());
      setIsSessionActive(true);
      sessionRef.current = newSession;

      // Start timer
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1200); // Update every 1.2 seconds to reduce drift
    } catch (err) {
      console.error("Failed to start cooking session:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [recipe, isSessionActive]);

  // End cooking session
  const endSession = useCallback(
    async (stepsCompleted = 0) => {
      if (!session || !isSessionActive) return;
      setIsLoading(true);

      try {
        const actualTimeMinutes = Math.ceil(elapsedTime / 60); // Convert seconds to minutes

        await analyticsService.completeCookingSession(
          session.id,
          actualTimeMinutes,
          stepsCompleted
        );

        // Clear timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsSessionActive(false);
        setElapsedTime(0);
        setSessionStartTime(null);
      } catch (error) {
        console.error("Failed to end cooking session:", error);
        setError("Failed to end cooking session: " + error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [session, isSessionActive, elapsedTime]
  );

  // Track feature usage
  const trackFeature = useCallback(
    async (featureName, metadata = {}) => {
      if (!session || !isSessionActive) return;

      try {
        await analyticsService.trackFeatureUsage(
          session.id,
          featureName,
          metadata
        );
      } catch (err) {
        console.error("Failed to track feature usage:", err);
      }
    },
    [session, isSessionActive]
  );

  // Format elapsed time
  const formatElapsedTime = useCallback(() => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [elapsedTime]);

  // Update session data
  const updateSession = useCallback(
    async (updates) => {
      if (!session) return;

      try {
        const updateSession = await analyticsService.updateCookingSession(
          session.id,
          updates
        );
        setSession(updateSession);
      } catch (error) {
        console.error("Failed to update cooking session:", error);
      }
    },
    [session]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // What useEffect doing here?: Cleanup on unmount. What is Cleanup on unmount?: When the component using this hook is removed from the UI, this function runs to clear any ongoing intervals to prevent memory leaks.

  // AUto save session data periodically
  useEffect(() => {
    if (!session || !isSessionActive) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        await analyticsService.updateCookingSession(session.id, {
          session_data: {
            ...session.session_data,
            elapsed_time: elapsedTime,
            last_activity: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error("Failed to auto-save cooking session:", err);
      }
    }, 40000); // Auto-save every 40 seconds.

    return () => clearInterval(autoSaveInterval);
  }, [session, isSessionActive, elapsedTime]);

  return {
    // Session state
    session,
    isSessionActive,
    sessionStartTime,
    elapsedTime,
    formattedElapsedTime: formatElapsedTime(),
    error,
    isLoading,

    // Session actions
    startSession,
    endSession,
    trackFeature,
    updateSession,

    // Utilities
    clearError: () => setError(null),
  };
}
