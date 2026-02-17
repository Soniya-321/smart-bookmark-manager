import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookmarkList from '@/components/BookmarkList'
import AddBookmarkForm from '@/components/AddBookmarkForm'
import LogoutButton from '@/components/LogoutButton'
import RealtimeStatus from '@/components/RealtimeStatus'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch initial bookmarks (server-side)
  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookmarks:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Bookmarks
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
                <RealtimeStatus />
                <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Add Bookmark Form */}
        <div className="mb-8">
          <AddBookmarkForm />
        </div>

        {/* Bookmark List */}
        <BookmarkList initialBookmarks={bookmarks || []} userId={user.id} />
      </main>
    </div>
  )
}