import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { usersAPI } from "@/api/users";
import EditUserModal from "@/components/modals/EditUserModal";
import ChangeRoleModal from "@/components/modals/ChangeRoleModal";

const UserDetailPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getById(id);
      setUser(data);
    } catch (err) {
      console.error("Failed to load user:", err);
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
    } finally {
      setSaving(false);
    }
  };

  const verifyUser = () => updateUser({ verified: true });

  // FIXED VERSION
  const toggleActivation = async () => {
    setSaving(true);
    try {
      await usersAPI.update(id, { isActivated: !user.isActivated });

      setUser(prev => ({ ...prev, isActivated: !prev.isActivated }));

      await loadUser();
    } catch (err) {
      console.error("Failed to toggle activation:", err);
      alert("Failed to update activation status");
    } finally {
      setSaving(false);
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

  if (loading || !user) {
    return <div className="p-10 text-center text-gray-500">Loading user...</div>;
  }

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
              onClick={() => setShowEditModal(true)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit User
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-rewardly-blue flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">@{user.utorid}</p>

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
                {user.isActivated ? (
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
                  <Coins className="h-4 w-4" /> Points
                </label>
                <p className="text-2xl font-bold text-rewardly-blue">
                  {user.points?.toLocaleString() ?? 0}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Member Since
                </label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Last Login
                </label>
                <p className="text-gray-900">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <hr />

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

              <div className="flex flex-wrap gap-3">
                {!user.verified && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={saving}
                    onClick={verifyUser}
                  >
                    <UserCheck className="h-4 w-4" />
                    Verify User
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={saving}
                  onClick={() => setShowRoleModal(true)}
                >
                  <Shield className="h-4 w-4" />
                  Change Role
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                  disabled={saving}
                  onClick={toggleActivation}
                >
                  <UserX className="h-4 w-4" />
                  {user.isActivated ? "Deactivate" : "Activate"}
                </Button>
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
