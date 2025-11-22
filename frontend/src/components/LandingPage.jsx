import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import rewardlyLogo from '@/assets/rewardly_cropped.png'

const LandingPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement login/signup logic
    console.log('Form submitted:', formData)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
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
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center text-base">
              {isLogin 
                ? 'Sign in to access your rewards' 
                : 'Start earning rewards today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label 
                    htmlFor="name" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
              )}
              
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                  placeholder="you@example.com"
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
                />
              </div>

              {!isLogin && (
                <div>
                  <label 
                    htmlFor="confirmPassword" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
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
                  <button 
                    type="button" 
                    className="text-sm text-rewardly-blue hover:text-rewardly-dark-navy transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-gray-600"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="text-rewardly-blue font-semibold hover:text-rewardly-dark-navy transition-colors">
                  {isLogin ? 'Sign up' : 'Sign in'}
                </span>
              </button>
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

