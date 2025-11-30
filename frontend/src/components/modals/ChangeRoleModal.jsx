import { useState } from "react";
import { usersAPI } from "@/api/users";
import { Button } from "@/components/ui/button";

const ChangeRoleModal = ({ user, onClose, onUpdated }) => {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await usersAPI.update(user.id, { role });
      onUpdated(); // reload parent page
      onClose();
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Change User Role</h2>

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
              <option value="manager">Manager</option>
              <option value="superuser">Superuser</option>
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
