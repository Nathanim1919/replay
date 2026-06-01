"use client"

import {useRef, useEffect, useImperativeHandle, forwardRef} from "react"
import {Terminal as XTerm} from "@xterm/xterm"
import {FitAddon} from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

interface TerminalHandle {
    write: (data: string) => void
    reset: () => void
}


interface TerminalProps {
    width: number
    height: number
}

const Terminal = forwardRef<TerminalHandle, TerminalProps>(({width, height}, ref) => {
    const divRef = useRef<HTMLDivElement>(null) // the DOM element that will contain the terminal
    const termRef = useRef<XTerm | null>(null) // the XTerm instance


    useEffect(()=>{
        // Create the terminal
        const term = new XTerm({
            cols: width,
            rows: height,
            cursorBlink: false,
            scrollback: 1000,
        })
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(divRef.current as HTMLElement)
        fitAddon.fit()

        termRef.current = term

        return ()=>{
            term.dispose()
        }
    },[])


    useImperativeHandle(ref, () => ({
        write: (data: string) => termRef.current?.write(data),
        reset: () => termRef.current?.reset(),
    }))


    return <div ref={divRef} style={{ width: "100%", height: "100%" }} />
})

export default Terminal
export type { TerminalHandle }