export function TechStack() {
  const technologies = [
    { name: "Next.js 15", category: "Framework" },
    { name: "OpenAI", category: "Embeddings" },
    { name: "Pinecone", category: "Vector DB" },
    { name: "Vercel KV (Redis)", category: "Cache" },
    { name: "TypeScript", category: "Language" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Jest", category: "Testing" },
    { name: "Vercel", category: "Deployment" },
  ];

  return (
    <div className="mt-12">
      <h3 className="mb-6 text-center text-lg font-semibold text-gray-700">
        Built with Modern Tech Stack
      </h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {technologies.map((tech, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="text-sm font-semibold text-gray-900">
              {tech.name}
            </div>
            <div className="text-xs text-gray-500">{tech.category}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
