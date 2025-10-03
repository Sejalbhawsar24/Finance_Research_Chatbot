"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Box } from "@mui/material"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { SourcePanel } from "@/components/source-panel"

export default function ChatPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [showSources, setShowSources] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return null
  }

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar currentThreadId={currentThreadId} onThreadSelect={setCurrentThreadId} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ChatInterface
          threadId={currentThreadId}
          onThreadCreated={setCurrentThreadId}
          onToggleSources={() => setShowSources(!showSources)}
        />
      </Box>
      {showSources && <SourcePanel threadId={currentThreadId} />}
    </Box>
  )
}
