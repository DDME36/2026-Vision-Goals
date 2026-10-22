export function DashboardSkeleton() {
  return (
    <div className="app-backdrop min-h-dvh" aria-busy="true" aria-label="กำลังโหลด">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="skeleton size-8 rounded-[9px]" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="skeleton size-8 rounded-full" />
      </div>
      <div className="container pt-10">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton mt-3 h-12 w-72 rounded-xl" />
        <div className="skeleton mt-4 h-5 w-64 rounded" />
        <div className="skeleton mt-8 h-32 rounded-2xl" />
        <GoalGridSkeleton />
      </div>
    </div>
  )
}

export function GoalGridSkeleton() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="surface h-32 p-5" style={{ opacity: 1 - i * 0.12 }}>
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton mt-4 h-5 w-3/4 rounded" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}
