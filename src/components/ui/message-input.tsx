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
    <div className={cn("relative flex w-full items-end gap-2", className)}>
      <textarea
        aria-label="Write your message"
        placeholder={placeholder}
        ref={textAreaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        rows={1}
        className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        style={{ minHeight: "44px", maxHeight: "200px" }}
      />
      <div className="flex items-center gap-1">
        {isGenerating && stop ? (
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label="Stop generating"
            onClick={stop}
          >
            <Square className="h-3.5 w-3.5 animate-pulse" fill="currentColor" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 rounded-full"
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
