"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Mic, ChefHat, Sparkles, TrendingUp, Users, Star, ArrowRight, Utensils, Timer, Brain, Search } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";

// Logged Out Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section - SIMPLIFIED & FOCUSED */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-6">
              <Sparkles className="h-3 sm:h-4 w-3 sm:w-4" />
              AI-Powered Cooking Assistant
            </div>
            
            {/* Hero Title - Shorter */}
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Cook Like a{" "}
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Chef
              </span>
            </h1>
            
            {/* Hero Description - Concise */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
              Get personalized recipes, voice-guided cooking, and AI nutrition insights in seconds.
            </p>
            
            {/* Primary CTA - SIGN UP */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/search">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 sm:px-10 py-3 sm:py-4 text-lg gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto min-h-14 font-semibold">
                  <ChefHat className="h-5 w-5" />
                  Get Started Free
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 sm:px-10 py-3 sm:py-4 text-lg border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 w-full sm:w-auto min-h-14 font-semibold text-gray-900"
              >
                <Mic className="h-5 w-5 mr-2" />
                Try Voice Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features - MINIMAL */}
      <section className="py-16 sm:py-20 bg-white border-t border-orange-100/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Mic className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Voice Guided</h3>
              <p className="text-gray-600 text-sm">
                Hands-free cooking with AI voice instructions
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Smart AI</h3>
              <p className="text-gray-600 text-sm">
                Personalized recipes based on ingredients
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nutrition Data</h3>
              <p className="text-gray-600 text-sm">
                AI-powered health analysis for every recipe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - SIMPLE STATS */}
      <section className="py-12 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center text-white">
            <div>
              <div className="text-3xl sm:text-4xl font-bold">10K+</div>
              <div className="text-orange-100 text-sm sm:text-base mt-1">Recipes</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">5K+</div>
              <div className="text-orange-100 text-sm sm:text-base mt-1">Users</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold">4.9★</div>
              <div className="text-orange-100 text-sm sm:text-base mt-1">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA - REPEAT */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Cook Better?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of home cooks using AI to make delicious meals every day.
          </p>
          <Link href="/search">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-10 py-4 text-lg gap-3 shadow-lg hover:shadow-xl transition-all duration-300 min-h-14 font-semibold">
              <ChefHat className="h-5 w-5" />
              Start Cooking Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Logged In Dashboard Component
function LoggedInHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, Chef!</h1>
              <p className="text-gray-600">Ready to create something delicious today?</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md">
            <Link href="/search">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Voice Search</h3>
                <p className="text-sm text-gray-600">Find recipes with voice commands</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md">
            <Link href="/search">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Browse Recipes</h3>
                <p className="text-sm text-gray-600">Explore thousands of recipes</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md">
            <Link href="/dashboard">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">My Recipes</h3>
                <p className="text-sm text-gray-600">View your saved recipes</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md">
            <Link href="/search">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Meals</h3>
                <p className="text-sm text-gray-600">30-minute recipes</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Featured Card */}
        <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg">
          <CardContent className="p-4 sm:p-8">
            <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
              <div className="hidden sm:block">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full flex items-center justify-center">
                    <Utensils className="h-12 sm:h-16 w-12 sm:w-16 text-white" />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">What would you like to cook?</h2>
                <p className="text-sm sm:text-base text-orange-100 mb-4 sm:mb-6">Try voice search to get personalized recipes based on ingredients you have</p>
                <Link href="/search">
                  <Button size="sm" className="bg-white text-orange-600 hover:bg-orange-50 gap-2 font-semibold text-xs sm:text-base">
                    <Mic className="h-4 sm:h-5 w-4 sm:w-5" />
                    Start Voice Search
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Page Component
export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      {user ? <LoggedInHomePage /> : <LandingPage />}
    </div>
  );
}
