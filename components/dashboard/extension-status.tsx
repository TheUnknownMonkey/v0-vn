"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ExtensionStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [extensionVersion, setExtensionVersion] = useState<string | null>(null)

  useEffect(() => {
    // Listen for extension acknowledgment
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from the same origin
      if (event.origin !== window.location.origin) return

      if (event.data.type === "VIBENOTE_EXTENSION_READY") {
        setIsConnected(true)
        setExtensionVersion(event.data.version || "unknown")
      }
    }

    window.addEventListener("message", handleMessage)

    // Check if extension is already connected
    window.postMessage({ type: "VIBENOTE_PING" }, window.location.origin)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Extension Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Badge
            variant={isConnected ? "success" : "destructive"}
            className={isConnected ? "bg-green-500" : "bg-red-500"}
          >
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
          {isConnected && extensionVersion && (
            <span className="text-sm text-muted-foreground">v{extensionVersion}</span>
          )}
        </div>
        {!isConnected && (
          <p className="mt-2 text-sm text-muted-foreground">
            Install the VibeNote Chrome extension to start pinning content.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
