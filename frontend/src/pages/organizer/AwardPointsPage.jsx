import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Award, Users, User, Coins, AlertCircle, CheckCircle } from 'lucide-react'

const AwardPointsPage = () => {
  const { id } = useParams()
  const [mode, setMode] = useState('single') // 'single' or 'all'
  const [utorid, setUtorid] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Mock event data
  const event = {
    id: parseInt(id),
    name: 'Tech Workshop: React Basics',
    pointsRemain: 5000,
    numGuests: 35,
    defaultPoints: 100
  }

  const handleAwardSingle = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!utorid.trim()) {
      setError('Please enter a user UTORid')
      return
    }
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (parseInt(amount) > event.pointsRemain) {
      setError('Insufficient points remaining for this event')
      return
    }

    setLoading(true)
    try {
      // TODO: API call to award points to single user
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to award points')
    } finally {
      setLoading(false)
    }
  }

  const handleAwardAll = async () => {
    setError('')
    
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount per guest')
      return
    }
    const totalNeeded = parseInt(amount) * event.numGuests
    if (totalNeeded > event.pointsRemain) {
      setError(`Insufficient points. Need ${totalNeeded.toLocaleString()} but only ${event.pointsRemain.toLocaleString()} remaining`)
      return
    }

    setLoading(true)
    try {
      // TODO: API call to award points to all guests
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to award points')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUtorid('')
    setAmount('')
    setSuccess(false)
    setError('')
  }

  return (
    <div>
      <PageHeader 
        title="Award Points" 
        subtitle={`For: ${event.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Events', href: '/organizer/events' },
          { label: event.name },
          { label: 'Award Points' }
        ]}
        actions={
          <Link to="/organizer/events">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Points Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Points Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-rewardly-blue">
                {event.pointsRemain.toLocaleString()}
              </p>
              <p className="text-gray-500">points remaining</p>
            </div>
            <div className="border-t pt-4 mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Guests</span>
                <span className="font-medium">{event.numGuests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Default per Guest</span>
                <span className="font-medium">{event.defaultPoints} pts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Award Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Award Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Points Awarded!</h3>
                <p className="text-gray-600 mb-6">
                  {mode === 'single' 
                    ? `Successfully awarded ${amount} points to ${utorid}`
                    : `Successfully awarded ${amount} points each to ${event.numGuests} guests`
                  }
                </p>
                <Button onClick={handleReset}>
                  Award More Points
                </Button>
              </div>
            ) : (
              <>
                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={mode === 'single' ? 'default' : 'outline'}
                    onClick={() => setMode('single')}
                    className="flex-1 gap-2"
                  >
                    <User className="h-4 w-4" />
                    Single Guest
                  </Button>
                  <Button
                    variant={mode === 'all' ? 'default' : 'outline'}
                    onClick={() => setMode('all')}
                    className="flex-1 gap-2"
                  >
                    <Users className="h-4 w-4" />
                    All Guests
                  </Button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm mb-6">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {mode === 'single' ? (
                  <form onSubmit={handleAwardSingle} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guest UTORid
                      </label>
                      <input
                        type="text"
                        value={utorid}
                        onChange={(e) => setUtorid(e.target.value)}
                        placeholder="Enter guest's UTORid"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points to Award
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={event.pointsRemain}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`e.g., ${event.defaultPoints}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? 'Awarding...' : 'Award Points to Guest'}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-800">
                        This will award points to <strong>all {event.numGuests} RSVPed guests</strong> at once.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points per Guest
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`e.g., ${event.defaultPoints}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                        disabled={loading}
                      />
                      {amount && (
                        <p className="text-sm text-gray-500 mt-2">
                          Total: {(parseInt(amount) * event.numGuests).toLocaleString()} points
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={handleAwardAll} 
                      className="w-full" 
                      size="lg" 
                      disabled={loading}
                    >
                      {loading ? 'Awarding...' : `Award Points to All ${event.numGuests} Guests`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AwardPointsPage

