import React, { useState } from 'react'
import { AngleRightIcon, AngleDownIcon, CheckCircleIcon } from '@patternfly/react-icons'
import type { ChatMessage as ChatMessageType, ToolCall } from './agentSpaceV2Types'

interface ChatMessageProps {
  message: ChatMessageType
}

function renderMarkdown(text: string) {
  const blocks: { type: string; content: string }[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: 'code', content: (lang ? lang + '\n' : '') + codeLines.join('\n') })
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.slice(3) })
      i++
      continue
    }

    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', content: line.slice(2) })
      i++
      continue
    }

    if (line.trim() === '') {
      i++
      continue
    }

    blocks.push({ type: 'text', content: line })
    i++
  }

  return blocks.map((block, idx) => {
    if (block.type === 'code') {
      const parts = block.content.split('\n')
      const hasLang = parts[0] && !parts[0].includes(' ') && parts[0].length < 20
      const lang = hasLang ? parts[0] : ''
      const code = hasLang ? parts.slice(1).join('\n') : block.content
      return (
        <div key={idx} style={{
          borderRadius: 4,
          overflow: 'hidden',
          margin: '8px 0',
          border: '1px solid var(--pf-t--global--border--color--default)',
        }}>
          {lang && (
            <div style={{
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'monospace',
              color: 'var(--pf-t--global--text--color--subtle)',
              background: 'rgba(127,127,127,0.08)',
              borderBottom: '1px solid var(--pf-t--global--border--color--default)',
            }}>{lang}</div>
          )}
          <pre style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '10px 12px',
            overflow: 'auto',
            fontSize: 12,
            fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.5,
          }}>
            <code>{code}</code>
          </pre>
        </div>
      )
    }

    if (block.type === 'h1') {
      return <div key={idx} style={{ fontWeight: 700, fontSize: 15, margin: '10px 0 4px' }}>{renderInline(block.content)}</div>
    }

    if (block.type === 'h2') {
      return <div key={idx} style={{ fontWeight: 600, fontSize: 14, margin: '8px 0 4px' }}>{renderInline(block.content)}</div>
    }

    if (block.content.startsWith('- ')) {
      return (
        <div key={idx} style={{ display: 'flex', gap: 6, margin: '2px 0', paddingLeft: 4 }}>
          <span style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>-</span>
          <span>{renderInline(block.content.slice(2))}</span>
        </div>
      )
    }

    return <div key={idx} style={{ margin: '3px 0', lineHeight: 1.6 }}>{renderInline(block.content)}</div>
  })
}

function renderInline(text: string) {
  const parts: (string | React.ReactElement)[] = []
  const regex = /(\*\*.*?\*\*)|(`[^`]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1]) {
      parts.push(<strong key={match.index}>{match[1].slice(2, -2)}</strong>)
    } else if (match[2]) {
      parts.push(
        <code key={match.index} style={{
          background: 'rgba(127,127,127,0.15)',
          padding: '1px 5px',
          borderRadius: 3,
          fontSize: '0.85em',
          fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        }}>{match[2].slice(1, -1)}</code>
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <button
      onClick={() => setExpanded(e => !e)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        width: '100%',
        padding: '4px 0',
        border: 'none',
        background: 'none',
        color: 'var(--pf-t--global--text--color--subtle)',
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        margin: '2px 0 6px',
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        {expanded ? <AngleDownIcon style={{ fontSize: 11 }} /> : <AngleRightIcon style={{ fontSize: 11 }} />}
      </span>
      <span>
        <span style={{ fontWeight: 600, fontStyle: 'italic' }}>Thinking...</span>
        {expanded && (
          <div style={{
            marginTop: 4,
            fontSize: 12,
            lineHeight: 1.5,
            fontStyle: 'italic',
            whiteSpace: 'pre-wrap',
            fontWeight: 400,
          }}>
            {thinking}
          </div>
        )}
      </span>
    </button>
  )
}

function ToolCallBlock({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ margin: '2px 0' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '3px 0',
          border: 'none',
          background: 'none',
          color: 'var(--pf-t--global--text--color--regular)',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          textAlign: 'left',
        }}
      >
        <CheckCircleIcon style={{ fontSize: 12, color: 'var(--pf-t--global--icon--color--status--success--default)', flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>{toolCall.name}</span>
        <span style={{
          color: 'var(--pf-t--global--text--color--subtle)',
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {toolCall.input}
        </span>
        <span style={{ flexShrink: 0, fontSize: 10, color: 'var(--pf-t--global--text--color--subtle)' }}>
          {expanded ? <AngleDownIcon /> : <AngleRightIcon />}
        </span>
      </button>
      {expanded && (
        <div style={{
          marginLeft: 18,
          padding: '4px 0',
          fontSize: 12,
          fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          lineHeight: 1.5,
        }}>
          <div style={{ color: 'var(--pf-t--global--text--color--subtle)', marginBottom: 2, fontSize: 11, fontWeight: 600 }}>Input</div>
          <pre style={{
            background: '#1e1e1e', color: '#d4d4d4', padding: '6px 10px',
            borderRadius: 4, fontSize: 11, margin: '0 0 6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{toolCall.input}</pre>
          {toolCall.output && (
            <>
              <div style={{ color: 'var(--pf-t--global--text--color--subtle)', marginBottom: 2, fontSize: 11, fontWeight: 600 }}>Output</div>
              <pre style={{
                background: '#1e1e1e', color: '#d4d4d4', padding: '6px 10px',
                borderRadius: 4, fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 200, overflow: 'auto',
              }}>{toolCall.output}</pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      padding: isUser ? '10px 20px' : '12px 20px',
      borderBottom: '1px solid var(--pf-t--global--border--color--default)',
      background: 'transparent',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: isUser ? 4 : 8,
      }}>
        <span style={{
          width: 18,
          height: 18,
          borderRadius: isUser ? '50%' : 4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 700,
          background: isUser
            ? 'var(--pf-t--global--color--brand--default)'
            : 'var(--pf-t--global--background--color--action--plain--clicked)',
          color: isUser ? '#fff' : 'var(--pf-t--global--text--color--regular)',
          flexShrink: 0,
        }}>
          {isUser ? 'U' : 'AI'}
        </span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--pf-t--global--text--color--subtle)',
        }}>
          {isUser ? 'You' : 'Assistant'}
        </span>
      </div>
      <div style={{
        paddingLeft: 24,
        fontSize: 13,
        lineHeight: 1.6,
        color: 'var(--pf-t--global--text--color--regular)',
        wordBreak: 'break-word',
      }}>
        {!isUser && message.thinking && <ThinkingBlock thinking={message.thinking} />}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ margin: '0 0 10px' }}>
            {message.toolCalls.map(tc => <ToolCallBlock key={tc.id} toolCall={tc} />)}
          </div>
        )}
        {isUser ? message.content : renderMarkdown(message.content)}
        {message.isStreaming && (
          <>
            <style>{`
              @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
              @keyframes pulse-dot { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
            `}</style>
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 14,
              background: 'var(--pf-t--global--color--brand--default)',
              animation: 'cursor-blink 1s step-end infinite',
              marginLeft: 1,
              verticalAlign: 'text-bottom',
              borderRadius: 1,
            }} />
          </>
        )}
      </div>
    </div>
  )
}
