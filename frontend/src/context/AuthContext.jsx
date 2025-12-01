import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import { authAPI, userAPI } from '@/api/api'
import { saveAuth, getToken, getUser, clearAuth, isTokenExpired } from '@/utils/auth'

export const AuthContext = createContext(null)

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      const savedUser = getUser()

      if (token && savedUser && !isTokenExpired(token)) {
        setUser(savedUser)
        setIsAuthenticated(true)
      } else {
        clearAuth()
        setUser(null)
        setIsAuthenticated(false)
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = useCallback(async (utorid, password) => {
    try {
      const response = await authAPI.login(utorid, password)
      saveAuth(response.token, response.user)
      setUser(response.user)
      setIsAuthenticated(true)
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }))
    const token = getToken()
    if (token) {
      saveAuth(token, { ...user, ...userData })
    }
  }, [user])

  /**
   * Refresh user data from the API
   * Call this after transactions to update points balance
   */
  const refreshUser = useCallback(async () => {
    try {
      const freshUserData = await userAPI.getProfile()
      setUser(freshUserData)
      const token = getToken()
      if (token) {
        saveAuth(token, freshUserData)
      }
      return freshUserData
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      return null
    }
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
