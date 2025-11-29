import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Coins, 
  CheckCircle, 
  XCircle,
  Edit2,
  UserCheck,
  UserX
} from 'lucide-react'
import { useState } from 'react'

const UserDetailPage = () => {
  const { id } = useParams()
  const [isEditing, setIsEditing] = useState(false)

  // Mock data - will be replaced with API call
  const user = {
    id: parseInt(id),
    utorid: 'john_doe',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'regular',
    verified: true,
    activated: true,
    suspicious: false,
    points: 1250,
    createdAt: '2025-10-15T10:00:00Z',
    lastLogin: '2025-11-28T14:30:00Z'
  }

  const getRoleStyles = (role) => {
    const styles = {
      regular: 'bg-gray-100 text-gray-700',
      cashier: 'bg-blue-100 text-blue-700',
      manager: 'bg-purple-100 text-purple-700',
      superuser: 'bg-red-100 text-red-700',
    }
    return styles[role] || styles.regular
  }

  return (
    <div>
      <PageHeader 
        title={`User: ${user.name}`}
        subtitle={`@${user.utorid}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Users', href: '/manager/users' },
          { label: user.name }
        ]}
        actions={
          <div className="flex gap-2">
            <Link to="/manager/users">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button className="gap-2" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 className="h-4 w-4" />
              Edit User
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-rewardly-blue flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">@{user.utorid}</p>
              <div className="mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getRoleStyles(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-500">Verified</span>
                {user.verified ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-500">Activated</span>
                {user.activated ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500">Suspicious</span>
                {user.suspicious ? (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> No
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Coins className="h-4 w-4" /> Points Balance
                </label>
                <p className="text-2xl font-bold text-rewardly-blue">{user.points.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Member Since
                </label>
                <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Last Login
                </label>
                <p className="text-gray-900">{new Date(user.lastLogin).toLocaleString()}</p>
              </div>
            </div>

            <hr />

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                {!user.verified && (
                  <Button variant="outline" className="gap-2">
                    <UserCheck className="h-4 w-4" />
                    Verify User
                  </Button>
                )}
                <Button variant="outline" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Change Role
                </Button>
                <Button variant="outline" className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50">
                  <UserX className="h-4 w-4" />
                  Deactivate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UserDetailPage

