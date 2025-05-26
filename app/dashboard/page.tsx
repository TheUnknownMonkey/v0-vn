"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ExtensionStatus } from "@/components/dashboard/extension-status"
import { UserProfile } from "@/components/dashboard/user-profile"
import { WorkspaceInfo } from "@/components/dashboard/workspace-info"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [debugMode, setDebugMode] = useState(false)

  // Add debugging logs
  useEffect(() => {
    console.log("Dashboard loaded at:", new Date().toISOString())
    console.log("Current URL:", window.location.href)
    console.log("Referrer:", document.referrer)
  }, [])

  // Client-side fetch of user data
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      console.log("Dashboard user:", user?.email)
    }

    fetchUserData()
  }, [])

  const sendManualAuth = async () => {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        console.log("No session found for manual auth")
        return
      }

      const user = session.user

      // Send a basic auth message
      const authMessage = {
        type: "VIBENOTE_AUTH",
        payload: {
          token: session.access_token,
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata || {},
          },
          workspace: {
            id: null, // We'll let the extension use what it has
            name: null,
          },
        },
      }

      console.log("Manually sending auth message:", authMessage)
      window.postMessage(authMessage, window.location.origin)
    } catch (error) {
      console.error("Error sending manual auth:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)}>
          {debugMode ? "Hide Debug" : "Debug Mode"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UserProfile />
        <ExtensionStatus />
      </div>

      <WorkspaceInfo />

      {debugMode && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Debug Tools</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={sendManualAuth}>
              Send Auth Manually
            </Button>
            <Button
              size="sm"
              onClick={() => {
                console.log("Sending ping to extension")
                window.postMessage({ type: "VIBENOTE_PING" }, window.location.origin)
              }}
            >
              Ping Extension
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Welcome to VibeNote!</h2>
        <p className="text-muted-foreground">
          VibeNote helps you save and organize content from around the web. Install the Chrome extension to get started.
        </p>
      </div>
    </div>
  )
}
