function StatCard({ icon: Icon, label, value, accent = "text-orange-500" }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        {Icon && <Icon className={`h-5 w-5 ${accent}`} />}
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default StatCard;