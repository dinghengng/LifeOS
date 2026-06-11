"use client";

import { useState } from "react";
import { getDailyPrompt, getPromptsByPack, PACK_CONFIG, ALL_PROMPTS, PromptPack, Prompt } from "../../shared/prompts";

interface PromptSectionProps {
  onSelectPrompt: (prompt: Prompt) => void;
}

export default function PromptSection({ onSelectPrompt }: PromptSectionProps) {
  const dailyPrompt = getDailyPrompt();
  const [openPack, setOpenPack] = useState<PromptPack | null>(null);

  const packs = Object.keys(PACK_CONFIG) as PromptPack[];

  return (
    <div className="w-full flex flex-col gap-3 mb-4">

      {/*Daily prompt*/}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow overflow-hidden">
        <div className="px-4 pt-4 pb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-grey-500 uppercase tracking-wide">Recommended for today</span>
        </div>
        <div className="px-4 pb-4 pt-2 flex items-start justify-between gap-4">
          <p className="text-sm text-slate-700 leading-relaxed flex-1">
            {dailyPrompt.text}
          </p>
          <button
            onClick={() => onSelectPrompt(dailyPrompt)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Use
          </button>
        </div>
        <div className="px-4 pb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PACK_CONFIG[dailyPrompt.pack].bg} ${PACK_CONFIG[dailyPrompt.pack].color}`}>
             {PACK_CONFIG[dailyPrompt.pack].label}
          </span>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow overflow-hidden">
        <button
          onClick={() => setOpenPack(openPack ? null : packs[0])}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <span>Prompt Packs</span>
          <span className="text-slate-400 text-xs">{openPack ? "▲ Hide" : "▼ Browse"}</span>
        </button>

        {openPack !== null && (
          <div className="border-t border-slate-100">
            <div className="flex gap-1 px-3 pt-3 pb-2 overflow-x-auto">
              {packs.map((pack) => {
                const cfg = PACK_CONFIG[pack];
                return (
                  <button
                    key={pack}
                    onClick={() => setOpenPack(pack)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition ${
                      openPack === pack
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                     {cfg.label}
                  </button>
                );
              })}
            </div>

            {/*Prompt packs*/}
            <ul className="px-3 pb-3 flex flex-col gap-1.5">
              {getPromptsByPack(openPack).map((prompt) => (
                <li
                  key={prompt.id}
                  className="flex items-start justify-between gap-3 bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2.5 transition group"
                >
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{prompt.text}</p>
                  <button
                    onClick={() => onSelectPrompt(prompt)}
                    className="shrink-0 text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition opacity-0 group-hover:opacity-100"
                  >
                    Use
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}