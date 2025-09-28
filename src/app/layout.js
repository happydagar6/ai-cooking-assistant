import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { ProfileSync } from "@/components/profile-sync"
import { Toaster } from "@/components/ui/sonner"
import QueryProvider from "@/providers/query-provider"
import Footer from "@/components/footer"
import "./globals.css"
import "../styles/touch-gestures.css"

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
  fallback: ['system-ui', 'arial'],
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
  fallback: ['monospace'],
})

export const metadata = {
  title: "CookAI - Voice-Powered Cooking Assistant",
  description: "Cook hands-free with AI-powered voice guidance and step-by-step instructions",
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}>
          <QueryProvider>
            <ProfileSync />
            <Suspense fallback={null}>{children}</Suspense>
            <Footer />
            <Toaster 
              position="top-right"
              expand={false}
              richColors
              closeButton
            />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}