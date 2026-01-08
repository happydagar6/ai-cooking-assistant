'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MessageSquare, X, Send, Loader, Sparkles, Star } from 'lucide-react'

export function FeedbackDialog() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!message.trim()) {
      toast.error('Please enter your feedback')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          userEmail: email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send feedback')
      }

      toast.success('Thank you for your feedback!')
      setMessage('')
      setType('general')
      setOpen(false)

    } catch (error) {
      console.error('Feedback error:', error)
      toast.error(error.message || 'Failed to send feedback')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        title="Send your feedback"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Feedback</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-md max-w-lg w-full p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Share Your Feedback
              </h3>
            </div>
            <p className="text-xs text-gray-500 ml-7">Help us improve CookAI</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'general', label: 'General', icon: '💬' },
                { value: 'bug', label: 'Bug Report', icon: '🐛' },
                { value: 'feature', label: 'Feature', icon: '✨' },
                { value: 'suggestion', label: 'Suggestion', icon: '💡' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  disabled={loading}
                  className={`p-3 rounded-lg border transition-colors text-sm font-medium ${
                    type === option.value
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200'
                  }`}
                >
                  <span className="text-lg mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder="Tell us what you think..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              variant="outline"
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}