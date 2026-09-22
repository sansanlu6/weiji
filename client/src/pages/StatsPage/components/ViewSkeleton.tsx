interface ViewSkeletonProps {
  rows?: number;
}

const ViewSkeleton: React.FC<ViewSkeletonProps> = ({ rows = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="paper-card p-6 h-[280px] animate-pulse"
      >
        <div className="h-5 w-28 bg-muted rounded-full mb-4" />
        <div className="h-[200px] bg-muted rounded-2xl" />
      </div>
    ))}
  </div>
);

export default ViewSkeleton;
