import { useState } from "react";
import { usersAPI } from "@/api/users";
import { Button } from "@/components/ui/button";
import { getUser } from "@/utils/auth";

const CreateUserModal = ({ onClose, onCreated }) => {
  const currentUser = getUser();
  const isSuperuser = currentUser?.role === "superuser";

  const [form, setForm] = useState({
    utorid: "",
    name: "",
    email: "",
    role: "regular",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    setErrorMsg("");
    setLoading(true);

    try {
      // 1. Create user first
      const createdUser = await usersAPI.create({
        utorid: form.utorid,
        name: form.name,
        email: form.email,
        role: "regular", // backend default
      });

      const userId = createdUser?.id || createdUser?.data?.id;
      if (!userId) {
        throw new Error("User created but no ID returned");
      }

      // 2. Apply role change
      await usersAPI.update(userId, { role: form.role });

      onCreated();
      onClose();
    } catch (err) {
      console.error("Create user error:", err);

      const errorMsg = err?.message || err?.data?.error || err?.data?.message || "Failed to create user.";
      setErrorMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create User</h2>

        {errorMsg && (
          <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded border border-red-200">
            {errorMsg}
          </p>
        )}

        <div className="mb-3">
          <label className="block text-sm mb-1">UTORid</label>
          <input
            name="utorid"
            value={form.utorid}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. jsmith01"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="John Smith"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="jsmith@mail.utoronto.ca"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
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

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
