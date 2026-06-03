"use client";

import { useState } from "react";
import { Tag, TagsResponse } from "../../shared/types";
import { createCustomTag } from "../../shared/api";

const tagKey = (tag: Tag) => `${tag.type}:${tag.id}`; //Unique keys to handle collisions

interface TagSelectorProps {
  tags: TagsResponse;
  selectedTagKeys: string[];     
  onToggle: (tag: Tag) => void;
  onCustomTagCreated: (tag: Tag) => void;
}

export default function TagSelector({
  tags,
  selectedTagKeys,
  onToggle,
  onCustomTagCreated,
}: TagSelectorProps) {
  const [otherInput, setOtherInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateCustomTag = async () => {
    const trimmed = otherInput.trim();
    if (!trimmed) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const newTag = await createCustomTag(trimmed);
      setOtherInput("");
      onCustomTagCreated(newTag);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Could not create tag.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleCreateCustomTag(); }
  };

  return (
    <div className="flex flex-col gap-3">

      {/*Static tags*/}
      <div className="flex flex-wrap gap-2 justify-center">
        {tags.system.map((tag) => (
          <button
            key={tagKey(tag)}
            onClick={() => onToggle(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
              selectedTagKeys.includes(tagKey(tag))
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/*Custom tags*/}
      {tags.custom.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-xs text-slate-400 w-full text-center">Your tags</span>
          {tags.custom.map((tag) => (
            <button
              key={tagKey(tag)}
              onClick={() => onToggle(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                selectedTagKeys.includes(tagKey(tag))
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/*Other input*/}
      <div className="flex gap-2 items-center justify-center mt-1">
        <input
          type="text"
          value={otherInput}
          onChange={(e) => setOtherInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Other (e.g. travel)"
          maxLength={50}
          className="text-xs border border-slate-200 rounded-full px-3 py-1.5 w-40 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 text-slate-700 placeholder:text-slate-400"
        />
        <button
          onClick={handleCreateCustomTag}
          disabled={isCreating || !otherInput.trim()}
          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
            isCreating || !otherInput.trim()
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isCreating ? "Adding..." : "+ Add"}
        </button>
      </div>

      {createError && (
        <p className="text-xs text-red-500 text-center">{createError}</p>
      )}
    </div>
  );
}