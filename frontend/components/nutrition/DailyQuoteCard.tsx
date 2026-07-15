"use client";

import { Lightbulb } from "lucide-react";

const NUTRITION_QUOTES = [
  "Eat for the body you want, not the body you have.",
  "You can't out-train a bad diet.",
  "Food is fuel, not therapy.",
  "Strive for progress, not perfection.",
  "Your diet is a bank account. Good food choices are good investments.",
  "A year from now, you will wish you had started today.",
  "It's not a short-term diet. It's a long-term lifestyle change.",
  "Focus on how far you've come, not how far you have to go.",
  "Consistency beats intensity every single time.",
  "Your body is a reflection of your effort.",
  "Nutrition is the foundation of wellness.",
  "Small changes today, big results tomorrow.",
  "Fuel your body like you love it.",
  "Healthy habits create healthy lives.",
  "Every meal is a chance to nourish your body.",
  "Good nutrition is self-respect in action.",
  "What you eat today shapes your tomorrow.",
  "Discipline is choosing what you want most over what you want now.",
  "Strong bodies are built in the kitchen.",
  "Make food your ally, not your enemy.",
  "The best project you'll ever work on is yourself.",
  "Healthy eating is a form of self-care.",
  "Your future self is watching your choices today.",
  "Success starts with one healthy decision.",
  "A balanced diet fuels a balanced life.",
  "Take care of your body; it's the only place you have to live.",
  "Every healthy choice counts.",
  "Don't count calories, make calories count.",
  "Eat with purpose, live with energy.",
  "Wellness begins with what's on your plate.",
  "Healthy eating isn't a punishment, it's a privilege.",
  "Nourish your body and your mind will follow.",
  "Small improvements compound into big transformations.",
  "Choose foods that love you back.",
  "The secret ingredient is consistency.",
  "Good nutrition is the ultimate performance enhancer.",
  "Healthy eating is an investment, not an expense.",
  "Eat better, feel better, perform better.",
  "Your habits shape your health.",
  "Every bite is a vote for your future.",
  "The goal is progress, not perfection.",
  "Healthy choices become healthy habits.",
  "Feed your goals, not your cravings.",
  "Energy starts with nutrition.",
  "Results come from repeated healthy actions.",
  "Your body keeps score of your choices.",
  "Eat smart today, thrive tomorrow.",
  "Wellness is built one meal at a time.",
  "Healthy living starts with healthy eating.",
  "The strongest form of self-love is taking care of your health.",
]; //Quotes that randomly generate

function getDailyQuote() {
  const date = new Date();
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return NUTRITION_QUOTES[dayOfYear % NUTRITION_QUOTES.length];
}

export default function DailyQuoteCard() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto 1.5rem", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem", textAlign: "center" }}>
            Quote of the Day
        </span>
        <div style={{ position: "relative", padding: "0 1.5rem", textAlign: "center" }}>
            <span style={{ position: "absolute", top: -25, left: -15, fontSize: 64, color: "#e2e8f0", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            &ldquo;
            </span>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, letterSpacing: "-0.5px", position: "relative", zIndex: 1 }}>
            {getDailyQuote()}
            </p>
            <span style={{ position: "absolute", bottom: -45, right: -15, fontSize: 64, color: "#e2e8f0", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            &rdquo;
            </span>
        </div>
    </div>
  );
}