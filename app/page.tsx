import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  // Check if user is authenticated
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  // Show landing page content instead of redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to VibeNote</h1>
        <p className="text-xl mb-8">Save and organize content from around the web with our Chrome extension.</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            className="bg-[#2b725e] hover:bg-[#235e4c] text-white py-6 px-8 text-lg font-medium rounded-lg"
          >
            <Link href="/auth/login">Log In</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white text-white hover:bg-white/10 py-6 px-8 text-lg font-medium rounded-lg"
          >
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
