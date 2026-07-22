import { Shield, MapPinned } from "lucide-react";import { Link } from "react-router-dom";
function Navbar() {
  return (
     <nav className="sticky top-0 z-50 border-b border-slate-800 bg-[#0B1220]/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-orange-500" />

          <h1 className="text-2xl font-bold">
            Patrol<span className="text-orange-500">Pin</span>
          </h1>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 text-slate-300 md:flex">
          <Link to="/" className="hover:text-orange-400 transition">
            Home
          </Link>

          <Link to="/map" className="hover:text-orange-400 transition flex items-center gap-2">
            <MapPinned size={18} />
            Live Map
          </Link>

          <Link to="/dashboard" className="hover:text-orange-400 transition">
            Dashboard
          </Link>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-slate-700 px-5 py-2 hover:bg-slate-800 transition"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="rounded-xl bg-orange-500 px-5 py-2 font-semibold hover:bg-orange-600 transition"
          >
            Sign Up
          </Link>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;