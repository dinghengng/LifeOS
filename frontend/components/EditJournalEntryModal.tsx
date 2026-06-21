"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { JournalEntry, MoodLog, MoodLevel, UpdateJournalEntryPayload } from "../../shared/types";
import { updateJournalEntry } from "../../shared/api";
import { useToastContext } from "../components/ToastContext";

const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄",
};

function formatLogTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

interface EditJournalEntryModalProps {
  entry: JournalEntry;
  logs: MoodLog[];
  onSaved: () => void;
  onClose: () => void;
}

export default function EditJournalEntryModal({ entry, logs, onSaved, onClose }: EditJournalEntryModalProps) {
  const [title, setTitle] = useState(entry.title ?? "");
  const [linkedMoodId, setLinkedMoodId] = useState<number | null>(entry.moodLogId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const { showToast } = useToastContext();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        listItem: {},
      }),
      Placeholder.configure({ placeholder: "Write your reflection..." }),
    ],
    content: entry.content ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[160px] px-4 py-3 text-slate-800",
      },
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

  const handleSave = async () => {
    if (!editor || editor.isEmpty) {
      setError("Content cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const payload: UpdateJournalEntryPayload = {
      title: title.trim() || null,
      content: editor.getHTML(),
      mood_log_id: linkedMoodId,
    };

    try {
      await updateJournalEntry(entry.id, payload);
      showToast("Journal entry updated"); //toast noti
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
      showToast("Failed to update entry. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Edit Journal Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>

        {/*Toolbar*/}
        {editor && (
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
                key={format + ((formatAttrs as { level?: number })?.level ?? "")}
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
        <div className="px-4 pt-3 pb-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title:"
            maxLength={250}
            className="w-full text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-400 transition"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          <EditorContent editor={editor} />
        </div>

        {/*Link mood*/}
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60">
          <select
            value={linkedMoodId ?? ""}
            onChange={(e) => setLinkedMoodId(e.target.value ? Number(e.target.value) : null)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
          >
            <option value="">🔗 Link to a mood (optional)</option>
            {logs.map((log) => (
              <option key={log.id} value={log.id}>
                {MOOD_EMOJI[log.moodLevel]} {formatLogTime(log.loggedAt)} · Stress {log.stressLevel}/10
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border-t border-red-100 px-4 py-2">
            {error}
          </p>
        )}

        {/*Actions*/}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition ${
              isSubmitting ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}