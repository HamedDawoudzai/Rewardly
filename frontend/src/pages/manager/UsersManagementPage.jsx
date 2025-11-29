import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Eye, UserPlus, Shield, CheckCircle, XCircle } from 'lucide-react'

const UsersManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1)

  // Mock data - will be replaced with real API calls
  const users = [
    { id: 1, utorid: 'john_doe', name: 'John Doe', email: 'john@example.com', role: 'regular', verified: true, points: 1250, createdAt: '2025-10-15' },
    { id: 2, utorid: 'jane_smith', name: 'Jane Smith', email: 'jane@example.com', role: 'cashier', verified: true, points: 850, createdAt: '2025-10-20' },
    { id: 3, utorid: 'bob_wilson', name: 'Bob Wilson', email: 'bob@example.com', role: 'regular', verified: false, points: 0, createdAt: '2025-11-01' },
    { id: 4, utorid: 'alice_johnson', name: 'Alice Johnson', email: 'alice@example.com', role: 'manager', verified: true, points: 2500, createdAt: '2025-09-01' },
    { id: 5, utorid: 'charlie_brown', name: 'Charlie Brown', email: 'charlie@example.com', role: 'regular', verified: true, points: 500, createdAt: '2025-11-10' },
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
      label: 'Role',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleStyles(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'verified',
      label: 'Verified',
      render: (value) => (
        value ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-300" />
        )
      )
    },
    {
      key: 'points',
      label: 'Points',
      render: (value) => (
        <span className="font-medium text-rewardly-blue">{value.toLocaleString()}</span>
      )
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Link to={`/manager/users/${row.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </Link>
        </div>
      )
    }
  ]

  const filterPanel = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Roles</option>
          <option value="regular">Regular</option>
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
          <option value="superuser">Superuser</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All</option>
          <option value="true">Verified</option>
          <option value="false">Not Verified</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Activated</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All</option>
          <option value="true">Activated</option>
          <option value="false">Not Activated</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button variant="outline" className="w-full">
          Clear Filters
        </Button>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader 
        title="Manage Users" 
        subtitle="View and manage all users in the system"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Users' }
        ]}
        actions={
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        searchable={true}
        searchPlaceholder="Search by name, email, or UTORid..."
        pagination={true}
        currentPage={currentPage}
        totalPages={3}
        totalItems={25}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        filters={filterPanel}
        emptyMessage="No users found"
      />
    </div>
  )
}

export default UsersManagementPage

