import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface BulletinListSkeletonProps {
  viewMode: "table" | "list";
}

export function BulletinListSkeleton({ viewMode }: BulletinListSkeletonProps) {
  if (viewMode === "table") {
    return (
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium text-xs border-b">
            <tr>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y relative">
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-12" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-8" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-8" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="h-5 w-20 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm bg-card"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground border-y border-dashed border-gray-300 py-2 mt-2">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
