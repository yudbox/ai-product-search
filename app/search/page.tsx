import { Suspense } from "react";
import { SearchPage } from "./_components/SearchPage";

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </header>
    </div>
  );
}

export default function SearchPageRoute() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPage />
    </Suspense>
  );
}
