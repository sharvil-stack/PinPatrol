import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const user = await signup(email, password);
      navigate(user.role === "OFFICER" ? "/dashboard" : "/map");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1220] px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-lg">
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          Create your account
        </h1>

        {error && (
          <p className="mb-4 rounded bg-red-500/20 p-3 text-red-400">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm password"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 p-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;