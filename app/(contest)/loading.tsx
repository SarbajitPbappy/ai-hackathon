import { Skeleton } from "@/components/ui/skeleton";

export default function ContestLoading() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
