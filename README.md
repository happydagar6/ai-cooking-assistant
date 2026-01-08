# 🍳 CookAI - Voice-Powered Cooking Assistant

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?logo=react&logoColor=white)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase&logoColor=white)](https://supabase.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-purple?logo=clerk&logoColor=white)](https://clerk.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Text--to--Speech-orange?logo=openai&logoColor=white)](https://openai.com/)

> **Cook hands-free with AI guidance.** CookAI is a voice-powered cooking companion that keeps your hands clean while you cook, providing step-by-step instructions via voice and interactive UI.

## ✨ **Key Features**

### 🎙️ **Voice-Powered Cooking**
- **Voice-guided instructions**: Hands-free recipe navigation
- **Text-to-speech**: OpenAI TTS reads instructions naturally
- **Voice commands**: "Next step", "Previous", "Repeat", "Ingredients", "Timer"
- **Persistent voice mode**: Stay in voice control throughout entire cooking session

### 👨‍🍳 **Smart Cooking Tools**
- **Recipe scaling calculator**: Adjust servings and ingredients automatically
- **Interactive timer**: Voice-controlled timer with step tracking
- **Step progress tracking**: Track completed steps with visual indicators
- **Recipe details**: View ingredients, instructions, and prep/cook times
- **Recipe favorites**: Save recipes for quick access

### 📊 **Session Tracking & Analytics**
- **Cooking sessions**: Track cooking time and completion
- **Feature analytics**: Monitor voice command usage and preferences
- **Achievement system**: Unlock cooking achievements
- **Cooking history**: View past cooking sessions and patterns

### 📱 **User-Friendly Interface**
- **Mobile-first design**: Optimized for kitchen use
- **Touch gesture controls**: Swipe and pull-to-refresh support
- **Responsive layout**: Works on phones, tablets, and desktops
- **Intuitive navigation**: Clean and minimal UI
- **Feedback system**: Send feedback to improve the app

### 🔧 **Technical Highlights**
- **Real-time session tracking**: Analytics on cooking patterns
- **Server-side rendering**: Fast page loads with Next.js
- **Database persistence**: Supabase PostgreSQL for reliable data storage
- **Secure authentication**: Clerk-powered user authentication
- **OpenAI integration**: Text-to-speech for natural voice guidance

## 🏗️ **Technical Stack**

### **Frontend**
- **Next.js 16.1.1** - React framework with App Router and Turbopack
- **React 19.2.3** - Latest React with concurrent features
- **TailwindCSS 4.1.13** - Utility-first CSS styling
- **TanStack React Query 5.90.2** - Server state management and caching
- **Zustand** - Lightweight client state management
- **Lucide React** - Beautiful icon components
- **OpenAI TTS** - Natural voice synthesis

### **Backend & Services**
- **Supabase** - PostgreSQL database with real-time capabilities
- **Clerk** - Authentication and user management (v6.36.6)
- **Resend** - Email sending for feedback messages
- **Web Speech API** - Browser native speech recognition

### **Key Libraries**
- **React Query** - Intelligent caching and background refetching
- **Zustand with persist** - State persistence to localStorage
- **Sonner** - Toast notifications
- **Custom hooks** - Voice recognition, cooking sessions, touch gestures

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18.18+ or higher
- npm or yarn package manager
- Supabase account with database setup
- Clerk account for authentication
- OpenAI API key for text-to-speech
- Resend API key for feedback emails (optional)

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/cooking-assistant.git
cd cooking-assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
Create a `.env.local` file in the project root:
```bash
cp .env.local.example .env.local
```

4. **Configure environment variables**
Edit `.env.local` with your actual API keys:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

# OpenAI (for text-to-speech)
OPENAI_API_KEY=sk-your_openai_key

# Resend (for feedback emails)
RESEND_API_KEY=re_your_resend_key
```

5. **Database setup**
Run the database schema in your Supabase SQL editor:
```bash
# File: database-schema-fixes.sql
```

6. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📱 **Features in Action**

### **Cooking Mode**
- Enter interactive cooking with voice guidance
- Navigate steps with voice commands or buttons
- View ingredients with automatic scaling
- Track progress with step completion
- Set timers with voice control

### **Voice Commands**
```
"Next step"       → Move to next cooking instruction
"Previous"        → Go back to previous step
"Repeat"          → Re-read current instruction
"Ingredients"     → List all recipe ingredients
"Timer 10"        → Set a 10-minute timer
"Complete step"   → Mark current step as done
"Pause"/"Stop"    → Pause voice playback
```

### **Recipe Management**
- Search recipes by name or browse
- Save favorites for quick access
- View recipe details (prep time, servings, difficulty)
- Scale ingredients to desired servings
- Track cooking history

## 📊 **Analytics & Session Tracking**

- **Cooking Sessions**: Records cooking start time, end time, and completion status
- **Feature Tracking**: Monitors usage of voice commands, timers, and scaling
- **User Analytics**: Dashboard shows cooking patterns and preferences
- **Achievement System**: Unlock achievements as you use the app

## 🎨 **Design Features**

- **Minimal & Clean**: No glossy effects or excessive decorations
- **Mobile-First**: Optimized for kitchen use on phones
- **Interactive**: Smooth hover effects and transitions
- **Accessible**: Clear typography and readable layouts
- **Responsive**: Works great on all screen sizes

## 📄 **License**

MIT License - Feel free to use this project for personal or commercial purposes.

## 👨‍💻 **Built By**

**Kapil Dagar** - Full-stack developer passionate about cooking and technology

## 📞 **Contact & Feedback**

- **Email**: harshitdagar913@gmail.com
- **GitHub**: [View Repository](https://github.com)
- **In-App Feedback**: Use the feedback form in the footer to send suggestions

---

<div align="center">

### 🍳 **Happy Cooking with AI Guidance!**

Made with ❤️ for home cooks everywhere

[⬆ Back to top](#-cookai---voice-powered-cooking-assistant)

</div>
