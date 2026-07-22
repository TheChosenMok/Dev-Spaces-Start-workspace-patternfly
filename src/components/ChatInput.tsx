import { useState, useRef, useEffect } from 'react'
import { Button } from '@patternfly/react-core'
import { PaperPlaneIcon, StopCircleIcon } from '@patternfly/react-icons'

interface ChatInputProps {
  onSend: (content: string) => void
  isStreaming: boolean
  onStop?: () => void
}

export function ChatInput({ onSend, isStreaming, onStop }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 150) + 'px'
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div style={{
      padding: '8px 16px 10px',
      borderTop: '1px solid var(--pf-t--global--border--color--default)',
      background: 'var(--pf-t--global--background--color--primary--default)',
    }}>
      <div style={{
        position: 'relative',
        border: focused
          ? '1px solid var(--pf-t--global--color--brand--default)'
          : '1px solid var(--pf-t--global--border--color--default)',
        borderRadius: 6,
        background: 'var(--pf-t--global--background--color--secondary--default)',
        transition: 'border-color 0.15s',
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isStreaming ? 'Generating...' : 'Ask anything... (Enter to send)'}
          disabled={isStreaming}
          rows={1}
          style={{
            width: '100%',
            resize: 'none',
            border: 'none',
            borderRadius: 6,
            padding: '10px 40px 10px 12px',
            fontSize: 13,
            fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            lineHeight: 1.5,
            background: 'transparent',
            color: 'var(--pf-t--global--text--color--regular)',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: isStreaming ? 0.5 : 1,
          }}
        />
        {isStreaming ? (
          onStop && (
            <Button
              variant="plain"
              onClick={onStop}
              style={{
                position: 'absolute',
                right: 4,
                bottom: 4,
                padding: 4,
                color: 'var(--pf-t--global--icon--color--status--danger--default)',
              }}
              icon={<StopCircleIcon />}
            />
          )
        ) : (
          <Button
            variant="plain"
            onClick={handleSend}
            isDisabled={!value.trim()}
            style={{
              position: 'absolute',
              right: 4,
              bottom: 4,
              padding: 4,
              color: value.trim()
                ? 'var(--pf-t--global--color--brand--default)'
                : 'var(--pf-t--global--text--color--subtle)',
            }}
            icon={<PaperPlaneIcon />}
          />
        )}
      </div>
    </div>
  )
}
