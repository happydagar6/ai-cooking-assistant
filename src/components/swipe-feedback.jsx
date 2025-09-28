"use client"

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { useEffect, useState } from "react"

export function SwipeFeedback() {
    const [feedback, setFeedback] = useState(null); // 'like', 'dislike', or null

    useEffect(() => {
        if(feedback) {
            const timer = setTimeout(() => setFeedback(null), 1500);
            return () => clearTimeout(timer);
        }
    }, [feedback]); // Clear feedback after 1.5 seconds. Why feedback dependency? To reset timer on new feedback.

    // Expose functions to triggers feedback
    useEffect(() => {
        window.showSwipeFeedback = (type, message) => {
            setFeedback({ type, message, id: Date.now() });
        }

        return () => {
            delete window.showSwipeFeedback;
        }
    }, []); // Empty dependency array to set up once on mount

    const getIcon = (type) => {
        switch(type) {
            case 'swipe-left':
                return <SkipForward className="h-6 w-6" />;
            case 'swipe-right':
                return <SkipForward className="h-6 w-6 rotate-180" />;
            case 'next':
                return <ChevronRight className="h-6 w-6" />;
            case 'previous':
                return <ChevronLeft className="h-6 w-6 rotate-180" />;
            default:
                return <ChevronRight className="h-6 w-6" />;
        }
    }

    const getColor = (type) => {
        switch(type) {
            case 'swipe-left':
            case 'next':
                return "bg-green-500/90"
            case 'swipe-right':
            case 'previous':
                return "bg-blue-500/90"
            default:
                return "bg-primary/90"
        }
    }

   return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          key={feedback.id}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 rounded-full p-4 text-white shadow-lg ${getColor(feedback.type)} backdrop-blur-sm`}
        >
          <div className="flex items-center gap-3">
            {getIcon(feedback.type)}
            <span className="font-medium">{feedback.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}