"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export function AuthBridge() {
  // Use refs to track auth state and prevent loops
  const authSent = useRef(false)
  const processingMessage = useRef(false)
  const lastAuthPayload = useRef<any>(null)

  useEffect(() => {
    const supabase = createClient()

    // Function to compare auth payloads to avoid duplicate messages
    const isEqualPayload = (a: any, b: any) => {
      if (!a || !b) return false

      // Compare essential fields only
      return a.token === b.token && a.user?.id === b.user?.id && a.workspace?.id === b.workspace?.id
    }

    const sendAuthData = async () => {
      // Prevent concurrent processing
      if (processingMessage.current) {
        console.log("AuthBridge: Already processing a message, skipping")
        return
      }

      processingMessage.current = true

      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session || !session.user) {
          console.log("AuthBridge: No session found")
          processingMessage.current = false
          return
        }

        const user = session.user
        console.log("AuthBridge: Preparing auth for user:", user.email)

        // Create a basic auth payload that will work even if we can't get workspace data
        const authPayload = {
          token: session.access_token,
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata || {},
          },
          workspace: {
            id: null,
            name: null,
          },
        }

        try {
          // Try to get workspace data, but don't fail if we can't
          const { data: userData } = await supabase.from("users").select("workspace_id").eq("id", user.id).single()

          if (userData?.workspace_id) {
            const { data: workspaceData } = await supabase
              .from("workspaces")
              .select("id, name")
              .eq("id", userData.workspace_id)
              .single()

            if (workspaceData) {
              // Update the payload with workspace data
              authPayload.workspace = {
                id: workspaceData.id,
                name: workspaceData.name,
              }
            } else {
              // Just use the workspace ID if we can't get the name
              authPayload.workspace = {
                id: userData.workspace_id,
                name: null,
              }
            }
          }
        } catch (error) {
          // Just log the error but continue with the basic auth payload
          console.error("AuthBridge: Error fetching workspace data:", error)
        }

        // Check if this payload is the same as the last one we sent
        if (isEqualPayload(authPayload, lastAuthPayload.current)) {
          console.log("AuthBridge: Skipping duplicate auth payload")
          processingMessage.current = false
          return
        }

        // Store this payload as the last one sent
        lastAuthPayload.current = authPayload

        // Send the auth message
        const authMessage = {
          type: "VIBENOTE_AUTH",
          payload: authPayload,
        }

        console.log("AuthBridge: Sending auth message")
        window.postMessage(authMessage, window.location.origin)
        authSent.current = true
      } catch (error) {
        console.error("AuthBridge: Error in auth bridge:", error)
      } finally {
        // Always reset the processing flag
        processingMessage.current = false
      }
    }

    // Send auth data with a slight delay to avoid race conditions
    const initialTimer = setTimeout(() => {
      sendAuthData()
    }, 500)

    // Set up a debounced handler for extension pings
    let pingDebounceTimer: NodeJS.Timeout | null = null

    const handleExtensionPing = (event: MessageEvent) => {
      // Only process messages from the same origin
      if (event.origin !== window.location.origin) return

      if (event.data.type === "VIBENOTE_PING") {
        console.log("AuthBridge: Received ping from extension")

        // Debounce the response to avoid multiple rapid auth sends
        if (pingDebounceTimer) {
          clearTimeout(pingDebounceTimer)
        }

        pingDebounceTimer = setTimeout(() => {
          console.log("AuthBridge: Responding to ping with auth data")
          sendAuthData()
        }, 300)
      }

      // Handle extension ready message
      if (event.data.type === "VIBENOTE_EXTENSION_READY") {
        console.log("AuthBridge: Extension is ready, sending auth data")

        // Debounce the response
        if (pingDebounceTimer) {
          clearTimeout(pingDebounceTimer)
        }

        pingDebounceTimer = setTimeout(() => {
          sendAuthData()
        }, 300)
      }
    }

    window.addEventListener("message", handleExtensionPing)

    // Listen for auth state changes with debouncing
    let authChangeTimer: NodeJS.Timeout | null = null

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthBridge: Auth state changed:", event)

      // Debounce auth state changes
      if (authChangeTimer) {
        clearTimeout(authChangeTimer)
      }

      authChangeTimer = setTimeout(() => {
        if (event === "SIGNED_IN" && session) {
          sendAuthData()
        } else if (event === "SIGNED_OUT") {
          console.log("AuthBridge: User signed out, sending signout message")
          window.postMessage(
            {
              type: "VIBENOTE_SIGNOUT",
            },
            window.location.origin,
          )
          authSent.current = false
          lastAuthPayload.current = null
        }
      }, 300)
    })

    // Cleanup
    return () => {
      clearTimeout(initialTimer)
      if (pingDebounceTimer) clearTimeout(pingDebounceTimer)
      if (authChangeTimer) clearTimeout(authChangeTimer)
      subscription.unsubscribe()
      window.removeEventListener("message", handleExtensionPing)
    }
  }, []) // Empty dependency array ensures this only runs once

  // Component renders nothing
  return null
}
