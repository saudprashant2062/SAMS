import { SkeletonRect } from "./Skeleton";

const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div
      className="rounded-xl shadow-sm overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b space-y-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex justify-between items-center">
            <SkeletonRect className="h-6 w-32" />
            <div className="flex gap-2">
                <SkeletonRect className="h-8 w-20" />
                <SkeletonRect className="h-8 w-20" />
            </div>
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="p-4 space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            {[...Array(columns)].map((_, j) => (
              <SkeletonRect 
                key={j} 
                className="h-4" 
                style={{ width: `${Math.floor(Math.random() * 40 + 20)}%` }} // Random width for variety
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
