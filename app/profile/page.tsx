import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()

  // getUser() validates the JWT with Supabase server — more secure than getSession()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Welcome, Explorer! 🏔️</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">You are successfully logged in as:</p>
          <div className="rounded-lg bg-muted p-4">
            <p className="font-semibold">{profile?.full_name || 'Unknown Name'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <form action={logout} className="pt-4">
            <Button type="submit" variant="destructive" className="w-full">Log Out</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}