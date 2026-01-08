'use client'

import Link from 'next/link'
import { ChefHat, Heart, Github, Mail, ArrowRight, Coffee } from 'lucide-react'
import { FeedbackDialog } from './feedback-dialog'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Main Footer Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-6">

          {/* Brand Section */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center group-hover:bg-teal-700 transition-colors duration-300">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                CookAI
              </span>
            </Link>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm">
              AI-powered cooking with voice guidance. Cook hands-free.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Heart className="h-3 w-3 text-red-500 fill-current animate-pulse" />
              <span>Made with love</span>
            </div>
          </div>

          {/* Quick Links - compact 2 columns */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Features
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/search"
                className="group flex items-center gap-1.5 text-xs text-gray-600 hover:text-teal-600 transition-all duration-200"
              >
                <span className="group-hover:translate-x-0.5 transition-transform">Voice Search</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/dashboard"
                className="group flex items-center gap-1.5 text-xs text-gray-600 hover:text-teal-600 transition-all duration-200"
              >
                <span className="group-hover:translate-x-0.5 transition-transform">My Recipes</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/search"
                className="group flex items-center gap-1.5 text-xs text-gray-600 hover:text-teal-600 transition-all duration-200"
              >
                <span className="group-hover:translate-x-0.5 transition-transform">Browse</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                <Coffee className="h-3 w-3 text-teal-600" />
                <span className="text-xs text-gray-700 truncate">Kapil Dagar</span>
              </div>
            </div>
          </div>

          {/* Connect Section - compact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex items-center gap-2">
              <a
                href="mailto:harshitdagar913@gmail.com"
                className="p-2 rounded-lg bg-gray-100 hover:bg-teal-600 text-gray-600 hover:text-white transition-all duration-300 group"
                title="Send email"
              >
                <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-100 hover:bg-teal-600 text-gray-600 hover:text-white transition-all duration-300 group"
                title="Visit GitHub"
              >
                <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </a>
              <FeedbackDialog />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mb-4" />

        {/* Bottom Section - Compact */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
          <p>
            © {currentYear} <span className="font-semibold text-gray-900">CookAI</span> | Made with 🍳
          </p>
        </div>
      </div>
    </footer>
  )
}