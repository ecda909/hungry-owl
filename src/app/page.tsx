"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ChefHat, Clock, ShoppingCart, Sparkles, Utensils, Refrigerator } from "lucide-react";

const features = [
  {
    icon: Refrigerator,
    title: "Smart Inventory",
    description: "Track what's in your fridge with expiration alerts and organized categories.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Recipes",
    description: "Get personalized recipe suggestions based on what you have available.",
  },
  {
    icon: Clock,
    title: "Time-Based Cooking",
    description: "Find recipes that fit your schedule, from 15-minute meals to slow cookers.",
  },
  {
    icon: ShoppingCart,
    title: "Smart Shopping Lists",
    description: "Auto-generated lists organized by store section for efficient shopping.",
  },
  {
    icon: ChefHat,
    title: "Skill Matching",
    description: "Recipes matched to your cooking skill level, from beginner to advanced.",
  },
  {
    icon: Utensils,
    title: "Kitchen-Aware",
    description: "Recommendations based on the cookware and appliances you actually have.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-4xl">🦉</span>
            <span className="text-2xl font-bold text-gray-900">Hungry Owl</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </SignedIn>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <section className="py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Cook smarter with{" "}
              <span className="text-orange-500">what you have</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Hungry Owl transforms your fridge contents into delicious recipes.
              Track your inventory, get personalized suggestions, and never waste food again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <Link href="/sign-up">
                  <Button size="xl" className="w-full sm:w-auto">
                    Start Cooking Smarter
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="xl" className="w-full sm:w-auto">
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12"
          >
            Everything you need to cook confidently
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 hover:shadow-md hover:border-orange-200 transition-all"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-orange-500 rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your kitchen?
            </h2>
            <p className="text-lg text-orange-100 mb-8 max-w-xl mx-auto">
              Join thousands of home cooks who are saving money, reducing waste,
              and discovering new recipes every day.
            </p>
            <SignedOut>
              <Link href="/sign-up">
                <Button size="xl" variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                  Get Started Free
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="xl" variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                  Go to Dashboard
                </Button>
              </Link>
            </SignedIn>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-orange-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦉</span>
            <span className="font-semibold text-gray-900">Hungry Owl</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Hungry Owl. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
