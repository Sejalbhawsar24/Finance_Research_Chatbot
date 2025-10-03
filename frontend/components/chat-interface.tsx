"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  AppBar,
  Toolbar,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import VisibilityIcon from "@mui/icons-material/Visibility"
import DownloadIcon from "@mui/icons-material/Download"
import { MessageList } from "./message-list"
import { useAuth } from "./auth-provider"
import { io, type Socket } from "socket.io-client"
import useSWR from "swr"

interface Message {
  id: string
  role: string
  content: string
  metadata?: any
  createdAt: string
}

interface ChatInterfaceProps {
  threadId: string | null
  onThreadCreated: (threadId: string) => void
  onToggleSources: () => void
}

export function ChatInterface({ threadId, onThreadCreated, onToggleSources }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [input, setInput] = useState("")
  const [showThinking, setShowThinking] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [thinkingTrace, setThinkingTrace] = useState<any[]>([])
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null)
  const socketRef = useRef<Socket | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const fetcher = async (url: string) => {
    const token = localStorage.getItem("token")
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error("Failed to fetch")
    return response.json()
  }

  const { data: thread, mutate } = useSWR(threadId ? `${API_URL}/threads/${threadId}` : null, fetcher)

  useEffect(() => {
    // Initialize WebSocket
    socketRef.current = io(API_URL || "http://localhost:3001")

    socketRef.current.on("research_event", (event: any) => {
      if (event.type === "thinking") {
        setThinkingTrace((prev) => [...prev, event.content])
      } else if (event.type === "answer") {
        setStreamingMessage((prev) => prev + event.content)
      } else if (event.type === "done") {
        setStreaming(false)
        setStreamingMessage("")
        setThinkingTrace([])
        mutate()
      }
    })

    socketRef.current.on("research_error", (error: any) => {
      console.error("Research error:", error)
      setStreaming(false)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [API_URL, mutate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || streaming) return

    let activeThreadId = threadId

    // Create new thread if none exists
    if (!activeThreadId) {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: input.slice(0, 50) }),
      })

      if (response.ok) {
        const newThread = await response.json()
        activeThreadId = newThread.id
        onThreadCreated(activeThreadId)
      }
    }

    // Start streaming research
    setStreaming(true)
    setStreamingMessage("")
    setThinkingTrace([])

    socketRef.current?.emit("research", {
      query: input,
      threadId: activeThreadId,
      userId: user?.id,
      showThinking,
    })

    setInput("")
  }

  const handleExport = async (format: "markdown" | "html") => {
    if (!threadId || !thread) return

    try {
      const token = localStorage.getItem("token")

      // Generate report content
      const reportContent = generateReport(thread, format)

      // Save report to backend
      const response = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId,
          title: thread.title,
          content: reportContent,
          format: format.toUpperCase(),
          citations: thread.sources.map((s: any, i: number) => ({
            index: i + 1,
            url: s.url,
            title: s.title,
          })),
        }),
      })

      if (response.ok) {
        const report = await response.json()

        // Download report
        const blob = new Blob([reportContent], {
          type: format === "html" ? "text/html" : "text/markdown",
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${thread.title.replace(/[^a-z0-9]/gi, "_")}.${format === "html" ? "html" : "md"}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export failed:", error)
    }

    setExportAnchor(null)
  }

  const generateReport = (thread: any, format: "markdown" | "html") => {
    const messages = thread.messages.filter((m: any) => m.role === "ASSISTANT")
    const sources = thread.sources || []

    if (format === "markdown") {
      let report = `# ${thread.title}\n\n`
      report += `*Generated on ${new Date().toLocaleDateString()}*\n\n`
      report += `## Research Summary\n\n`

      messages.forEach((msg: any) => {
        report += `${msg.content}\n\n`
      })

      report += `## Sources\n\n`
      sources.forEach((source: any, i: number) => {
        report += `[${i + 1}] ${source.title || source.url}\n`
        report += `   ${source.url}\n`
        if (source.snippet) {
          report += `   ${source.snippet}\n`
        }
        report += `\n`
      })

      return report
    } else {
      // HTML format
      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${thread.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .meta { color: #666; font-style: italic; }
    .source { margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #007bff; }
    .source-title { font-weight: bold; }
    .source-url { color: #007bff; text-decoration: none; }
  </style>
</head>
<body>
  <h1>${thread.title}</h1>
  <p class="meta">Generated on ${new Date().toLocaleDateString()}</p>
  
  <h2>Research Summary</h2>
`

      messages.forEach((msg: any) => {
        html += `<div>${msg.content.replace(/\n/g, "<br>")}</div>`
      })

      html += `<h2>Sources</h2>`

      sources.forEach((source: any, i: number) => {
        html += `
  <div class="source">
    <div class="source-title">[${i + 1}] ${source.title || "Untitled"}</div>
    <a href="${source.url}" class="source-url" target="_blank">${source.url}</a>
    ${source.snippet ? `<p>${source.snippet}</p>` : ""}
  </div>
`
      })

      html += `
</body>
</html>`

      return html
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {thread?.title || "New Research"}
          </Typography>
          <FormControlLabel
            control={<Switch checked={showThinking} onChange={(e) => setShowThinking(e.target.checked)} />}
            label="Show Thinking"
          />
          {threadId && (
            <>
              <Button startIcon={<DownloadIcon />} onClick={(e) => setExportAnchor(e.currentTarget)} sx={{ ml: 1 }}>
                Export
              </Button>
              <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                <MenuItem onClick={() => handleExport("markdown")}>Export as Markdown</MenuItem>
                <MenuItem onClick={() => handleExport("html")}>Export as HTML</MenuItem>
              </Menu>
            </>
          )}
          <IconButton onClick={onToggleSources}>
            <VisibilityIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        <MessageList
          messages={thread?.messages || []}
          streamingMessage={streamingMessage}
          thinkingTrace={showThinking ? thinkingTrace : []}
          streaming={streaming}
        />
      </Box>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          display: "flex",
          gap: 1,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <TextField
          fullWidth
          placeholder="Ask a financial research question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          multiline
          maxRows={4}
        />
        <IconButton type="submit" color="primary" disabled={!input.trim() || streaming}>
          {streaming ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Paper>
    </Box>
  )
}
