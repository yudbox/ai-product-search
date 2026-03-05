import { Product, Gender } from "@/lib/types";

export const mockNikeShoe: Product = {
  id: "1",
  name: "Nike Air Max 270",
  description: "Comfortable running shoes with air cushioning",
  price: 120,
  image: "https://example.com/nike-air-max.jpg",
  brand: "Nike",
  category: "Running Shoes",
  color: "Black",
  sizes: [8, 9, 10, 11],
  inStock: true,
  rating: 4.5,
  features: ["Air cushioning", "Breathable mesh", "Durable sole"],
  gender: Gender.Men,
};

export const mockAdidasShoe: Product = {
  id: "2",
  name: "Adidas Ultraboost 22",
  description: "Premium training shoes with boost technology",
  price: 160,
  image: "https://example.com/adidas-ultraboost.jpg",
  brand: "Adidas",
  category: "Training Shoes",
  color: "White",
  sizes: [9, 10, 11, 12],
  inStock: true,
  rating: 4.8,
  features: ["Boost cushioning", "Lightweight", "Responsive"],
  gender: Gender.Women,
};

export const mockPumaShoe: Product = {
  id: "3",
  name: "Puma RS-X3",
  description: "Stylish casual sneakers for everyday wear",
  price: 95,
  image: "https://example.com/puma-rsx3.jpg",
  brand: "Puma",
  category: "Casual Sneakers",
  color: "Blue",
  sizes: [7, 8, 9, 10],
  inStock: true,
  rating: 4.2,
  features: ["Retro design", "Comfortable", "Versatile"],
  gender: Gender.Unisex,
};

export const mockReebokShoe: Product = {
  id: "4",
  name: "Reebok Nano X3",
  description: "CrossFit training shoes built for intense workouts",
  price: 140,
  image: "https://example.com/reebok-nano.jpg",
  brand: "Reebok",
  category: "Training Shoes",
  color: "Red",
  sizes: [8, 9, 10, 11, 12],
  inStock: true,
  rating: 4.6,
  features: ["Stable platform", "Durable", "Multi-directional"],
  gender: Gender.Men,
};

export const mockNewBalanceShoe: Product = {
  id: "5",
  name: "New Balance 990v5",
  description: "Classic running shoes with ENCAP cushioning",
  price: 175,
  image: "https://example.com/new-balance-990.jpg",
  brand: "New Balance",
  category: "Running Shoes",
  color: "Grey",
  sizes: [9, 10, 11],
  inStock: false,
  rating: 4.7,
  features: ["ENCAP cushioning", "Made in USA", "Premium quality"],
  gender: Gender.Unisex,
};

export const allMockProducts: Product[] = [
  mockNikeShoe,
  mockAdidasShoe,
  mockPumaShoe,
  mockReebokShoe,
  mockNewBalanceShoe,
];

export const mockSearchResults = {
  success: true,
  query: "running shoes",
  count: 2,
  totalBeforeFilters: 2,
  products: [mockNikeShoe, mockAdidasShoe],
  explanation: "Found 2 products matching your search for running shoes.",
  performance: {
    embedding: "5ms",
    search: "12ms",
    total: "17ms",
  },
};
