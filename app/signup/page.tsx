'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/login?message=Check your email to confirm your account')
    }
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSignup} className="flex flex-col gap-5 rounded-lg border-2 border-zinc-900 bg-zinc-100 p-5 shadow-[4px_4px_0_0_#323232] dark:border-zinc-50 dark:bg-zinc-800">
          <div>
            <p className="flex flex-col text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Create Account
              <span className="text-base font-semibold text-zinc-600 dark:text-zinc-400">
                Sign up to continue
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="relative z-10 flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-md border-2 border-zinc-900 bg-white px-4 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] transition-all duration-200 before:absolute before:left-0 before:top-0 before:z-[-1] before:h-full before:w-0 before:bg-zinc-900 before:transition-all before:duration-200 hover:text-zinc-50 hover:before:w-full dark:border-zinc-50 dark:bg-zinc-900 dark:text-zinc-50 dark:before:bg-zinc-50 dark:hover:text-zinc-900"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l-3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex w-full items-center justify-center gap-2">
            <div className="h-[3px] w-24 rounded-full bg-zinc-600" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">OR</span>
            <div className="h-[3px] w-24 rounded-full bg-zinc-600" />
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 w-full rounded-md border-2 border-zinc-900 bg-white px-3 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] outline-none dark:border-zinc-50 dark:bg-zinc-900 dark:text-zinc-50"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-10 w-full rounded-md border-2 border-zinc-900 bg-white px-3 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] outline-none dark:border-zinc-50 dark:bg-zinc-900 dark:text-zinc-50"
          />

          {error && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="relative z-10 flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-md border-2 border-zinc-900 bg-white px-4 text-base font-semibold text-zinc-900 shadow-[4px_4px_0_0_#323232] transition-all duration-200 before:absolute before:left-0 before:top-0 before:z-[-1] before:h-full before:w-0 before:bg-zinc-900 before:transition-all before:duration-200 hover:text-zinc-50 hover:before:w-full disabled:opacity-50 dark:border-zinc-50 dark:bg-zinc-900 dark:text-zinc-50 dark:before:bg-zinc-50 dark:hover:text-zinc-900"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-zinc-900 hover:underline dark:text-zinc-50">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
