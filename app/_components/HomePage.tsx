"use client";

import { SearchBar } from "@/components/SearchBar";
import { Header } from "./home/Header";
import { HeroSection } from "./home/HeroSection";
import { ExampleQueries } from "./home/ExampleQueries";
import { Features } from "./home/Features";
import { TechStack } from "./home/TechStack";

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <HeroSection />
        <SearchBar autoFocus />
        <ExampleQueries />
        <Features />
        <TechStack />
      </main>
    </div>
  );
}
