import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUser } from '@/utils/auth'
import { User, Mail, Calendar, Shield, Edit2, Key } from 'lucide-react'

const ProfilePage = () => {
  const user = getUser()

  return (
    <div>
      <PageHeader 
        title="Profile" 
        subtitle="View and manage your account information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-rewardly-blue flex items-center justify-center mx-auto mb-4">
                <User className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name || 'User Name'}</h2>
              <p className="text-gray-500">@{user?.utorid || 'utorid'}</p>
              <div className="mt-4 flex justify-center gap-2">
                {user?.roles?.map((role) => (
                  <span 
                    key={role}
                    className="px-3 py-1 bg-rewardly-light-blue text-rewardly-blue rounded-full text-sm font-medium capitalize"
                  >
                    {role}
                  </span>
                ))}
              </div>
              <Button className="mt-6 w-full" variant="outline">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </label>
                <p className="text-gray-900 font-medium">{user?.name || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900 font-medium">{user?.email || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  UTORid
                </label>
                <p className="text-gray-900 font-medium">{user?.utorid || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </label>
                <p className="text-gray-900 font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            <hr />

            <div>
              <h3 className="text-lg font-semibold mb-4">Security</h3>
              <Button variant="outline" className="gap-2">
                <Key className="h-4 w-4" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage

