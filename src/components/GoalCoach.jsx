// GoalCoach.jsx — Floating AI chat panel
// Completed: May 20, 2026
//
// This component renders the ⚡ button fixed to the bottom-right of every screen.
// Clicking it opens a chat panel where users can talk to Gemini AI about their goals
// or ask general research/planning questions.
//
// The AI isn't just a generic chatbot — every message it receives includes a snapshot
// of the user's current goals, today's completions, and their streak. That context
// is built fresh on each send so the AI always has accurate, up-to-date information.
//
// Streaming: responses arrive token-by-token via SSE (Server-Sent Events) so the
// text appears as it's generated rather than all at once after a delay.

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import { useGoals } from '../hooks/useGoals'

// Pre-written prompts shown when the chat is empty to help users get started.
// These were chosen to cover the two main use cases: goal coaching and general planning.
const QUICK_PROMPTS = [
  "How's my progress looking?",
  "Suggest some new goals for me",
  "Help me plan a project",
  "What habits build consistency?",
]

// Builds a plain-text snapshot of the user's current data to inject into the AI's
// system prompt. This is what lets the AI say things like "you've completed 3 of your
// 5 daily goals today" — it's reading directly from the user's localStorage data.
function buildContext(goals, completions, getDailyGoals, isCompletedOn, getStreak, today) {
  const daily = getDailyGoals()
  const weekly = goals.filter(g => g.type === 'weekly')
  const monthly = goals.filter(g => g.type === 'monthly')
  const yearly = goals.filter(g => g.type === 'yearly')
  const todayDone = daily.filter(g => isCompletedOn(g.id, today)).length

  const lines = [
    `Today: ${today}`,
    `Current streak: ${getStreak()} days`,
    `Daily goals (${todayDone}/${daily.length} done today):`,
    ...daily.map(g => `  - ${g.title} [${isCompletedOn(g.id, today) ? 'done' : 'not done'}]`),
  ]
  if (weekly.length) lines.push(`Weekly goals: ${weekly.map(g => g.title).join(', ')}`)
  if (monthly.length) lines.push(`Monthly goals: ${monthly.map(g => g.title).join(', ')}`)
  if (yearly.length) lines.push(`Yearly goals: ${yearly.map(g => g.title).join(', ')}`)

  return lines.join('\n')
}

export default function GoalCoach() {
  const { goals, completions, today, getDailyGoals, isCompletedOn, getStreak } = useGoals()

  // Panel open/closed state
  const [open, setOpen] = useState(false)

  // Full conversation history stored as { role: 'user' | 'assistant', content: string }[]
  // This gets sent to the server on every message so Gemini has full context.
  const [messages, setMessages] = useState([])

  const [input, setInput] = useState('')

  // streaming = true while waiting for the AI to finish its response
  const [streaming, setStreaming] = useState(false)

  // streamText holds the partial response as tokens arrive — shown as a live
  // preview bubble before it gets committed to the messages array
  const [streamText, setStreamText] = useState('')

  const [error, setError] = useState(null)

  // Used to auto-scroll the message list to the bottom as new content arrives
  const bottomRef = useRef(null)

  // Used to focus the input field whenever the panel opens
  const inputRef = useRef(null)

  // Scroll to the bottom every time a new message appears or stream text updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  // Auto-focus the input when the user opens the panel
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Sends a message to the server and reads the SSE stream back.
  // The user message is appended to the UI immediately (optimistic update),
  // then the AI response is built up character-by-character as chunks arrive.
  async function send(text) {
    if (!text.trim() || streaming) return
    setError(null)

    const userMsg = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)
    setStreamText('')

    try {
      // Rebuild context fresh on every send so if the user completed a goal
      // mid-conversation, the AI will know about it on the next message.
      const context = buildContext(goals, completions, getDailyGoals, isCompletedOn, getStreak, today)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      })

      if (!res.ok) throw new Error(`Server error ${res.status}`)

      // Read the SSE stream manually using the Streams API.
      // Each chunk may contain one or more "data: {...}" lines.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue

          // .trim() handles Windows \r\n line endings where data might be "[DONE]\r"
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            // Stream finished — commit the full response to the messages array
            setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
            setStreaming(false)
            setStreamText('')
            return
          }

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              // Surface Gemini errors (e.g. rate limit, bad key) in the chat UI
              // instead of silently failing. This was a bug in the original version
              // where the bare catch{} was swallowing these errors.
              setError(parsed.error)
              setStreaming(false)
              setStreamText('')
              return
            }
            accumulated += parsed.text
            setStreamText(accumulated)
          } catch {
            // Ignore malformed SSE lines — partial chunks or keep-alive pings
          }
        }
      }
    } catch (err) {
      setError(err.message)
      setStreaming(false)
      setStreamText('')
    }
  }

  // Submit on Enter, allow Shift+Enter for newlines in future multi-line input
  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  // While streaming, show the partial AI response as a temporary message bubble
  // so the user can see words appearing in real time. Once [DONE] arrives, this
  // gets replaced with the final committed message from the messages array.
  const displayMessages = streaming
    ? [...messages, { role: 'assistant', content: streamText, streaming: true }]
    : messages

  return (
    <>
      {/* Chat panel — only mounted when open to save memory */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          width: 380,
          height: 520,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 300,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Header bar with AI branding and close button */}
          <div style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 10,
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={15} color="var(--accent-light)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Momentum AI</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Goal coach & research</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Message list — scrollable, grows to fill available space */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {displayMessages.length === 0 ? (
              // Empty state — show quick prompt buttons to reduce blank-page paralysis
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, paddingLeft: 2 }}>
                  Try asking…
                </p>
                {QUICK_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : (
              // Chat bubbles — user messages align right (green), AI messages align left (dark)
              displayMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    // Asymmetric border radius gives the "tail" effect on chat bubbles
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'var(--accent-mid)' : 'var(--surface2)',
                    color: msg.role === 'user' ? 'white' : 'var(--text)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    // Fade in the "…" placeholder while the first tokens haven't arrived yet
                    opacity: msg.streaming && !msg.content ? 0.5 : 1,
                  }}>
                    {msg.content || (msg.streaming ? '…' : '')}
                  </div>
                </div>
              ))
            )}

            {/* Error messages — shown inline at the bottom of the chat */}
            {error && (
              <p style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'center', padding: '4px 0' }}>
                {error.includes('GEMINI_API_KEY') || error.includes('401')
                  ? 'API key missing or invalid. Check GEMINI_API_KEY in your .env file.'
                  : `Error: ${error}`}
              </p>
            )}

            {/* Invisible anchor element — scrolled into view whenever messages update */}
            <div ref={bottomRef} />
          </div>

          {/* Input bar — pinned to the bottom of the panel */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              disabled={streaming}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              style={{
                width: 38, height: 38,
                flexShrink: 0,
                background: input.trim() && !streaming ? 'var(--accent-mid)' : 'var(--surface2)',
                border: 'none',
                borderRadius: 10,
                color: input.trim() && !streaming ? 'white' : 'var(--text-muted)',
                cursor: input.trim() && !streaming ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Floating toggle button — green when closed, neutral when open */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open ? 'var(--surface2)' : 'var(--accent-mid)',
          border: `1px solid ${open ? 'var(--border)' : 'transparent'}`,
          color: open ? 'var(--text-muted)' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          // Green glow only when closed — draws the eye without being distracting
          boxShadow: open ? 'none' : '0 8px 24px rgba(64, 145, 108, 0.4)',
          transition: 'background 0.2s, box-shadow 0.2s, color 0.2s',
        }}
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
      </button>
    </>
  )
}
