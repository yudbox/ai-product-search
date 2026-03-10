import { FeatureCard } from "@/components/ui/FeatureCard";

const features = [
  {
    icon: "🤖",
    title: "Semantic Understanding",
    description:
      "AI understands meaning, not just keywords. Search naturally with OpenAI embeddings and vector similarity.",
  },
  {
    icon: "⚡",
    title: "2-Tier Redis Cache",
    description:
      "78% cache hit rate with adaptive TTL (HOT/WARM/COLD). 45ms avg response vs 280ms uncached. 85% cost reduction.",
  },
  {
    icon: "🔒",
    title: "Production Grade",
    description:
      "94% test coverage (381 tests), rate limiting, cost monitoring. Clean Architecture with SOLID principles.",
  },
];

export function Features() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  );
}
