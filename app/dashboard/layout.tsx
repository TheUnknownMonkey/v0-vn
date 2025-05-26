import type React from "react"
import { AuthBridge } from "@/components/auth/auth-bridge"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Use a key to ensure AuthBridge is only mounted once */}
      <AuthBridge key="auth-bridge" />

      {/* Dashboard content */}
      <main className="container mx-auto py-8 px-4">{children}</main>
    </div>
  )
}
