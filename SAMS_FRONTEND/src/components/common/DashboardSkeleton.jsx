import { SkeletonRect, SkeletonCircle } from "./Skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <SkeletonRect className="h-8 w-48" />
        <SkeletonRect className="h-4 w-64" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 shadow-sm"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <SkeletonRect className="h-4 w-24" />
                <SkeletonRect className="h-8 w-16" />
              </div>
              <SkeletonRect className="w-12 h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <SkeletonRect className="h-6 w-32 mb-4" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonRect key={i} className="h-9 w-32 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <SkeletonRect className="h-6 w-32" />
          <SkeletonRect className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <SkeletonCircle className="w-8 h-8 shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonRect className="h-4 w-3/4" />
                <SkeletonRect className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
