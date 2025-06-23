'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  user: any
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<Error | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setUser(data.user)
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user
      setUser(currentUser || null)

      if (currentUser) {
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('id', currentUser.id)
          .single()

        if (!existingUser && !fetchError) {
          const name =
            currentUser.user_metadata?.name ||
            currentUser.user_metadata?.full_name ||
            currentUser.email
            console.log("Supabase UID:", currentUser.id) // 👈 ADD THIS


          const { error: insertError } = await supabase.from('users').insert([
            {
              id: currentUser.id,
              name,
              email: currentUser.email,
            },
          ])

          if (insertError) {
            console.error('Error inserting user into users table:', insertError)
          }
        }
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
  setLoading(true)

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (!error) {
    const { data } = await supabase.auth.getUser()
    const currentUser = data?.user

    setUser(currentUser || null)

    if (currentUser) {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .single()

      if (!existingUser && !fetchError) {
        const name =
          currentUser.user_metadata?.name ||
          currentUser.user_metadata?.full_name ||
          currentUser.email

        const { error: insertError } = await supabase.from('users').insert([
          {
            id: currentUser.id,
            name,
            email: currentUser.email,
          },
        ])

        if (insertError) {
          console.error('❌ Error inserting user into users table:', insertError)
        } else {
          console.log('✅ User successfully inserted into users table')
        }
      }
    }

    router.push('/dashboard')
  }

  setLoading(false)
  return error
}


  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${location.origin}/login`,
      },
    })

    setLoading(false)

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return new Error('An account already exists with this email.')
      }
      return error
    }

    return null // Success
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error(
      "❌ useAuth() must be used within an <AuthProvider>. Check if the component using it is a client component and wrapped correctly."
    )
  }
  return context
}
