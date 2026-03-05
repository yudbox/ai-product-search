"use client";

import Link from "next/link";

const exampleQueries = [
  "comfortable running shoes",
  "basketball shoes under $150",
  "waterproof hiking boots",
  "lightweight training shoes",
  "casual sneakers for daily wear",
];

export function ExampleQueries() {
  return (
    <div className="mb-12">
      <h3 className="mb-4 text-center text-sm font-medium text-gray-500">
        💡 Try these searches:
      </h3>
      <div className="flex flex-wrap justify-center gap-2">
        {exampleQueries.map((query, idx) => (
          <Link
            key={idx}
            href={`/search?q=${encodeURIComponent(query)}`}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
          >
            {query}
          </Link>
        ))}
      </div>
    </div>
  );
}
