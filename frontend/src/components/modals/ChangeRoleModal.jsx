import { useState } from "react";
import { usersAPI } from "@/api/users";
import { Button } from "@/components/ui/button";
import { getUser } from "@/utils/auth";
import { Shield, CheckCircle } from "lucide-react";

// Role hierarchy - higher number = more privileges
const ROLE_RANK = {
  regular: 1,
  cashier: 2,
  manager: 3,
  superuser: 4,
};

// Get list of roles that can be assigned by the current user
const getAssignableRoles = (requesterRole) => {
  const requesterRank = ROLE_RANK[requesterRole] || 1;

  // Superusers can assign any role
  if (requesterRole === "superuser") {
    return ["regular", "cashier", "manager", "superuser"];
  }

  // Managers can only assign roles BELOW their rank (regular, cashier)
  // Managers CANNOT promote to manager or superuser
  if (requesterRole === "manager") {
    return ["regular", "cashier"];
  }

  // Cashiers and regular users shouldn't be changing roles at all
  // but if somehow they access this, limit to regular only
  return ["regular"];
};

const ChangeRoleModal = ({ user, onClose, onUpdated, onSuccess }) => {
  const currentUser = getUser();
  const myRole = currentUser?.role || "regular";
  const myRank = ROLE_RANK[myRole] || 1;
  const targetRank = ROLE_RANK[user.role] || 1;

  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Get roles this user is allowed to assign
  const assignableRoles = getAssignableRoles(myRole);

  // Managers cannot modify users of same or higher rank
  const cannotModifyTarget = myRole !== "superuser" && myRank <= targetRank;

  // Role display names
  const roleLabels = {
    regular: "Regular",
    cashier: "Cashier",
    manager: "Manager",
    superuser: "Superuser",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation: prevent assigning roles above what's allowed
    if (!assignableRoles.includes(role)) {
      setErrorMsg(`You cannot assign the "${role}" role.`);
      return;
    }

    // Additional check: managers cannot promote to manager or higher
    if (myRole === "manager" && (role === "manager" || role === "superuser")) {
      setErrorMsg("Managers cannot promote users to manager or superuser.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const oldRole = user.role;
      await usersAPI.update(user.id, { role });
      
      // Show success message briefly before closing
      const message = `${user.name}'s role changed from ${roleLabels[oldRole]} to ${roleLabels[role]}.`;
      setSuccessMsg(message);
      
      // Wait a moment to show success, then close and notify parent
      setTimeout(() => {
        onUpdated();
        if (onSuccess) onSuccess(message);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to update role:", err);

      // Show backend message if available
      const errorMsg = err?.message || err?.data?.error || err?.data?.message || "Failed to update role.";
      setErrorMsg(errorMsg);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Change User Role
        </h2>

        {cannotModifyTarget && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm mb-4">
            You cannot modify users with equal or higher privileges.
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm mb-4">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={saving || cannotModifyTarget}
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
            
            {myRole === "manager" && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                As a manager, you can assign Regular or Cashier roles only.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || cannotModifyTarget}>
              {saving ? "Saving..." : "Update Role"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
