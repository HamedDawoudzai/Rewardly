import { useState } from "react";
import { usersAPI } from "@/api/users";
import { Button } from "@/components/ui/button";
import { getUser } from "@/utils/auth";

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

const ChangeRoleModal = ({ user, onClose, onUpdated }) => {
  const currentUser = getUser();
  const myRole = currentUser?.role || "regular";
  const myRank = ROLE_RANK[myRole] || 1;
  const targetRank = ROLE_RANK[user.role] || 1;

  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Get roles this user is allowed to assign
  const assignableRoles = getAssignableRoles(myRole);

  // Managers cannot modify users of same or higher rank
  const cannotModifyTarget = myRole !== "superuser" && myRank <= targetRank;

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
      await usersAPI.update(user.id, { role });
      onUpdated(); // reload parent page
      onClose();
    } catch (err) {
      console.error("Failed to update role:", err);

      // Show backend message if available
      const errorMsg = err?.message || err?.data?.error || err?.data?.message || "Failed to update role.";
      setErrorMsg(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Role display names
  const roleLabels = {
    regular: "Regular",
    cashier: "Cashier",
    manager: "Manager",
    superuser: "Superuser",
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Change User Role</h2>

        {cannotModifyTarget && (
          <p className="text-amber-600 text-sm mb-3 bg-amber-50 p-2 rounded border border-amber-200">
            You cannot modify users with equal or higher privileges.
          </p>
        )}

        {errorMsg && (
          <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded border border-red-200">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Role</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
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
              <p className="text-xs text-gray-500 mt-1">
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
