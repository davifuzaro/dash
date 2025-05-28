import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function MetricCardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className={cn(height, "w-full rounded-lg")} />
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-12" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-14" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-20" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-12" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="ml-4 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { Skeleton, MetricCardSkeleton, ChartSkeleton, TableSkeleton };
