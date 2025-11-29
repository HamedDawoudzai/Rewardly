import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, UserCog, AlertCircle, CheckCircle } from 'lucide-react'

const UserRolesPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Mock data
  const users = [
    { id: 1, utorid: 'john_doe', name: 'John Doe', email: 'john@example.com', role: 'regular' },
    { id: 2, utorid: 'jane_smith', name: 'Jane Smith', email: 'jane@example.com', role: 'cashier' },
    { id: 3, utorid: 'bob_wilson', name: 'Bob Wilson', email: 'bob@example.com', role: 'regular' },
    { id: 4, utorid: 'alice_johnson', name: 'Alice Johnson', email: 'alice@example.com', role: 'manager' },
    { id: 5, utorid: 'charlie_brown', name: 'Charlie Brown', email: 'charlie@example.com', role: 'regular' },
  ]

  const getRoleStyles = (role) => {
    const styles = {
      regular: 'bg-gray-100 text-gray-700',
      cashier: 'bg-blue-100 text-blue-700',
      manager: 'bg-purple-100 text-purple-700',
      superuser: 'bg-red-100 text-red-700',
    }
    return styles[role] || styles.regular
  }

  const handlePromote = async () => {
    if (!selectedUser || !newRole) return
    
    setLoading(true)
    try {
      // TODO: API call to promote user
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
      setTimeout(() => {
        setSelectedUser(null)
        setNewRole('')
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      key: 'utorid',
      label: 'UTORid',
      render: (value) => (
        <span className="font-mono font-medium text-gray-900">@{value}</span>
      )
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <span className="text-gray-500">{value}</span>
      )
    },
    {
      key: 'role',
      label: 'Current Role',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleStyles(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={() => {
            setSelectedUser(row)
            setNewRole('')
            setSuccess(false)
          }}
        >
          <UserCog className="h-4 w-4" />
          Change Role
        </Button>
      )
    }
  ]

  return (
    <div>
      <PageHeader 
        title="User Roles" 
        subtitle="Promote users to managers or superusers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Superuser' },
          { label: 'User Roles' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={users}
            searchable={true}
            searchPlaceholder="Search by name or UTORid..."
            pagination={true}
            currentPage={currentPage}
            totalPages={2}
            totalItems={users.length}
            itemsPerPage={10}
            onPageChange={setCurrentPage}
            emptyMessage="No users found"
          />
        </div>

        {/* Role Assignment Panel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Assign Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="text-center py-8 text-gray-500">
                <UserCog className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Select a user to change their role</p>
              </div>
            ) : success ? (
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium text-green-700">Role Updated!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Selected User</p>
                  <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">@{selectedUser.utorid}</p>
                  <p className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleStyles(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">Select a role...</option>
                    <option value="regular">Regular User</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="superuser">Superuser</option>
                  </select>
                </div>

                {newRole === 'superuser' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>Warning:</strong> Superusers have full access to all system features including the ability to promote other users.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedUser(null)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handlePromote}
                    disabled={loading || !newRole || newRole === selectedUser.role}
                  >
                    {loading ? 'Updating...' : 'Update Role'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UserRolesPage

