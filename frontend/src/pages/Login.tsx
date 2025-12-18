import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
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
        <div className="hidden md:flex flex-col items-center justify-center bg-linear-to-br from-purple-700 via-indigo-700 to-blue-700 text-white p-10 relative">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-wide">Welcome</h1>
            <p className="text-white/80 mt-2">Your journey begins here</p>
          </div>

          <div className="w-64 h-64 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl">
            <svg
              width="130"
              height="130"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20l9-5-9-5-9 5 9 5z" />
              <path d="M12 12l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>

          <p className="mt-10 text-sm text-white/60">© {year} ModernUI Co.</p>
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
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
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
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
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
              <a href="#" className="text-purple-600 font-medium hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition shadow-md"
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
