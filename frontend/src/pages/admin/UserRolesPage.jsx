import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, UserCog, AlertCircle, CheckCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { usersAPI } from '@/api/users'
import { PAGINATION_DEFAULTS } from '@/mock'

const UserRolesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    return isNaN(page) || page < 1 ? 1 : page
  })
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [updating, setUpdating] = useState(false)
  const [success, setSuccess] = useState(false)

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (currentPage > 1) params.set('page', currentPage.toString())
    if (searchTerm) params.set('search', searchTerm)
    
    setSearchParams(params, { replace: true })
  }, [currentPage, searchTerm, setSearchParams])

  useEffect(() => {
    loadUsers()
  }, [currentPage])

  // -----------------------------------------------------------
  // Load users (REAL API)
  // -----------------------------------------------------------
  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: PAGINATION_DEFAULTS.itemsPerPage
      }

      const response = await usersAPI.getAll(params)

      const results = response.results || response.data || []
      const pagination = response.pagination || {
        totalPages: 1,
        totalItems: results.length
      }

      setUsers(results)
      setTotalPages(pagination.totalPages)
      setTotalItems(pagination.totalItems)

    } catch (err) {
      console.error("Failed to load users:", err)
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------------------------
  // Update user role
  // -----------------------------------------------------------
  const handlePromote = async () => {
    if (!selectedUser || !newRole) return

    setUpdating(true)
    try {
      await usersAPI.update(selectedUser.id, { role: newRole })

      setSuccess(true)
      setTimeout(() => {
        setSelectedUser(null)
        setNewRole('')
        setSuccess(false)
        loadUsers()
      }, 1500)

    } catch (err) {
      console.error("Failed to update user role:", err)
      // Could add error state here if needed
      alert(err?.message || err?.data?.error || "Failed to update user role.")
    } finally {
      setUpdating(false)
    }
  }

  const getRoleStyles = (role) => {
    const styles = {
      regular: 'bg-gray-100 text-gray-700',
      cashier: 'bg-blue-100 text-blue-700',
      manager: 'bg-purple-100 text-purple-700',
      superuser: 'bg-red-100 text-red-700'
    }
    return styles[role] || styles.regular
  }

  const columns = [
    {
      key: 'utorid',
      label: 'UTORid',
      render: (v) => <span className="font-mono font-medium">@{v}</span>
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email',
      render: (v) => <span className="text-gray-500">{v}</span>
    },
    {
      key: 'role',
      label: 'Current Role',
      render: (v) => (
        <span className={`px-2 py-1 rounded-full text-xs capitalize ${getRoleStyles(v)}`}>
          {v}
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

        {/* User Table */}
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            searchable
            searchPlaceholder="Search by name or UTORid..."
            pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={PAGINATION_DEFAULTS.itemsPerPage}
            onPageChange={setCurrentPage}
            emptyMessage="No users found"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={(value) => {
              setSearchTerm(value)
              setCurrentPage(1)
            }}
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
                <p className="font-medium text-green-700">
                  Role Updated!
                </p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Selected User Block */}
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

                {/* New Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role
                  </label>

                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue"
                  >
                    <option value="">Select a role...</option>
                    <option value="regular">Regular User</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="superuser">Superuser</option>
                  </select>
                </div>

                {/* Superuser Warning */}
                {newRole === 'superuser' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <p>
                      <strong>Warning:</strong> Superusers have full system access.
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedUser(null)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>

                  <Button
                    className="flex-1"
                    disabled={updating || !newRole || newRole === selectedUser.role}
                    onClick={handlePromote}
                  >
                    {updating ? "Updating..." : "Update Role"}
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
