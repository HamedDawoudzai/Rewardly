import { useState } from "react";
import { usersAPI } from "@/api/users";
import { Button } from "@/components/ui/button";
import { getUser } from "@/utils/auth";

const ChangeRoleModal = ({ user, onClose, onUpdated }) => {
  const currentUser = getUser();
  const isSuperuser = currentUser?.role === "superuser";

  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Change User Role</h2>

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
              disabled={saving}
            >
              <option value="regular">Regular</option>
              <option value="cashier">Cashier</option>
              {isSuperuser && (
                <>
                  <option value="manager">Manager</option>
                  <option value="superuser">Superuser</option>
                </>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Role"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
