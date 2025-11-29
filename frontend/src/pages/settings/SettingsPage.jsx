import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Bell, Shield, Moon, Globe } from 'lucide-react'

const SettingsPage = () => {
  return (
    <div>
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account preferences"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' }
        ]}
      />

      <div className="max-w-2xl space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive emails about your transactions and events</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-rewardly-blue focus:ring-rewardly-blue border-gray-300 rounded"
              />
            </div>
            <hr />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Points Updates</p>
                <p className="text-sm text-gray-500">Get notified when you earn or spend points</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-rewardly-blue focus:ring-rewardly-blue border-gray-300 rounded"
              />
            </div>
            <hr />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Event Reminders</p>
                <p className="text-sm text-gray-500">Receive reminders for upcoming events</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-rewardly-blue focus:ring-rewardly-blue border-gray-300 rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Theme</p>
                <p className="text-sm text-gray-500">Choose your preferred theme</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Language</p>
                <p className="text-sm text-gray-500">Select your preferred language</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>English</option>
                <option>French</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Profile Visibility</p>
                <p className="text-sm text-gray-500">Allow others to see your profile</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-rewardly-blue focus:ring-rewardly-blue border-gray-300 rounded"
              />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg">
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export default SettingsPage

