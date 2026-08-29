"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import ProductShowcase from "@/components/landing/ProductShowcase";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/context/AuthContext";
import RecordingList from "@/components/RecordingList";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <ThemeProvider>
      <div className="font-manrope">
        <div
          className={`overflow-hidden flex flex-col min-h-screen bg-cover bg-center bg-no-repeat`}
        >
          <Header />
          <Hero />
        </div>
        {user ? (
          <RecordingList />
        ) : (
          <>
            <Features />
          </>
        )}
        <HowItWorks />
        <ProductShowcase />
        <Footer />
      </div>
    </ThemeProvider>
  );
}

