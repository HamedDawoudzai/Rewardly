import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout";
import { DataTable } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Eye, UserPlus, CheckCircle, XCircle, Edit2, Download } from "lucide-react";

import { usersAPI } from "@/api/users";
import { exportAPI } from "@/api/exports";
import { PAGINATION_DEFAULTS } from "@/mock";
import { getUser } from "@/utils/auth";

import EditUserModal from "@/components/modals/EditUserModal";

const UsersManagementPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    return isNaN(page) || page < 1 ? 1 : page
  });
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAPI.downloadUsers({
        role: filters.role || undefined,
        verified: filters.verified || undefined,
        activated: filters.activated || undefined
      });
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export users. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const [filters, setFilters] = useState(() => ({
    role: searchParams.get('role') || "",
    verified: searchParams.get('verified') || "",
    activated: searchParams.get('activated') || "",
  }));

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (searchTerm) params.set('search', searchTerm);
    if (filters.role) params.set('role', filters.role);
    if (filters.verified) params.set('verified', filters.verified);
    if (filters.activated) params.set('activated', filters.activated);
    
    setSearchParams(params, { replace: true });
  }, [currentPage, searchTerm, filters, setSearchParams]);

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);

  // --------------------------------------------------------------------
  // Load Users (Real API)
  // --------------------------------------------------------------------
  const loadUsers = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = {
        page: currentPage,
        limit: PAGINATION_DEFAULTS.itemsPerPage,
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.verified ? { verified: filters.verified } : {}),
        ...(filters.activated ? { activated: filters.activated } : {}),
      };

      const response = await usersAPI.getAll(params);

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
      setErrorMessage(error.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  // --------------------------------------------------------------------
  // Role style badges
  // --------------------------------------------------------------------
  const getRoleStyles = (role) => {
    const styles = {
      regular: "bg-gray-100 text-gray-700",
      cashier: "bg-blue-100 text-blue-700",
      manager: "bg-purple-100 text-purple-700",
      superuser: "bg-red-100 text-red-700",
    };
    return styles[role] || styles.regular;
  };

  // --------------------------------------------------------------------
  // Determine logged in user's rank
  // --------------------------------------------------------------------
  const sessionUser = getUser();
  const roleRank = {
    regular: 1,
    cashier: 2,
    manager: 3,
    superuser: 4,
  };
  const myRole = sessionUser?.role || "regular";
  const myRank = roleRank[myRole] || 1;
  const isSuperuser = myRole === "superuser";

  // --------------------------------------------------------------------
  // Table columns
  // --------------------------------------------------------------------
  const columns = [
    {
      key: "utorid",
      label: "UTORid",
      render: (value) => (
        <span className="font-mono font-medium text-white">@{value}</span>
      ),
    },
    { key: "name", label: "Name" },
    {
      key: "email",
      label: "Email",
      render: (value) => <span className="text-white">{value}</span>,
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
      render: (_, row) => {
        const targetRank = roleRank[row.role] || 1;
        const canView = isSuperuser || myRank >= targetRank;
        const canModify = isSuperuser || myRank > targetRank;

        return (
          <div className="flex gap-2">
            {canView ? (
              <Link to={`/manager/users/${row.id}`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Eye className="h-4 w-4" /> View
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                disabled
                title="You cannot view users with higher privileges"
              >
                <Eye className="h-4 w-4" /> View
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              disabled={!canModify}
              onClick={() => {
                if (!canModify) {
                  showError("You cannot modify a user with higher or equal role.");
                  return;
                }

                setSelectedUser(row);
                setShowEditModal(true);
              }}
            >
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
          </div>
        );
      },
    },
  ];

  // --------------------------------------------------------------------
  // Filters UI
  // --------------------------------------------------------------------
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
            setSearchTerm('');
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
            setSearchTerm('');
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
            setSearchTerm('');
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
            setSearchTerm('');
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button
              className="gap-2"
              onClick={() => navigate("/cashier/users")}
            >
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          </div>
        }
      />

      {/* ERROR MESSAGE BANNER */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm border border-red-300">
          {errorMessage}
        </div>
      )}

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
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
      />

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};

export default UsersManagementPage;
