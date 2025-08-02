
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  user: any
  loading: boolean
  isRegistered: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  refreshUser: () => Promise<void> // Add method to refresh user data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const router = useRouter()

  // Check if user is registered
  const checkRegistrationStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_registered')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error checking registration status:', error)
        return false
      }

      return data?.is_registered || false
    } catch (error) {
      console.error('Error checking registration status:', error)
      return false
    }
  }

  // Get authenticated user data using getUser() instead of getSession()
  const getAuthenticatedUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error getting authenticated user:', error)
        return null
      }
      
      if (data?.user) {
        console.log('✅ Authenticated user found:', data.user.id)
        return data.user
      }
      
      return null
    } catch (error) {
      console.error('Exception getting authenticated user:', error)
      return null
    }
  }

  // Refresh user data - can be called when needed
  const refreshUser = async () => {
    const authenticatedUser = await getAuthenticatedUser()
    if (authenticatedUser) {
      setUser(authenticatedUser)
      const registered = await checkRegistrationStatus(authenticatedUser.id)
      setIsRegistered(registered)
    } else {
      setUser(null)
      setIsRegistered(false)
    }
  }

  // Load session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      
      // Get authenticated user on mount
      const authenticatedUser = await getAuthenticatedUser()
      if (authenticatedUser) {
        setUser(authenticatedUser)
        const registered = await checkRegistrationStatus(authenticatedUser.id)
        setIsRegistered(registered)
      }
      
      setLoading(false)
    }

    initializeAuth()

    // Listen for auth state changes but always verify with getUser()
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Always get fresh authenticated user data
        const authenticatedUser = await getAuthenticatedUser()
        if (authenticatedUser) {
          setUser(authenticatedUser)
          const registered = await checkRegistrationStatus(authenticatedUser.id)
          setIsRegistered(registered)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsRegistered(false)
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
      // Get fresh authenticated user data after login
      const authenticatedUser = await getAuthenticatedUser()
      if (authenticatedUser) {
        setUser(authenticatedUser)
        const registered = await checkRegistrationStatus(authenticatedUser.id)
        setIsRegistered(registered)
        
        // Redirect based on registration status
        if (registered) {
          router.push('/dashboard')
        } else {
          router.push('/register')
        }
      }
    }

    setLoading(false)
    return error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsRegistered(false)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, isRegistered, login, logout, refreshUser }}>
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

