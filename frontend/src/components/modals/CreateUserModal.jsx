import { useState } from "react";
import { usersAPI } from "@/api/users";
import { Button } from "@/components/ui/button";
import { getUser } from "@/utils/auth";
import { UserPlus } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create User
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm mb-4">
            {errorMsg}
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">UTORid</label>
          <input
            name="utorid"
            value={form.utorid}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
            placeholder="e.g. jsmith01"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
            placeholder="John Smith"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
            placeholder="jsmith@mail.utoronto.ca"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
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
