// server/index.js — Express backend for Momentum AI chat
// Completed: May 20, 2026
//
// This is a lightweight Node.js server with one job: act as a secure proxy
// between the React frontend and the Google Gemini API. The API key never
// touches the browser — it only lives here in the server environment.
//
// Why a separate server at all? If we called Gemini directly from the React app,
// the API key would be visible in the browser's network tab and bundled into the
// JS file anyone can download. This way the key stays private.
//
// To run alongside the Vite dev server: npm run dev:all
// In production: deploy this to Railway, Render, or Fly.io with GEMINI_API_KEY set.

import 'dotenv/config'   // Loads .env file into process.env automatically
import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
app.use(express.json())
app.use(cors())  // Allow requests from the Vite dev server (localhost:5173)

// Initialize the Gemini client once at startup — no need to recreate it per request.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// This is the AI's personality and instruction set. It gets injected into every
// conversation as the system prompt, along with the user's live goal data.
// Keeping it here on the server means we can update the AI's behavior without
// pushing a frontend build.
const SYSTEM_PROMPT = `You are Momentum AI, a personal coach built into the Momentum goal-tracking app.

You have two roles:
1. GOAL COACH — You have full context of the user's current goals, today's completions, and their streak. Give specific, actionable advice based on their real data when relevant.
2. RESEARCH & PLANNING ASSISTANT — Help with research, project planning, breaking down complex tasks, habit science, productivity techniques, or any question the user asks.

Guidelines:
- Keep responses concise. 2–4 sentences for simple questions, up to 8 for complex ones.
- Use short paragraphs. No unnecessary filler or repeated affirmations.
- When referencing the user's goals, be specific (use their actual goal titles).
- If asked to suggest new goals, make them concrete and trackable.`

// Diagnostic endpoint — hit http://localhost:3001/api/models to see which
// Gemini models your API key has access to. Useful when debugging 404 errors
// from model names that aren't available on the free tier.
app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    )
    const data = await response.json()
    const names = (data.models || []).map(m => m.name)
    res.json(names)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Main chat endpoint — receives the full conversation history plus a context
// string describing the user's current goals and streak, then streams the
// Gemini response back to the browser using Server-Sent Events (SSE).
//
// SSE is used instead of a regular JSON response because it lets us stream
// tokens as they arrive, so the text appears word-by-word rather than making
// the user wait for the full response before anything shows up.
app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' })
  }

  // Append the user's live goal data to the system prompt so the AI can give
  // personalized advice. Context is rebuilt on every message so it always
  // reflects the current state of the user's goals.
  const systemInstruction = context
    ? `${SYSTEM_PROMPT}\n\nUser's current data:\n${context}`
    : SYSTEM_PROMPT

  // Gemini uses the role name 'model' for AI turns, while our frontend stores
  // them as 'assistant' to match the OpenAI/Anthropic convention. Convert here.
  // The last message is sent separately via sendMessageStream, not in the history array.
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  const lastMessage = messages[messages.length - 1].content

  // Set SSE headers so the browser knows to treat this as a stream
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    // gemini-2.5-flash is the latest and most capable model available on
    // this free API key. Confirmed via /api/models on May 20, 2026.
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
    })

    const chat = model.startChat({ history })
    const result = await chat.sendMessageStream(lastMessage)

    // Write each text chunk as an SSE event as it arrives from Gemini.
    // The frontend reads these one by one and appends them to the message bubble.
    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`)
    }

    // Signal to the frontend that the stream is finished
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    // Forward Gemini errors to the frontend so they show up in the chat UI
    // rather than silently failing
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on :${PORT}`))
