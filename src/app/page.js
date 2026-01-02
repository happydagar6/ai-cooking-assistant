"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Mic, ChefHat, Sparkles, TrendingUp, Users, Star, ArrowRight, Utensils, Timer, Brain } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";

// Logged Out Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Sparkles className="h-3 sm:h-4 w-3 sm:w-4" />
              AI-Powered Cooking Assistant
            </div>
            
            {/* Hero Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Cook Like a{" "}
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Chef
              </span>
              <br />
              With AI Guidance
            </h1>
            
            {/* Hero Description */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              Transform your kitchen into a smart cooking space. Get personalized recipes, voice-guided instructions, and AI-powered nutrition analysis.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
              <Link href="/search">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg gap-2 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto min-h-12 sm:min-h-14">
                  <ChefHat className="h-5 w-5" />
                  Start Cooking Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-2 hover:bg-orange-50 transition-all duration-300 w-full sm:w-auto min-h-12 sm:min-h-14">
                <Mic className="h-5 w-5 mr-2" />
                Try Voice Demo
              </Button>
            </div>
            
            {/* Voice Demo Hint */}
            <div className="bg-white/70 backdrop-blur-sm border border-orange-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg mx-auto">
              <p className="text-xs sm:text-sm text-orange-700 font-medium">
                💬 Try saying: &quot;What can I make with chicken and rice?&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose CookAI?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of cooking with our AI-powered features designed to make you a better chef.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Voice Commands */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Voice Commands</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Cook hands-free with voice commands. Ask questions, get recipes, and control your cooking session without touching your device.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Smart Instructions */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Timer className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Smart Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Follow step-by-step voice instructions with built-in timers, temperature guides, and smart cooking tips tailored to your skill level.
                </CardDescription>
              </CardContent>
            </Card>

            {/* AI Nutrition */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">AI Nutrition Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Get detailed nutrition insights, health scores, and personalized suggestions to make every meal healthier and more balanced.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-orange-100">Recipes Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5K+</div>
              <div className="text-orange-100">Happy Cooks</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-orange-100">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of home cooks who&apos;ve elevated their culinary skills with AI-powered assistance.
          </p>
          <Link href="/search">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-12 py-4 text-lg gap-3 shadow-lg hover:shadow-xl transition-all duration-300">
              <ChefHat className="h-6 w-6" />
              Get Started Free
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
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
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

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <Link href="/dashboard">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">My Recipes</h3>
                <p className="text-sm text-gray-600">View your saved recipes</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <Link href="/search">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Trending</h3>
                <p className="text-sm text-gray-600">Popular recipes today</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <Link href="/search?q=quick meals">
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

        {/* Main Action Card */}
        <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white mb-12">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">What would you like to cook today?</h2>
                <p className="text-orange-100 mb-4">Use voice commands or type your ingredients to get started</p>
                <div className="flex gap-3">
                  <Link href="/search">
                    <Button variant="secondary" size="lg" className="gap-2">
                      <Mic className="h-5 w-5" />
                      Start Voice Search
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button 
                      size="lg" 
                      className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-orange-600 transition-all duration-300 font-medium"
                    >
                      Browse Recipes
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Utensils className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-amber-800" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Cooking Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Use voice commands while cooking to keep hands clean</li>
                <li>• Try &quot;analyze nutrition&quot; for health insights</li>
                <li>• Save recipes you love for quick access</li>
                <li>• Ask for ingredient substitutions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-blue-500" />
                Voice Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• &quot;What can I make with...&quot;</li>
                <li>• &quot;Show me quick dinner recipes&quot;</li>
                <li>• &quot;Next step&quot; during cooking</li>
                <li>• &quot;Set timer for 10 minutes&quot;</li>
              </ul>
            </CardContent>
          </Card>
        </div>
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
