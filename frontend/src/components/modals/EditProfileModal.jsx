import { useState } from "react";
import { Button } from "@/components/ui/button";
import { userAPI } from "@/api/api";
import { User } from "lucide-react";

const EditProfileModal = ({ user, onClose, onUpdated }) => {
  // Normalize name in case schema changes in future
  const getFullName = () => {
    if (typeof user.name === "string") return user.name;

    if (typeof user.name === "object" && user.name !== null) {
      const first = user.name.first || "";
      const last = user.name.last || "";
      return `${first} ${last}`.trim();
    }

    return "";
  };

  const [name, setName] = useState(getFullName());
  const [email, setEmail] = useState(user.email || "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      // Use /users/me endpoint for editing own profile (no hierarchy check)
      await userAPI.updateProfile({ name, email });

      onUpdated(); // reload data
      onClose();   // close modal
    } catch (err) {
      console.error("Failed to update profile:", err);

      const errorMsg = err?.message || err?.data?.error || err?.data?.message || "Failed to update profile.";
      setErrorMsg(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <User className="h-5 w-5" />
          Edit Profile
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
