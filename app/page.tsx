import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginButton from '@/components/LoginButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Smart Bookmarks
          </h1>
          <p className="mt-3 text-gray-600">
            Save and sync your bookmarks in real-time
          </p>
        </div>

        <div className="mt-8">
          <LoginButton />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Secure authentication via Google</p>
        </div>
      </div>
    </main>
  )
}