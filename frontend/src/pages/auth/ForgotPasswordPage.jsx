import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Key, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [utorid, setUtorid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setUtorid(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!utorid.trim()) {
      setError("Please enter your UTORid");
      return;
    }

    setLoading(true);

    try {
      await authAPI.requestPasswordReset(utorid);
      setSuccess(true);
    } catch (err) {
      console.error("Password reset request error:", err);
      if (err.status === 404) {
        setError("No account found with this UTORid. Please check and try again.");
      } else {
        setError(err.message || "Failed to send reset email. Please try again.");
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
                Reset Email Sent!
              </h2>

              <p className="text-gray-600 mb-6">
                If an account exists with the UTORid <span className="font-medium">{utorid}</span>, 
                we've sent a password reset link to the email address associated with that account.
              </p>

              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <strong>What to do next:</strong>
                </p>
                <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the password reset link in the email</li>
                  <li>Enter your UTORid and create a new password</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full"
                  size="lg"
                >
                  Back to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setUtorid("");
                  }}
                  className="w-full"
                >
                  Request Another Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Request Form View
  return (
    <div className="min-h-screen bg-gradient-to-br from-rewardly-light-blue via-white to-rewardly-light-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-6">
            {/* Logo and Title */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center p-3 flex-shrink-0 overflow-hidden">
                <img 
                  src={rewardlyLogo} 
                  alt="Rewardly Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="text-4xl font-bold font-heading text-rewardly-dark-navy">
                Rewardly
              </h1>
            </div>
            
            <CardTitle className="text-2xl text-center font-heading text-rewardly-dark-navy pt-2">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-center text-base">
              Enter your UTORid and we'll send you a link to reset your password
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
                  value={utorid}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent transition-all"
                  placeholder="your_utorid"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the UTORid associated with your account
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <Link
                to="/"
                className="flex items-center justify-center text-sm text-rewardly-blue hover:text-rewardly-dark-navy transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

