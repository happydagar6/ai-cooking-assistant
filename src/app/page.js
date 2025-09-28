"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Mic } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/navigation";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      <Navigation />
      
      {/*Hero Section*/}
      <main className="container mx-auto px-4 py-12 flex-grow">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Voice-Powered Cooking Assistant
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Cook Hands-Free with <span className="text-primary">AI Guidance</span>
          </h2>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto mb-8">
            Ask what to cook, get step-by-step voice instructions, and never touch your phone with messy hands again.
          </p>

              {/* Voice Input Demo */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/search">
              <Button size="lg" className="gap-2 min-h-12 px-8">
                <Mic className="h-5 w-5" />
                Start Cooking
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">Try saying: &quot;What can I make with eggs and bread?&quot;</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Mic className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Voice Commands</CardTitle>
              <CardDescription>
                Ask questions and get instant recipe suggestions without touching your device
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Step-by-Step Instructions</CardTitle>
              <CardDescription>
                Follow along with voice instructions, timers, and easy navigation between steps
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Smart Substitutions</CardTitle>
              <CardDescription>Missing ingredients? Get instant alternatives and cooking tips from AI</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/*Quick Start Demo*/}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Try It Now</CardTitle>
            <CardDescription className="text-center">Click the microphone and ask what you can cook</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Link href="/search">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-24 h-24 rounded-full border-2 border-dashed border-primary/50 hover:border-primary transition-colors bg-transparent"
                >
                  <Mic className="h-8 w-8 text-primary" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground text-center">Voice recognition ready - click to start</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
