"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ChevronDown } from 'lucide-react'

export function PullToRefreshIndicator({ 
  isPulling, 
  isRefreshing, 
  pullProgress, 
  pullDistance 
}) {
  const isTriggered = pullProgress >= 100

  return (
    <AnimatePresence>
      {(isPulling || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ 
            opacity: 1, 
            y: Math.min(pullDistance - 60, 0)
          }}
          exit={{ opacity: 0, y: -60 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm text-primary-foreground"
          style={{
            height: Math.min(pullDistance, 80),
          }}
        >
          <div className="flex items-center gap-2">
            {isRefreshing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Refreshing recipes...</span>
              </>
            ) : isTriggered ? (
              <>
                <ChevronDown className="h-5 w-5" />
                <span className="text-sm font-medium">Release to refresh</span>
              </>
            ) : (
              <>
                <ChevronDown 
                  className="h-5 w-5 transition-transform duration-200"
                  style={{
                    transform: `rotate(${Math.min(pullProgress * 1.8, 180)}deg)`
                  }}
                />
                <span className="text-sm font-medium">Pull to refresh</span>
              </>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/20">
            <motion.div
              className="h-full bg-primary-foreground transition-all duration-150"
              style={{ width: `${pullProgress}%` }}
            />
          </div>
        </motion.div> // what is motion.div? it is a div with animation capabilities provided by framer-motion
      )}
    </AnimatePresence>
  )
}