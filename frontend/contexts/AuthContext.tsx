'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, login as loginApi, logout as logoutApi, getCurrentUser, isAuthenticated, getUser } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const storedUser = getUser()
        if (storedUser) {
          setUser(storedUser)
        } else {
          // Try to get user from API
          const apiUser = await getCurrentUser()
          setUser(apiUser)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await loginApi(email, password)
    setUser(response.user)
  }

  const logout = async () => {
    await logoutApi()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

