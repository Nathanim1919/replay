"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <ThemeProvider>
      <div className="font-manrope">
        <div className={`overflow-hidden flex flex-col min-h-screen bg-cover bg-center bg-no-repeat`} 
       >
          {" "}
          <Header />
          <Hero />
        </div>
        <HowItWorks />
        <Features />
        <Footer />
      </div>
    </ThemeProvider>
  );
}
