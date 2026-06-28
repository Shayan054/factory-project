import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formToJSON } from "../utils/form";
import logo from "../assets/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const year = new Date().getFullYear();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Convert form values to a JSON object so the API gets JSON payloads
      const payload = formToJSON(e.currentTarget);

      // Prefer form values if present, otherwise fall back to local state
      const emailToUse = payload.email ?? email;
      const passwordToUse = payload.password ?? password;

      // Normalize remember checkbox if submitted via form
      if (typeof payload.remember !== 'undefined') {
        setRemember(payload.remember === true || payload.remember === 'true' || payload.remember === 'on');
      }

      await login(emailToUse, passwordToUse);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 shadow-2xl rounded-3xl overflow-hidden bg-white">
        {/* Left Graphic Section */}
        <div className="hidden md:flex flex-col items-center justify-center bg-linear-to-br from-[#0ea5a4] via-[#14b8a6] to-[#0f766e] text-white p-10 relative">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-wide">Welcome</h1>
          </div>

          <div className="w-64 h-64 flex items-center justify-center">
  <div className="bg-white rounded-full p-6 shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-gray-100 transform -translate-y-2">
    <img
      src={logo}
      alt="Asghar Block Factory Logo"
      className="w-44 h-44 rounded-full object-cover"
    />
  </div>
</div>

          <p className="mt-10 text-sm text-white/60">© {year} Asghar Block Factory. All rights reserved.</p>
        </div>

        {/* Right Login Form */}
        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Login to Your Account</h2>
          <p className="text-gray-500 text-center mb-8">Access your dashboard and manage everything</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a href="#" className="text-[var(--accent-color)] font-medium hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition shadow-md"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Factory Management System
          </p>
        </div>
      </div>
    </div>
  );
}
