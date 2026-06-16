"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Player from "@/components/Player"
import BackgroundImage from "../../../../public/terminalBg.jpeg"

// 1. Move PageLayout OUTSIDE of the main component render loop
const PageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed min-h-screen w-screen flex items-center justify-center overflow-hidden">
    {/* Background Image */}
    <Image
      src={BackgroundImage}
      alt="Background"
      fill
      priority
      placeholder="blur"
      className="object-cover  brightness-50" 
    />
    {children}
  </div>
)

export default function SessionPage() {
  const { shortcode } = useParams<{ shortcode: string }>()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortcode) return
    
    fetch(`/api/recordings/${shortcode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Session not found")
        return res.text()
      })
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [shortcode])

  if (error) {
    return (
      <PageLayout>
        <div className="bg-black/80 backdrop-blur-md border border-red-500/30 text-red-400 px-6 py-4 rounded-lg shadow-2xl font-mono">
          {error}
        </div>
      </PageLayout>
    )
  }

  if (!content) {
    return (
      <PageLayout>
        <div className="bg-black/60  backdrop-blur-md text-zinc-400 px-6 py-4 rounded-lg shadow-xl font-mono flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          Loading session...
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Container simulating Apple's floating window look */}
      <div className=" relative w-full max-w-200 aspect-square overflow-hidden grid place-items-center">
        <Player content={content} />
      </div>
    </PageLayout>
  )
}