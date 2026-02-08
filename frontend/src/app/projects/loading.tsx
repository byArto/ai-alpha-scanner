export default function ProjectsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-elevated/40 rounded animate-pulse" />
          <div className="h-4 w-32 bg-elevated/20 rounded animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-elevated/30 rounded animate-pulse" />
      </div>

      <div className="cyber-card p-4">
        <div className="h-4 w-24 bg-elevated/30 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 bg-elevated/20 rounded animate-pulse" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="cyber-card p-4 animate-pulse">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-elevated/40 rounded" />
                <div className="h-3 w-1/2 bg-elevated/20 rounded" />
              </div>
              <div className="w-14 h-14 bg-elevated/30 rounded-md" />
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="h-3 w-full bg-elevated/20 rounded" />
              <div className="h-3 w-4/5 bg-elevated/20 rounded" />
            </div>
            <div className="h-1 w-full bg-elevated/20 rounded-full mb-3" />
            <div className="h-px bg-elevated/20 mb-2.5" />
            <div className="flex gap-1.5">
              <div className="h-6 w-6 bg-elevated/20 rounded" />
              <div className="h-6 w-6 bg-elevated/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
