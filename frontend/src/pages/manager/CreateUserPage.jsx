import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { usersAPI } from "@/api/users";
import { getUser } from "@/utils/auth";
import { UserPlus, CheckCircle, Key, AlertCircle } from "lucide-react";

const CreateUserPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const currentRole = currentUser?.role || "regular";

  // Role hierarchy for determining what roles the current user can create
  const roleRank = {
    regular: 1,
    cashier: 2,
    manager: 3,
    superuser: 4,
  };

  const currentRank = roleRank[currentRole] || 1;
  const isManager = ["manager", "superuser"].includes(currentRole);

  // Available roles based on current user's permissions
  // Can only create users with roles LOWER than their own
  const availableRoles = Object.keys(roleRank).filter(
    (role) => roleRank[role] < currentRank
  );

  const [form, setForm] = useState({
    utorid: "",
    name: "",
    email: "",
    role: availableRoles[0] || "regular",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.utorid.trim()) {
      setErrorMsg("UTORid is required");
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(form.utorid)) {
      setErrorMsg("UTORid can only contain letters and numbers");
      return false;
    }
    if (!form.name.trim()) {
      setErrorMsg("Full name is required");
      return false;
    }
    if (!form.email.trim()) {
      setErrorMsg("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrorMsg("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    setErrorMsg("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create user with default role first
      const createdUserResponse = await usersAPI.create({
        utorid: form.utorid.toLowerCase(),
        name: form.name,
        email: form.email,
      });

      const userId = createdUserResponse?.id || createdUserResponse?.data?.id;
      if (!userId) {
        throw new Error("User created but no ID returned");
      }

      // If role is not regular, update the role
      if (form.role !== "regular") {
        await usersAPI.update(userId, { role: form.role });
      }

      setCreatedUser({
        ...createdUserResponse,
        role: form.role,
      });
      setSuccess(true);
    } catch (err) {
      console.error("Create user error:", err);
      const errorMessage =
        err?.message ||
        err?.data?.error ||
        err?.data?.message ||
        "Failed to create user.";
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      utorid: "",
      name: "",
      email: "",
      role: availableRoles[0] || "regular",
    });
    setSuccess(false);
    setCreatedUser(null);
    setErrorMsg("");
  };

  const getRoleStyles = (role) => {
    const styles = {
      regular: "bg-gray-100 text-gray-700 border-gray-300",
      cashier: "bg-blue-100 text-blue-700 border-blue-300",
      manager: "bg-purple-100 text-purple-700 border-purple-300",
      superuser: "bg-red-100 text-red-700 border-red-300",
    };
    return styles[role] || styles.regular;
  };

  // Success view
  if (success && createdUser) {
    return (
      <div>
        <PageHeader
          title="User Created"
          subtitle="The activation email has been sent to the user"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Cashier" },
            { label: "Create User" },
          ]}
        />

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Card */}
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              User Created Successfully!
            </h2>

            <p className="text-gray-600 mb-6">
              The user account for{" "}
              <span className="font-medium">{createdUser.name || form.name}</span> has been
              created.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">UTORid:</span>
                  <span className="ml-2 font-mono font-medium">
                    @{createdUser.utorid || form.utorid}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Role:</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded text-xs font-medium capitalize ${getRoleStyles(
                      form.role
                    )}`}
                  >
                    {form.role}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2">{createdUser.email || form.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Sent Confirmation */}
          <div className="bg-blue-50 rounded-xl border-2 border-blue-300 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 text-lg">
                  Activation Email Sent
                </h3>
                <p className="text-blue-800 text-sm mt-1">
                  An activation email has been sent to{" "}
                  <span className="font-medium">{createdUser.email || form.email}</span>.
                  The user must check their email and follow the link to set their password.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-blue-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                The activation link expires on{" "}
                <span className="font-medium">
                  {new Date(createdUser.expiresAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                . The user must set their password before this date.
              </p>
            </div>
          </div>

          {/* Next Steps Info */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
            <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
              <li>The user will receive an email with an activation link</li>
              <li>They will click the link and be asked to create a password</li>
              <li>After setting their password, they can log in with their UTORid</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReset}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Another
            </Button>
            {isManager ? (
              <Button onClick={() => navigate("/manager/users")}>
                View All Users
              </Button>
            ) : (
              <Button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Create form view
  return (
    <div>
      <PageHeader
        title="Create User"
        subtitle="Add a new user to the system"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Cashier" },
          { label: "Create User" },
        ]}
      />

      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-rewardly-blue" />
            New User Details
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UTORid <span className="text-red-500">*</span>
              </label>
              <input
                name="utorid"
                value={form.utorid}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                placeholder="e.g. jsmith01"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be unique. Letters and numbers only.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                placeholder="John Smith"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                placeholder="jsmith@mail.utoronto.ca"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                disabled={loading}
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can only create users with roles lower than your own (
                {currentRole}).
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(isManager ? "/manager/users" : "/dashboard")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Role explanation card */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="font-medium text-blue-900 mb-2">Role Permissions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <span className="font-medium">Regular:</span> Basic user, can earn
              and redeem points
            </li>
            {availableRoles.includes("cashier") && (
              <li>
                <span className="font-medium">Cashier:</span> Can process
                transactions and redemptions
              </li>
            )}
            {availableRoles.includes("manager") && (
              <li>
                <span className="font-medium">Manager:</span> Can manage users,
                events, and promotions
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateUserPage;

