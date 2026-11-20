'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// 1. Login Action
export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  const redirectTo = formData.get('redirectedFrom') as string | null
  redirect(redirectTo || '/profile')
}

// 2. Signup Action
export async function signup(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/profile?message=Account created successfully!')
}

// 3. Logout Action
export async function logout() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

// 4. Request Password Reset — sends email with magic link
export async function requestPasswordReset(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    }
  )

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// 5. Reset Password — updates password after user clicks email link
export async function resetPassword(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect('/profile')
}