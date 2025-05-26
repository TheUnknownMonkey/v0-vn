"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

type Workspace = {
  id: string
  name: string
  created_at: string
}

export function WorkspaceInfo() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("User not found")
        }

        // First get the user's workspace_id
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("workspace_id")
          .eq("id", user.id)
          .single()

        if (userError) {
          throw userError
        }

        if (userData?.workspace_id) {
          // Then get the workspace details
          const { data: workspaceData, error: workspaceError } = await supabase
            .from("workspaces")
            .select("*")
            .eq("id", userData.workspace_id)
            .single()

          if (workspaceError) {
            throw workspaceError
          }

          setWorkspace(workspaceData)
        }
      } catch (err: any) {
        console.error("Error fetching workspace:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspace()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Workspace</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading workspace info...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Error: {error}</p>
        ) : workspace ? (
          <div>
            <p className="font-medium">{workspace.name}</p>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(workspace.created_at).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workspace found. Please contact support.</p>
        )}
      </CardContent>
    </Card>
  )
}
