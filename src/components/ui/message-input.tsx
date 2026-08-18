"use client"

import React, { useRef, useState } from "react"
import { ArrowUp, Square } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAutosizeTextArea } from "@/components/ui/hooks/use-autosize-textarea"
import { Button } from "@/components/ui/button"

interface MessageInputProps {
  value: string
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>
  placeholder?: string
  submitOnEnter?: boolean
  stop?: () => void
  isGenerating: boolean
  className?: string
}

export function MessageInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "Type a message...",
  submitOnEnter = true,
  stop,
  isGenerating,
  className,
}: MessageInputProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useAutosizeTextArea({
    ref: textAreaRef,
    maxHeight: 200,
    borderWidth: 1,
    dependencies: [value],
  })

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitOnEnter && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
    onKeyDown?.(event)
  }

  return (
    <div className={cn("relative flex w-full items-end gap-2 bg-white rounded-[20px] shadow-sm border border-gray-100 p-1.5 focus-within:border-gray-300 transition-colors", className)}>
      <textarea
        aria-label="Write your message"
        placeholder={placeholder}
        ref={textAreaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        rows={1}
        className="w-full resize-none bg-transparent px-3 py-2 text-[14px] outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400 font-sans"
        style={{ minHeight: "36px", maxHeight: "120px" }}
      />
      <div className="flex items-center gap-1 pb-0.5">
        {isGenerating && stop ? (
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0"
            style={{ background: 'var(--widget-accent, #111)', color: '#fff' }}
            aria-label="Stop generating"
            onClick={stop}
          >
            <Square className="h-4 w-4 animate-pulse" fill="currentColor" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className={cn("h-9 w-9 rounded-full shrink-0 transition-opacity", !value.trim() || isGenerating ? "opacity-50" : "opacity-100")}
            style={{ background: 'var(--widget-accent, #111)', color: '#fff' }}
            aria-label="Send message"
            disabled={!value.trim() || isGenerating}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

MessageInput.displayName = "MessageInput"
