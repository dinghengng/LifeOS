"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { createJournalEntry } from "../../shared/api";
import { CreateJournalEntryPayload, MoodLog, MoodLevel } from "../../shared/types";

const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄",
};

interface JournalEditorProps {
  onSaved: () => void;
  moodLogs?: MoodLog[];
  defaultMoodLogId?: number | null;
  onCancel?: () => void;
  compact?: boolean;
  promptText?: string | null;
}

export default function JournalEditor({
  onSaved,
  moodLogs = [],
  defaultMoodLogId = null,
  onCancel,
  compact = false,
  promptText = null,
}: JournalEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [hasContent, setHasContent] = useState(false);
  const [linkedMoodLogId, setLinkedMoodLogId] = useState<number | null>(defaultMoodLogId);
  const [, forceUpdate] = useState(0);
  const [title, setTitle] = useState("");
  const [isPromptLocked, setIsPromptLocked] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }, // H1, H2, H3
        bulletList: {},
        orderedList: {},
        listItem: {},
      }),
      Placeholder.configure({
        placeholder: "What's on your mind today ...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3 text-slate-800",
      },
    },
    onUpdate: ({ editor }) => {
      setHasContent(!editor.isEmpty);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate((n) => n + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  useEffect(() => {
    if (promptText) {
      setTitle(promptText);
      setIsPromptLocked(true);
    }
  }, [promptText]);

  const handleSave = async () => {
    if (!editor || !hasContent) return;
    setIsSubmitting(true);
    setError(null);

    const payload: CreateJournalEntryPayload = {
      content: editor.getHTML(), //convert to html string
      mood_log_id: linkedMoodLogId ?? undefined,
      title: title.trim() || undefined,
    };

    try {
      await createJournalEntry(payload);
      editor.commands.clearContent();
      setHasContent(false);
      setIsExpanded(!compact);
      setLinkedMoodLogId(defaultMoodLogId);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    editor?.commands.clearContent();
    setIsExpanded(!compact);
    setLinkedMoodLogId(defaultMoodLogId);
    setTitle("");
    setIsPromptLocked(false);
    setError(null);
    onCancel?.();
  };

  const formatLogOption = (log: MoodLog) => {
    const emoji = MOOD_EMOJI[log.moodLevel];
    const date = new Date(log.loggedAt).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    return `${emoji} ${date}`;
  };

  return (
    <div className={compact ? "w-full" : "bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 w-full max-w-3xl overflow-hidden"}>

      {/*Toolbar*/}
      {isExpanded && editor && (
        <div className="flex gap-1 px-3 pt-3 pb-1 border-b border-slate-100 flex-wrap">
          {[
            {
              label: <span className="font-bold">B</span>,
              action: () => editor.chain().focus().toggleBold().run(),
              format: "bold",
            },
            {
              label: <span className="italic">I</span>,
              action: () => editor.chain().focus().toggleItalic().run(),
              format: "italic",
            },
            {
              label: <span className="line-through">S</span>,
              action: () => editor.chain().focus().toggleStrike().run(),
              format: "strike",
            },
            {
              label: <span className="font-bold text-[11px]">H1</span>,
              action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
              format: "heading", formatAttrs: { level: 1 },
            },
            {
              label: <span className="font-bold text-[11px]">H2</span>,
              action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
              format: "heading", formatAttrs: { level: 2 },
            },
            {
              label: <span className="font-bold text-[11px]">H3</span>,
              action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
              format: "heading", formatAttrs: { level: 3 },
            },
            {
              label: (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="3" cy="6" r="2"/><rect x="7" y="5" width="14" height="2" rx="1"/>
                  <circle cx="3" cy="12" r="2"/><rect x="7" y="11" width="14" height="2" rx="1"/>
                  <circle cx="3" cy="18" r="2"/><rect x="7" y="17" width="14" height="2" rx="1"/>
                </svg>
              ),
              action: () => editor.chain().focus().toggleBulletList().run(),
              format: "bulletList",
            },
            {
              label: (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <text x="1" y="7" fontSize="7" fontWeight="bold">1.</text>
                  <rect x="7" y="5" width="14" height="2" rx="1"/>
                  <text x="1" y="13" fontSize="7" fontWeight="bold">2.</text>
                  <rect x="7" y="11" width="14" height="2" rx="1"/>
                  <text x="1" y="19" fontSize="7" fontWeight="bold">3.</text>
                  <rect x="7" y="17" width="14" height="2" rx="1"/>
                </svg>
              ),
              action: () => editor.chain().focus().toggleOrderedList().run(),
              format: "orderedList",
            },
          ].map(({ label, action, format, formatAttrs }) => (
            <button
              key={format + (formatAttrs?.level ?? "")}
              onMouseDown={(e) => { e.preventDefault(); action(); }}
              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                editor.isActive(format, formatAttrs)
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/*Title*/}
      {isExpanded && (
        <div className="px-4 pt-3 pb-1">
          {isPromptLocked ? (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
              <span className="text-sm text-indigo-700 flex-1">{title}</span>
              <button
                onClick={() => { setTitle(""); setIsPromptLocked(false); }}
                className="text-indigo-400 hover:text-indigo-600 text-xs transition shrink-0"
              >
                ✕ Remove prompt
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title:"
              maxLength={250}
              className="w-full text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-400 transition"
            />
          )}
        </div>
      )}  

      {/*Editor*/}
      {!isExpanded && compact ? (
        <button
          onClick={() => { setIsExpanded(true); setTimeout(() => editor?.commands.focus(), 0); }}
          className="w-full text-left px-4 py-3 text-sm text-slate-400 italic hover:text-slate-500 transition"
        >
          + Add a journal reflection...
        </button>
      ) : (
        <EditorContent editor={editor} />
      )}

      {/*Footer*/}
      {isExpanded && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 gap-2 flex-wrap">

          {/*Link*/}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {error ? (
              <p className="text-xs text-red-600">{error}</p>
            ) : defaultMoodLogId ? (
              <span className="text-xs text-indigo-500 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                🔗 Linked to mood log
              </span>
            ) : moodLogs.length > 0 ? (
              <select
                value={linkedMoodLogId ?? ""}
                onChange={(e) =>
                  setLinkedMoodLogId(e.target.value ? Number(e.target.value) : null)
                }
                className="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1 bg-white hover:border-indigo-300 transition max-w-[200px]"
              >
                <option value="">🔗 Link to a mood (optional)</option>
                {moodLogs.map((log) => (
                  <option key={log.id} value={log.id}>
                    {formatLogOption(log)}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {/*Discard/Save*/}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleDiscard}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 transition"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !hasContent}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition ${
                isSubmitting || !hasContent
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Entry"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}