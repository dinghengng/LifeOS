const CHALLENGES = [
  {
    id: "task_sprint",
    title: "Task Master",
    description: "Complete tasks this week",
    period: "weekly",
    source: "tasks", // which feature to read from
    tiers: { bronze: 2, silver: 4, gold: 7 },
  },
  {
    id: "habit_rhythm",
    title: "Habitualist",
    description: "Log habit check-ins this week",
    period: "weekly",
    source: "habit_logs",
    tiers: { bronze: 2, silver: 4, gold: 7 },
  },
  {
    id: "reflect_reset",
    title: "Mindful Thinker",
    description: "Write journal entries this week",
    period: "weekly",
    source: "journal_entries",
    tiers: { bronze: 1, silver: 2, gold: 3 },
  },
  {
    id: "mood_checkin",
    title: "Mood Mapper",
    description: "Log your mood this week",
    period: "weekly",
    source: "mood_logs",
    tiers: { bronze: 2, silver: 4, gold: 6 },
  },
  {
    id: "fuel_your_week",
    title: "Fuel Inspector",
    description: "Log meals this week",
    period: "weekly",
    source: "meal_logs",
    tiers: { bronze: 2, silver: 4, gold: 7 },
  },
];

function getChallengeById(id) {
  return CHALLENGES.find((c) => c.id === id) || null;
}

module.exports = { CHALLENGES, getChallengeById };