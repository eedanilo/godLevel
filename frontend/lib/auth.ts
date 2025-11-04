/**
 * Authentication utilities (mock)
 */

export interface User {
  id: number
  email: string
  name: string
  role: string
  role_label?: string
}

export interface LoginResponse {
  token: string
  user: User
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Token storage key
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * Store authentication token and user
 */
export function setAuth(token: string, user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

/**
 * Get stored authentication token
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

/**
 * Get stored user
 */
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY)
    if (userStr) {
      try {
        return JSON.parse(userStr) as User
      } catch (e) {
        return null
      }
    }
  }
  return null
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null && getUser() !== null
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Email ou senha incorretos')
  }

  const data: LoginResponse = await response.json()
  setAuth(data.token, data.user)
  return data
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const token = getToken()
  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    } catch (e) {
      // Ignore errors on logout
      console.error('Error on logout:', e)
    }
  }
  clearAuth()
}

/**
 * Get current user from API
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getToken()
  if (!token) {
    return null
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      clearAuth()
      return null
    }

    const user: User = await response.json()
    setAuth(token, user) // Update user info
    return user
  } catch (e) {
    console.error('Error getting current user:', e)
    clearAuth()
    return null
  }
}

/**
 * Get authorization header
 */
export function getAuthHeader(): Record<string, string> {
  const token = getToken()
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    }
  }
  return {}
}

