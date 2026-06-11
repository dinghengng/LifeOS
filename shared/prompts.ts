export interface Prompt {
  id: string;
  text: string;
  pack: PromptPack;
}

export type PromptPack = "gratitude" | "reflection" | "fitness" | "mindfulness" | "fun";

export const PACK_CONFIG: Record<PromptPack, { label: string; color: string; bg: string }> = {
  gratitude:   { label: "Gratitude", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200"   },
  reflection:  { label: "Reflection", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  fitness:     { label: "Fitness", color: "text-green-700",  bg: "bg-green-50 border-green-200"   },
  mindfulness: { label: "Mindfulness", color: "text-teal-700",   bg: "bg-teal-50 border-teal-200"     },
  fun:         { label: "Fun", color: "text-pink-700",   bg: "bg-pink-50 border-pink-200"     },
};

export const ALL_PROMPTS: Prompt[] = [
  // Gratitude
  { id: "g1", pack: "gratitude", text: "What's one small thing that made you smile today?" },
  { id: "g2", pack: "gratitude", text: "Who is someone you haven't thanked recently?" },
  { id: "g3", pack: "gratitude", text: "What's a recent challenge you're thankful to have overcome?" },
  { id: "g4", pack: "gratitude", text: "Describe a recent moment where you felt genuinely at peace." },
  { id: "g5", pack: "gratitude", text: "What's something about your health you're grateful for?" },
  { id: "g6", pack: "gratitude", text: "What ordinary part of your daily routine are you grateful for?" },
  { id: "g7", pack: "gratitude", text: "What's a skill you have that you are grateful to possess?" },
  { id: "g8", pack: "gratitude", text: "What made today different from yesterday in a good way?" },

  // Reflection
  { id: "r1", pack: "reflection", text: "What's one decision you made this week you'd like to revisit?" },
  { id: "r2", pack: "reflection", text: "What emotion have you been carrying around most this week?" },
  { id: "r3", pack: "reflection", text: "What lesson did you learn this week that you can use going foward?" },
  { id: "r4", pack: "reflection", text: "What's something you've been avoiding lately?" },
  { id: "r5", pack: "reflection", text: "What are you most proud of accomplishing lately" },
  { id: "r6", pack: "reflection", text: "What belief about yourself is being challenged lately?" },
  { id: "r7", pack: "reflection", text: "What does your ideal version of tomorrow look like?" },
  { id: "r8", pack: "reflection", text: "What's a pattern in your behaviour you've noticed recently?" },

  // Fitness
  { id: "f1", pack: "fitness", text: "How did your body feel during and after your last workout?" },
  { id: "f2", pack: "fitness", text: "What's one fitness goal you're proud of making progress on?" },
  { id: "f3", pack: "fitness", text: "What's getting in the way of your workout goals lately?" },
  { id: "f4", pack: "fitness", text: "How has your energy level been this week?" },
  { id: "f5", pack: "fitness", text: "Have you been giving your body enough rest lately?" },
  { id: "f6", pack: "fitness", text: "What's your reason for staying active?" },
  { id: "f7", pack: "fitness", text: "What's one thing you'd like to try in your fitness routine?" },
  { id: "f8", pack: "fitness", text: "How does exercise affect your mood and mental state?" },

  // Mindfulness
  { id: "m1", pack: "mindfulness", text: "Sit quietly for 60 seconds, then write about your thoughts, sounds, sensations." },
  { id: "m2", pack: "mindfulness", text: "What are you holding onto right now that you could let go of?" },
  { id: "m3", pack: "mindfulness", text: "What is your breath like right now?" },
  { id: "m4", pack: "mindfulness", text: "What does your mind keep returning to today?" },
  { id: "m5", pack: "mindfulness", text: "What action brings you into the present moment?" },
  { id: "m6", pack: "mindfulness", text: "What would it feel like to give yourself full permission to rest today?" },
  { id: "m7", pack: "mindfulness", text: "What's one thing you did on autopilot today that you'd like to do more consciously?" },
  { id: "m8", pack: "mindfulness", text: "What does your inner voice sound like right now?" },

  // Fun
  { id: "fn1", pack: "fun", text: "What is your go-to funny story at parties?" },
  { id: "fn2", pack: "fun", text: "What's the most random thing that made you laugh recently?" },
  { id: "fn3", pack: "fun", text: "If you could have any superpower, what would it be?" },
  { id: "fn4", pack: "fun", text: "Describe your day as if you were narrating a nature documentary." },
  { id: "fn5", pack: "fun", text: "What song perfectly captures your mood right now?" },
  { id: "fn6", pack: "fun", text: "If your pet kept a diary, they'd say this about you." },
  { id: "fn7", pack: "fun", text: "What's a totally ridiculous goal you secretly wish you could pursue?" },
  { id: "fn8", pack: "fun", text: "What is your favourite conspiracy theory?" },
];

// Daily prompt that changes everyday
export function getDailyPrompt(): Prompt {
  const today = new Date().toDateString(); 
  const hash = today.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return ALL_PROMPTS[hash % ALL_PROMPTS.length];
}

export function getPromptsByPack(pack: PromptPack): Prompt[] {
  return ALL_PROMPTS.filter((p) => p.pack === pack);
}