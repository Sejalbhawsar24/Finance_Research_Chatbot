"use client"

import { Box, Paper, Typography, Chip } from "@mui/material"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: string
  content: string
  metadata?: any
  createdAt: string
}

interface MessageListProps {
  messages: Message[]
  streamingMessage?: string
  thinkingTrace?: any[]
  streaming?: boolean
}

export function MessageList({ messages, streamingMessage, thinkingTrace, streaming }: MessageListProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {streaming && thinkingTrace && thinkingTrace.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: "info.light" }}>
          <Typography variant="caption" color="text.secondary">
            Thinking...
          </Typography>
          {thinkingTrace.map((trace, i) => (
            <Box key={i} sx={{ mt: 1 }}>
              <Chip label={trace.step} size="small" />
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {typeof trace.content === "string" ? trace.content : JSON.stringify(trace.content, null, 2)}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {streamingMessage && (
        <Paper sx={{ p: 2, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="primary">
            Assistant
          </Typography>
          <ReactMarkdown>{streamingMessage}</ReactMarkdown>
        </Paper>
      )}
    </Box>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "USER"

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: isUser ? "primary.light" : "background.paper",
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {isUser ? "You" : "Assistant"}
      </Typography>
      <Box sx={{ mt: 1 }}>
        {isUser ? <Typography>{message.content}</Typography> : <ReactMarkdown>{message.content}</ReactMarkdown>}
      </Box>
    </Paper>
  )
}
