import { useState } from "react";
import { login } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const user = await login(email, password);

      console.log(user);

      if (user.role === "OFFICER") {
        navigate("/dashboard");
      } else {
        navigate("/map");
      }

    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1220] px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-lg">

        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          Login
        </h1>

        {error && (
          <p className="mb-4 rounded bg-red-500/20 p-3 text-red-400">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none focus:border-orange-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 p-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="mt-6 text-center text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-orange-500"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;