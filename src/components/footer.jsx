'use client'

import Link from 'next/link'
import { ChefHat, Heart, Github, Mail, Sparkles } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <ChefHat className="h-6 w-6 text-orange-600 group-hover:text-orange-700 transition-colors" />
                <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                CookAI
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your AI-powered cooking companion. Cook hands-free with voice guidance and step-by-step instructions.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Heart className="h-3 w-3 text-red-400 fill-current" />
              <span>Made with love for food lovers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/search"
                className="text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 hover:translate-x-1 transform"
              >
                Search Recipes
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 hover:translate-x-1 transform"
              >
                My Recipes
              </Link>
            </div>
          </div>

          {/* Contact & Connect */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Connect
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:harshitdagar913@gmail.com"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-all duration-200 group"
              >
                <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>harshitdagar913@gmail.com</span>
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Built by:</span>
                <span className="text-orange-600 font-medium">Kapil Dagar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © {currentYear} CookAI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-600 transition-colors duration-200 hover:scale-110 transform"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}