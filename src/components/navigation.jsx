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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg'
          : 'bg-white border-b border-gray-100'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-base sm:text-xl font-bold text-orange-600 hover:text-orange-700 transition-colors group min-h-10 min-w-10"
            >
              <div className="relative">
                <ChefHat className="h-6 sm:h-7 w-6 sm:w-7 group-hover:scale-110 transition-transform duration-200" />
                <Sparkles className="h-2.5 sm:h-3 w-2.5 sm:w-3 absolute -top-1 -right-1 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent hidden sm:inline">
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
                      className={`relative group transition-all duration-200 min-h-10 ${
                        active
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                          : 'hover:bg-orange-50 hover:text-orange-600'
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
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium truncate max-w-[100px]">
                      {user.firstName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0]}
                    </span>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9 ring-2 ring-orange-100 hover:ring-orange-200 transition-all duration-200"
                      }
                    }}
                  />
                </div>
              ) : (
                <SignInButton>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all duration-200 min-h-10"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2 hover:bg-orange-50 min-h-10 min-w-10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={`w-full justify-start transition-all duration-200 min-h-12 ${
                      active
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}

            {/* Mobile User Actions */}
            <div className="pt-2 border-t border-gray-100">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 min-h-12">
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
                <SignInButton>
                  <Button variant="outline" className="w-full hover:bg-orange-50 hover:border-orange-200 min-h-12">
                    Sign In
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