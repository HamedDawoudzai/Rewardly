import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authAPI } from "@/api/api";
import rewardlyLogo from "@/assets/rewardly_cropped.png";
import { Key, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

const ResetPasswordPage = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    utorid: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (password.length > 20) {
      return "Password must be at most 20 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate UTORid
    if (!formData.utorid.trim()) {
      setError("UTORid is required");
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(
        resetToken,
        formData.utorid,
        formData.password
      );
      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.status === 404) {
        setError("Invalid or expired reset link. Please request a new one.");
      } else if (err.status === 401) {
        setError("The UTORid does not match this reset link.");
      } else {
        setError(err.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Success View
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rewardly-light-blue via-white to-rewardly-light-blue flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Password Set Successfully!
              </h2>

              <p className="text-gray-600 mb-6">
                Your account is now active. You can log in with your UTORid and
                new password.
              </p>

              <Button
                onClick={() => navigate("/")}
                className="w-full"
                size="lg"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="min-h-screen bg-gradient-to-br from-rewardly-light-blue via-white to-rewardly-light-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-4">
            {/* Logo and Title */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                <img
                  src={rewardlyLogo}
                  alt="Rewardly Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="text-3xl font-bold font-heading text-rewardly-dark-navy">
                Rewardly
              </h1>
            </div>

            <div className="flex justify-center">
              <div className="w-12 h-12 bg-rewardly-light-blue rounded-full flex items-center justify-center">
                <Key className="h-6 w-6 text-rewardly-blue" />
              </div>
            </div>

            <CardTitle className="text-2xl text-center font-heading text-rewardly-dark-navy">
              Set Your Password
            </CardTitle>
            <CardDescription className="text-center text-base">
              Create a password to activate your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="utorid"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  UTORid
                </label>
                <input
                  id="utorid"
                  name="utorid"
                  type="text"
                  required
                  value={formData.utorid}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                  placeholder="your_utorid"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the UTORid that was used to create your account
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">Password requirements:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>8-20 characters long</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character (!@#$%^&* etc.)</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Setting Password..." : "Set Password & Activate"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-rewardly-blue hover:text-rewardly-dark-navy transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

