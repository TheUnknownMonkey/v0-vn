"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signOut } from "@/lib/actions"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function UserProfile() {
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const fetchUserEmail = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || "")
      }
    }

    fetchUserEmail()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">Logged in as:</p>
          <p className="font-medium">{email}</p>
        </div>
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
