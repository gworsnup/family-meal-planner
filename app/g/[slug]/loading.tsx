export default function WorkspaceSectionLoading() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] px-6 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-4">
        <div className="h-12 w-full rounded-2xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 rounded-2xl bg-slate-100" />
          <div className="h-32 rounded-2xl bg-slate-100" />
          <div className="h-32 rounded-2xl bg-slate-100" />
        </div>
        <div className="h-[55vh] rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
