"use client"
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography, Button, Divider } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import LogoutIcon from "@mui/icons-material/Logout"
import { useAuth } from "./auth-provider"
import useSWR from "swr"

const DRAWER_WIDTH = 280

interface Thread {
  id: string
  title: string
  updatedAt: string
}

interface SidebarProps {
  currentThreadId: string | null
  onThreadSelect: (threadId: string) => void
}

export function Sidebar({ currentThreadId, onThreadSelect }: SidebarProps) {
  const { user, logout } = useAuth()
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

  const { data, mutate } = useSWR<{ threads: Thread[] }>(`${API_URL}/threads`, fetcher, { refreshInterval: 5000 })

  const handleNewThread = async () => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: "New Research" }),
    })

    if (response.ok) {
      const newThread = await response.json()
      mutate()
      onThreadSelect(newThread.id)
    }
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap>
          Finance Research
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleNewThread}>
          New Research
        </Button>
      </Box>

      <Divider />

      <List sx={{ flex: 1, overflow: "auto" }}>
        {data?.threads.map((thread) => (
          <ListItem key={thread.id} disablePadding>
            <ListItemButton selected={thread.id === currentThreadId} onClick={() => onThreadSelect(thread.id)}>
              <ListItemText
                primary={thread.title}
                secondary={new Date(thread.updatedAt).toLocaleDateString()}
                primaryTypographyProps={{
                  noWrap: true,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="outlined" startIcon={<LogoutIcon />} onClick={logout}>
          Logout
        </Button>
      </Box>
    </Drawer>
  )
}
