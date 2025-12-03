import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import rewardlyLogo from '@/assets/rewardly_cropped.png'
import { authAPI, userAPI } from '@/api/api'
import { saveAuth, isAuthenticated } from '@/utils/auth'

const LandingPage = () => {
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard')
    }
  }, [navigate])

  const [formData, setFormData] = useState({
    utorid: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Login - get token
      const loginResponse = await authAPI.login(formData.utorid, formData.password)
      
      // Save token first (needed for the profile fetch)
      localStorage.setItem('authToken', loginResponse.token)
      
      // Fetch user profile
      const userProfile = await userAPI.getProfile()
      
      // Save auth with full user data
      saveAuth(loginResponse.token, userProfile)
      
      // Set success state
      setSuccess(true)
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err) {
      console.error('Authentication error:', err)
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rewardly-light-blue via-white to-rewardly-light-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-6">
            {/* Logo and Title */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center p-3 flex-shrink-0 overflow-hidden">
                <img 
                  src={rewardlyLogo} 
                  alt="Rewardly Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="text-4xl font-bold font-heading text-rewardly-dark-navy">
                Rewardly
              </h1>
            </div>
            
            {/* Slogan */}
            <p className="text-center text-lg text-rewardly-blue font-medium">
              Where loyalty pays off
            </p>
            
            <CardTitle className="text-2xl text-center font-heading text-rewardly-dark-navy pt-2">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-base">
              Sign in to access your rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                Login successful! Redirecting...
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="utorid" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  UTORid
                </label>
                <input
                  id="utorid"
                  name="utorid"
                  type="text"
                  required
                  value={formData.utorid}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                  placeholder="your_utorid"
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading || success}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-rewardly-blue focus:ring-rewardly-blue border-gray-300 rounded"
                />
                <label 
                  htmlFor="remember" 
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading || success}
              >
                {loading ? 'Please wait...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-rewardly-blue hover:text-rewardly-dark-navy transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default LandingPage
