"use client"

import { useCallback, useRef, useState, useEffect } from 'react'

export function useTouchGestures({
  onSwipeLeft = () => {},
  onSwipeRight = () => {},
  onSwipeUp = () => {},
  onSwipeDown = () => {},
  onPullToRefresh = () => {},
  threshold = 50, // Minimum distance for a swipe
  velocityThreshold = 0.3, // Minimum velocity for a swipe
  pullToRefreshThreshold = 100, // Distance to trigger pull-to-refresh
  enabled = true,
}) {
  const touchStartRef = useRef(null)
  const touchEndRef = useRef(null)
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastTouchTimeRef = useRef(0)
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return
    
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    touchEndRef.current = null
    lastTouchTimeRef.current = Date.now()
  }, [enabled])

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !touchStartRef.current) return

    const touch = e.touches[0]
    const currentTime = Date.now()
    const deltaTime = currentTime - lastTouchTimeRef.current

    if (deltaTime > 0) {
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      
      velocityRef.current = {
        x: deltaX / deltaTime,
        y: deltaY / deltaTime,
      }
    }

    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: currentTime,
    }

    // Handle pull-to-refresh
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    if (scrollTop === 0 && touchEndRef.current.y > touchStartRef.current.y) {
      const pullDistance = touchEndRef.current.y - touchStartRef.current.y
      
      if (pullDistance > 10) {
        setIsPulling(true)
        setPullDistance(Math.min(pullDistance, pullToRefreshThreshold + 50))
        
        // Prevent default scrolling when pulling (now works with non-passive listener)
        e.preventDefault()
      }
      
      if (pullDistance > pullToRefreshThreshold && !isRefreshing) {
        // Visual feedback - could add haptic feedback here
      }
    }

    lastTouchTimeRef.current = currentTime
  }, [enabled, pullToRefreshThreshold, isRefreshing])

  const handleTouchEnd = useCallback(async (e) => {
    if (!enabled || !touchStartRef.current || !touchEndRef.current) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x
    const deltaY = touchEndRef.current.y - touchStartRef.current.y
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = Math.sqrt(
      velocityRef.current.x * velocityRef.current.x + 
      velocityRef.current.y * velocityRef.current.y
    )

    // Handle pull-to-refresh
    if (isPulling && pullDistance > pullToRefreshThreshold) {
      setIsRefreshing(true)
      try {
        onPullToRefresh();
      } catch (error) {
        console.error('Error in onPullToRefresh:', error);
      } finally {
        setIsRefreshing(false)
        setIsPulling(false)
        setPullDistance(0)
      }
      return
    }

    // Reset pull state
    setIsPulling(false)
    setPullDistance(0)

    // Check if gesture meets swipe criteria
    if (distance < threshold || velocity < velocityThreshold) {
      return
    }

    // Determine swipe direction based on the larger delta
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight(e, { distance, velocity, deltaX, deltaY, deltaTime })
      } else {
        onSwipeLeft(e, { distance, velocity, deltaX, deltaY, deltaTime })
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown(e, { distance, velocity, deltaX, deltaY, deltaTime })
      } else {
        onSwipeUp(e, { distance, velocity, deltaX, deltaY, deltaTime })
      }
    }

    // Clean up
    touchStartRef.current = null
    touchEndRef.current = null
  }, [
    enabled,
    threshold,
    velocityThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullToRefresh,
    isPulling,
    pullDistance,
    pullToRefreshThreshold,
  ])

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  }

  // Return a ref that can be attached to elements that need non-passive touch events
  const attachToElement = useCallback((element) => {
    if (!element || !enabled) return

    const touchMoveHandler = (e) => {
      handleTouchMove(e)
    }

    // Register with { passive: false } to allow preventDefault
    element.addEventListener('touchmove', touchMoveHandler, { passive: false })

    // Return cleanup function
    return () => {
      element.removeEventListener('touchmove', touchMoveHandler)
    }
  }, [enabled, handleTouchMove])

  // Alternative: useEffect approach for document-level handling
  useEffect(() => {
    if (!enabled) return

    const touchMoveHandler = (e) => {
      handleTouchMove(e)
    }

    // Only add if we're in a pull-to-refresh state or need preventDefault
    if (isPulling) {
      document.addEventListener('touchmove', touchMoveHandler, { passive: false })
      
      return () => {
        document.removeEventListener('touchmove', touchMoveHandler)
      }
    }
  }, [enabled, handleTouchMove, isPulling])

  return {
    gestureHandlers,
    attachToElement,
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min((pullDistance / pullToRefreshThreshold) * 100, 100),
  }
}