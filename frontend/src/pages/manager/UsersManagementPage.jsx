import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout";
import { DataTable } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import { Eye, UserPlus, CheckCircle, XCircle, Edit2 } from "lucide-react";

import { usersAPI } from "@/api/users";
import { PAGINATION_DEFAULTS } from "@/mock";

import CreateUserModal from "@/components/modals/CreateUserModal";
import EditUserModal from "@/components/modals/EditUserModal";

const UsersManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [filters, setFilters] = useState({
    role: "",
    verified: "",
    activated: "",
  });

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  // --------------------------------------------------------------------
  // Load Users (Real API)
  // --------------------------------------------------------------------
  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: PAGINATION_DEFAULTS.itemsPerPage,
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.verified ? { verified: filters.verified } : {}),
        ...(filters.activated ? { activated: filters.activated } : {}),
      };

      const response = await usersAPI.getAll(params);

      // Backend shape: { count, results }
      const results = response.results || response.data || [];
      const totalFromResponse =
        typeof response.count === "number" ? response.count : results.length;

      setUsers(results);
      setTotalItems(totalFromResponse);
      setTotalPages(
        Math.max(
          1,
          Math.ceil(totalFromResponse / PAGINATION_DEFAULTS.itemsPerPage)
        )
      );
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleStyles = (role) => {
    const styles = {
      regular: "bg-gray-100 text-gray-700",
      cashier: "bg-blue-100 text-blue-700",
      manager: "bg-purple-100 text-purple-700",
      superuser: "bg-red-100 text-red-700",
    };
    return styles[role] || styles.regular;
  };

  const columns = [
    {
      key: "utorid",
      label: "UTORid",
      render: (value) => (
        <span className="font-mono font-medium text-gray-900">@{value}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
    },
    {
      key: "email",
      label: "Email",
      render: (value) => <span className="text-gray-500">{value}</span>,
    },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleStyles(
            value
          )}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "verified",
      label: "Verified",
      render: (value) =>
        value ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-300" />
        ),
    },
    {
      key: "points",
      label: "Points",
      render: (value) => (
        <span className="font-medium text-rewardly-blue">
          {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Link to={`/manager/users/${row.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <Eye className="h-4 w-4" /> View
            </Button>
          </Link>

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setSelectedUser(row);
              setShowEditModal(true);
            }}
          >
            <Edit2 className="h-4 w-4" /> Edit
          </Button>
        </div>
      ),
    },
  ];

  const filterPanel = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          value={filters.role}
          onChange={(e) => {
            setCurrentPage(1);
            setFilters({ ...filters, role: e.target.value });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Roles</option>
          <option value="regular">Regular</option>
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
          <option value="superuser">Superuser</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Verified
        </label>
        <select
          value={filters.verified}
          onChange={(e) => {
            setCurrentPage(1);
            setFilters({ ...filters, verified: e.target.value });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All</option>
          <option value="true">Verified</option>
          <option value="false">Not Verified</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Activated
        </label>
        <select
          value={filters.activated}
          onChange={(e) => {
            setCurrentPage(1);
            setFilters({ ...filters, activated: e.target.value });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All</option>
          <option value="true">Activated</option>
          <option value="false">Not Activated</option>
        </select>
      </div>

      <div className="flex items-end">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setCurrentPage(1);
            setFilters({ role: "", verified: "", activated: "" });
          }}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Manage Users"
        subtitle="View and manage all users in the system"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manager" },
          { label: "Users" },
        ]}
        actions={
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search by name, email, or UTORid..."
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={PAGINATION_DEFAULTS.itemsPerPage}
        onPageChange={setCurrentPage}
        filters={filterPanel}
        emptyMessage="No users found"
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onUpdated={loadUsers}
        />
      )}
    </div>
  );
};

export default UsersManagementPage;
