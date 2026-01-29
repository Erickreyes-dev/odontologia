import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SkeletonTable() {
  return (
    <div className="space-y-4 p-4">
      {/* Card informativo en skeleton */}
      <div className="w-full my-4">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 p-4 md:p-6 border rounded">
          <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40 md:w-64" />
            <Skeleton className="h-4 w-32 md:w-48" />
          </div>
        </div>
      </div>
      {/* Desktop skeleton */}
      <div className="hidden sm:block border rounded">
        <Skeleton className="h-12 w-full mb-2" />
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(5)].map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(5)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile skeleton: cards */}
      <div className="block sm:hidden space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg shadow p-4 flex gap-4 items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}