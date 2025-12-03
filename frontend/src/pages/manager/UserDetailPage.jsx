import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  UserX,
  AlertTriangle,
} from "lucide-react";
import { usersAPI } from "@/api/users";
import { getUser } from "@/utils/auth";
import EditUserModal from "@/components/modals/EditUserModal";
import ChangeRoleModal from "@/components/modals/ChangeRoleModal";

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const sessionUser = getUser();

  const ROLE_RANK = {
    regular: 1,
    cashier: 2,
    manager: 3,
    superuser: 4,
  };

  const myRole = sessionUser?.role || "regular";
  const myRank = ROLE_RANK[myRole] || 1;
  const isSuperuser = myRole === "superuser";

  const showError = (msg) => {
    setSuccessMessage(""); // Clear any success message
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const showSuccess = (msg) => {
    setErrorMessage(""); // Clear any error message
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await usersAPI.getById(id);
      setUser(data);
    } catch (err) {
      console.error("Failed to load user:", err);
      
      // Extract error message from various possible structures
      const errorMsg = err?.message || err?.data?.message || err?.data?.error || "Failed to load user";
      const status = err?.status || err?.data?.status;
      
      // If it's a 403 Forbidden (can't view higher-ranked user), show message and redirect
      if (status === 403 || err?.data?.error === "Forbidden") {
        const forbiddenMsg = err?.data?.message || "You cannot view users with higher privileges.";
        showError(forbiddenMsg);
        // Redirect back to users list after 2 seconds
        setTimeout(() => {
          navigate("/manager/users");
        }, 2000);
      } else {
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (payload) => {
    setSaving(true);
    try {
      await usersAPI.update(id, payload);
      await loadUser();
    } catch (err) {
      console.error("Failed to update user:", err);
      showError(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const verifyUser = async () => {
    // Superusers can modify anyone
    if (!isSuperuser && myRank <= ROLE_RANK[user.role]) {
      showError("You cannot modify a user with higher or equal role.");
      return;
    }
    
    setSaving(true);
    try {
      await usersAPI.update(id, { verified: true });
      await loadUser();
      showSuccess(`${user.name} has been verified successfully.`);
    } catch (err) {
      console.error("Failed to verify user:", err);
      showError(err.message || "Failed to verify user");
    } finally {
      setSaving(false);
    }
  };

  const toggleActivation = async () => {
    // Superusers can modify anyone
    if (!isSuperuser && myRank <= ROLE_RANK[user.role]) {
      showError("You cannot modify a user with higher or equal role.");
      return;
    }

    const newStatus = !user.isActivated;
    setSaving(true);
    try {
      await usersAPI.update(id, { isActivated: newStatus });
      await loadUser();
      showSuccess(`${user.name} has been ${newStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch (err) {
      console.error("Failed to toggle activation:", err);
      showError("Failed to update activation status");
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspicious = async () => {
    // Only cashiers can be marked as suspicious per spec
    if (user.role !== 'cashier') {
      showError("Only cashiers can be marked as suspicious.");
      return;
    }

    // Superusers can modify anyone, others need higher rank
    if (!isSuperuser && myRank <= ROLE_RANK[user.role]) {
      showError("You cannot modify a user with higher or equal role.");
      return;
    }

    const newStatus = !user.suspicious;
    setSaving(true);
    try {
      await usersAPI.update(id, { suspicious: newStatus });
      await loadUser();
      showSuccess(newStatus 
        ? `${user.name} has been marked as suspicious.` 
        : `Suspicious flag has been removed from ${user.name}.`
      );
    } catch (err) {
      console.error("Failed to toggle suspicious status:", err);
      showError("Failed to update suspicious status");
    } finally {
      setSaving(false);
    }
  };

  const getRoleStyles = (role) => {
    const styles = {
      regular: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      cashier: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      manager: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      superuser: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };
    return styles[role] || styles.regular;
  };

  if (loading || !user) {
    return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading user...</div>;
  }

  const targetRank = ROLE_RANK[user.role] || 1;

  // Superusers can modify anyone, others must have higher rank
  const cannotModify = !isSuperuser && myRank <= targetRank;

  return (
    <div>
      <PageHeader
        title={`User: ${user.name}`}
        subtitle={`@${user.utorid}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Manager" },
          { label: "Users", href: "/manager/users" },
          { label: user.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Link to="/manager/users">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>

            <Button
              variant="outline"
              className="gap-2"
              disabled={cannotModify}
              onClick={() => {
                if (cannotModify) {
                  showError("You cannot modify a user with higher or equal role.");
                  return;
                }
                setShowEditModal(true);
              }}
            >
              <Edit2 className="h-4 w-4" />
              Edit User
            </Button>
          </div>
        }
      />

      {errorMessage && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-rewardly-blue flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">@{user.utorid}</p>

              <div className="mt-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getRoleStyles(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Verified</span>
                {user.verified ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Activated</span>
                {user.isActivated ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              </div>

              {/* Only show suspicious status for cashiers per spec */}
              {user.role === 'cashier' && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Suspicious</span>
                  {user.suspicious ? (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" /> No
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </label>
                <p className="text-gray-900 dark:text-white">{user.email}</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Coins className="h-4 w-4" /> Points
                </label>
                <p className="text-2xl font-bold text-rewardly-blue dark:text-rewardly-light-blue">
                  {user.points?.toLocaleString() ?? 0}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Member Since
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Last Login
                </label>
                <p className="text-gray-900 dark:text-white">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>

              <div className="flex flex-wrap gap-3">
                {!user.verified && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={saving || cannotModify}
                    onClick={() => {
                      if (cannotModify) {
                        showError("You cannot modify a user with higher or equal role.");
                        return;
                      }
                      verifyUser();
                    }}
                  >
                    <UserCheck className="h-4 w-4" />
                    Verify User
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={saving || cannotModify}
                  onClick={() => {
                    if (cannotModify) {
                      showError("You cannot modify a user with higher or equal role.");
                      return;
                    }
                    setShowRoleModal(true);
                  }}
                >
                  <Shield className="h-4 w-4" />
                  Change Role
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20"
                  disabled={saving || cannotModify}
                  onClick={() => {
                    if (cannotModify) {
                      showError("You cannot modify a user with higher or equal role.");
                      return;
                    }
                    toggleActivation();
                  }}
                >
                  <UserX className="h-4 w-4" />
                  {user.isActivated ? "Deactivate" : "Activate"}
                </Button>

                {/* Only managers can mark cashiers as suspicious per spec */}
                {user.role === 'cashier' && (
                  <Button
                    variant="outline"
                    className={`gap-2 ${
                      user.suspicious 
                        ? "text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20" 
                        : "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                    }`}
                    disabled={saving || cannotModify}
                    onClick={() => {
                      if (cannotModify) {
                        showError("You cannot modify a user with higher or equal role.");
                        return;
                      }
                      toggleSuspicious();
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {user.suspicious ? "Clear Suspicious" : "Mark Suspicious"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showEditModal && (
        <EditUserModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdated={loadUser}
        />
      )}

      {showRoleModal && (
        <ChangeRoleModal
          user={user}
          onClose={() => setShowRoleModal(false)}
          onUpdated={loadUser}
        />
      )}
    </div>
  );
};

export default UserDetailPage;
