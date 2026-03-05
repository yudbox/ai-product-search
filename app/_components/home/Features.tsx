import { FeatureCard } from "@/components/ui/FeatureCard";

const features = [
  {
    icon: "🤖",
    title: "Semantic Search",
    description: "AI understands meaning, not just keywords. Search naturally.",
  },
  {
    icon: "👟",
    title: "50+ Products",
    description: "Curated collection of athletic shoes from top brands.",
  },
  {
    icon: "⚡",
    title: "Smart Filters",
    description: "Filter by price, brand, category, and more.",
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
