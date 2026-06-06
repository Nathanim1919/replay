"use client"

import { ThemeProvider } from "@/context/ThemeContext"
import Header from "@/components/landing/Header"
import Hero from "@/components/landing/Hero"
import HowItWorks from "@/components/landing/HowItWorks"
import Features from "@/components/landing/Features"
import Footer from "@/components/landing/Footer"

export default function LandingPage() {

  return (
    <ThemeProvider>
        <div className="min-h-screen font-manrope">
        <div className="overflow-hidden border-b pb-10 flex flex-col gap-4 min-h-screen bg-cover bg-center bg-no-repeat" style={{ borderColor: "var(--border)", backgroundImage: "radial-gradient(ellipse at top left, var(--hero-overlay) 0%, transparent 70%), linear-gradient(var(--hero-overlay-base), var(--hero-overlay-base)), url('/hero-bg.jpeg')" }}>
            <Header />
            <Hero />
          </div>
          <HowItWorks />
          <Features />
          <Footer />
        </div>
    </ThemeProvider>
  )
}
