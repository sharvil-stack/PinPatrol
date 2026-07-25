import Navbar from "../components/common/Navbar";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  MapPinned,
  ShieldCheck,
  Camera,
} from "lucide-react";
function Landing() {
  return (
   <div className="min-h-screen bg-[#0B1220] text-white">

      <Navbar />

      {/* Hero Section */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-8 py-24 text-center">

        <div className="rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-2 text-sm text-orange-400">
          AI Powered Community Crime Reporting
        </div>

        <h1 className="mt-8 max-w-5xl text-5xl font-extrabold leading-tight md:text-7xl">
          Smarter Crime Reporting
          <br />
          <span className="text-orange-500">
            Safer Communities.
          </span>
        </h1>

        <p className="mt-8 max-w-3xl text-lg text-slate-400">
          Report incidents instantly, upload media evidence, visualize crimes
          on an interactive map, and empower officers with AI-generated case
          summaries and semantic duplicate detection.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-5">

          <Link
            to="/signup"
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-4 font-semibold hover:bg-orange-600 transition"
          >
            Get Started
            <ArrowRight size={20} />
          </Link>

          <Link
            to="/map"
            className="rounded-xl border border-slate-700 px-8 py-4 hover:bg-slate-800 transition"
          >
            View Live Map
          </Link>

        </div>

      </section>

      {/* Features */}

      <section className="mx-auto grid max-w-7xl gap-8 px-8 pb-24 md:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">

          <BrainCircuit className="mb-5 h-10 w-10 text-orange-500" />

          <h2 className="text-xl font-bold">
            AI Analysis
          </h2>

          <p className="mt-3 text-slate-400">
            Detect duplicate incidents, identify similar reports, and generate
            concise case summaries automatically.
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">

          <Camera className="mb-5 h-10 w-10 text-orange-500" />

          <h2 className="text-xl font-bold">
            Smart Media
          </h2>

          <p className="mt-3 text-slate-400">
            Upload images or videos. AI analyzes media to help officers
            understand incidents faster.
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">

          <MapPinned className="mb-5 h-10 w-10 text-orange-500" />

          <h2 className="text-xl font-bold">
            Live Crime Map
          </h2>

          <p className="mt-3 text-slate-400">
            Explore verified incidents on an interactive map with real-time
            updates through WebSockets.
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">

          <ShieldCheck className="mb-5 h-10 w-10 text-orange-500" />

          <h2 className="text-xl font-bold">
            Officer Dashboard
          </h2>

          <p className="mt-3 text-slate-400">
            Review pending reports, verify incidents, monitor statistics, and
            manage investigations efficiently.
          </p>

        </div>

      </section>


      <footer className="border-t border-slate-800 py-8 text-center text-slate-500">
        © 2026 PatrolPin • AI Powered Crime Reporting Platform
      </footer>

    </div>
  );
}

export default Landing;