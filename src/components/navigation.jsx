'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChefHat,
  User,
  LogOut,
  Menu,
  X,
  Search,
  BookOpen,
  Home,
  Sparkles
} from 'lucide-react'
import { SignInButton, UserButton } from '@clerk/nextjs'

export default function Navigation() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (loading) {
    return null
  }

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search Recipes', icon: Search },
    { href: '/dashboard', label: 'My Recipes', icon: BookOpen },
  ]

  const isActive = (href) => pathname === href

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${
        isScrolled
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-b border-orange-400/50 shadow-lg'
          : 'bg-gradient-to-r from-orange-500 to-orange-600 border-b border-orange-400 shadow-sm'
      }`} style={{ transform: 'translateZ(0)', WebkitFontSmoothing: 'antialiased', backfaceVisibility: 'hidden' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16" style={{ WebkitFontSmoothing: 'antialiased' }}>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-base sm:text-xl font-bold text-white hover:text-white/80 transition-colors group min-h-10 min-w-10"
            >
              <div className="relative">
                <ChefHat className="h-6 sm:h-7 w-6 sm:w-7 group-hover:scale-110 transition-transform duration-200" />
                <Sparkles className="h-2.5 sm:h-3 w-2.5 sm:w-3 absolute -top-1 -right-1 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <span className="text-white hidden sm:inline font-bold drop-shadow-sm">
                CookAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      className={`relative group transition-all duration-200 min-h-10 font-semibold ${
                        active
                          ? 'bg-white/25 hover:bg-white/35 text-white shadow-lg'
                          : 'text-white/90 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                      {active && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium truncate max-w-[100px]">
                      {user.firstName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0]}
                    </span>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9 ring-2 ring-orange-300 hover:ring-orange-200 transition-all duration-200"
                      }
                    }}
                  />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <Button
                    size="sm"
                    className="flex bg-white text-orange-600 hover:bg-gray-100 shadow-md hover:shadow-lg transition-all duration-200 min-h-10 font-semibold text-xs sm:text-sm px-2 sm:px-4"
                  >
                    <span className="hidden sm:inline">Sign In / Sign Up</span>
                    <span className="sm:hidden">Sign In</span>
                  </Button>
                </SignInButton>
              )}

              {/* Mobile Menu Button - only for logged in users or navigation links */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden p-2 hover:bg-white/20 text-white min-h-10 min-w-10"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              )}

              {/* Desktop Menu Button */}
              {!user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden p-2 hover:bg-slate-100 min-h-10 min-w-10"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-white border-t border-slate-100 px-4 py-3 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={`w-full justify-start transition-all duration-200 min-h-12 font-semibold ${
                      active
                        ? 'bg-gradient-to-r from-slate-600 to-teal-600 hover:from-slate-700 hover:to-teal-700 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-teal-600'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}

            {/* Mobile User Actions */}
            <div className="pt-2 border-t border-slate-100">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 min-h-12">
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium truncate max-w-[100px]">
                      {user.firstName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0]}
                    </span>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8"
                      }
                    }}
                  />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <Button className="w-full bg-gradient-to-r from-slate-600 to-teal-600 hover:from-slate-700 hover:to-teal-700 text-white shadow-md min-h-12 font-semibold">
                    Sign In / Sign Up
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  )
}