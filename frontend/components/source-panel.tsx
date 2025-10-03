"use client"

import { Box, Paper, Typography, List, ListItem, Link, Divider } from "@mui/material"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"
import useSWR from "swr"

interface Source {
  id: string
  url: string
  title?: string
  snippet?: string
  accessedAt: string
}

interface SourcePanelProps {
  threadId: string | null
}

export function SourcePanel({ threadId }: SourcePanelProps) {
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

  const { data: thread } = useSWR(threadId ? `${API_URL}/threads/${threadId}` : null, fetcher)

  const sources: Source[] = thread?.sources || []

  return (
    <Paper
      sx={{
        width: 320,
        height: "100vh",
        overflow: "auto",
        borderLeft: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ p: 2, position: "sticky", top: 0, bgcolor: "background.paper", zIndex: 1 }}>
        <Typography variant="h6">Sources ({sources.length})</Typography>
        <Typography variant="caption" color="text.secondary">
          Research citations
        </Typography>
      </Box>

      <Divider />

      <List>
        {sources.map((source, index) => (
          <ListItem
            key={source.id}
            sx={{
              flexDirection: "column",
              alignItems: "flex-start",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: "100%", mb: 1 }}>
              <Typography variant="caption" color="primary" sx={{ mr: 1 }}>
                [{index + 1}]
              </Typography>
              <Link
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ flex: 1, display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <Typography variant="body2" noWrap>
                  {source.title || source.url}
                </Typography>
                <OpenInNewIcon fontSize="small" />
              </Link>
            </Box>
            {source.snippet && (
              <Typography variant="caption" color="text.secondary">
                {source.snippet.slice(0, 150)}...
              </Typography>
            )}
          </ListItem>
        ))}
      </List>

      {sources.length === 0 && (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No sources yet. Start a research query to see citations.
          </Typography>
        </Box>
      )}
    </Paper>
  )
}
