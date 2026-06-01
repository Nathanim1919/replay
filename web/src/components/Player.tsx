"use client"

import { parseReplay, ReplaySession } from "@/lib/replay-parser"
import { useEffect, useRef, useState } from "react"
import Terminal, { TerminalHandle } from "./Terminal"

export const Player = () => {

    const [session, setSession] = useState<ReplaySession | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speed, setSpeed] = useState(1.0)


    const terminalRef = useRef<TerminalHandle>(null)
    const anchorWallRef = useRef<number>(0)
    const eventIndexRef = useRef<number>(0)
    const rafIdRef= useRef<number>(0)

    useEffect(()=>{
        fetch("/test.replay")
        .then(res=>res.text())
        .then(text=> {
            const session = parseReplay(text)
            setSession(session)
        })
    },[])



    useEffect(()=>{
        if(!session) return

        // anchor the wall clock
        anchorWallRef.current = Date.now()
        eventIndexRef.current = 0

        // start the loop
        function tick(){
            const wallElapsed = Date.now() - anchorWallRef.current
            const replayTime = wallElapsed / 1000

            // Flush events upto replayTime
            while (eventIndexRef.current < (session?.events?.length ?? 0) && session?.events?.[eventIndexRef.current]?.time <= replayTime){
                const event = session?.events[eventIndexRef.current]
                if (event?.type === "o" && event?.data ){
                    terminalRef.current?.write(event.data)
                }
                eventIndexRef.current++
            }

            // Check if done
            if (eventIndexRef.current >= (session?.events?.length ?? 0)){
                return;
            }

            // Schedule next tick
            rafIdRef.current = requestAnimationFrame(tick)
        }

        // Kick off the first frame
        rafIdRef.current = requestAnimationFrame(tick)

        // Clean on unmount
        return ()=>{
            cancelAnimationFrame(rafIdRef.current)
        }
        
    },[session])

    if (!session) return <div>Loading...</div> 

    return (                                
        <div>                             
          <Terminal
            ref={terminalRef}                                                                                                                                  
            width={session.header.width}
            height={session.header.height}                                                                                                                 
          />                                                                                                                                             
        </div>
      )
}


export default Player