"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { createJournalEntry } from "../../shared/api";
import { CreateJournalEntryPayload } from "../../shared/types";

interface JournalEditorProps {
  onSaved: () => void;
}

export default function JournalEditor({ onSaved }: JournalEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
        levels: [1, 2, 3],  //H1, H2, H3
        },
        bulletList: {},        
        orderedList: {},      
        listItem: {},         
      }),
      Placeholder.configure({
        placeholder: "Write about your day...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3 text-slate-800",
      },
    },
    onFocus: () => setIsExpanded(true),
    onUpdate: ({ editor }) => {
    setHasContent(!editor.isEmpty);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate(n => n + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const handleSave = async () => {
    if (!editor || !hasContent) return;
    setIsSubmitting(true);
    setError(null);

    const content = editor.getHTML(); //Store text as HTML string

    const payload: CreateJournalEntryPayload = { content };

    try {
      await createJournalEntry(payload);
      editor.commands.clearContent();
      setHasContent(false);
      setIsExpanded(false);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    editor?.commands.clearContent();
    setIsExpanded(false);
    setError(null);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 w-full max-w-3xl overflow-hidden">
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
          // Bullet list icon — mimics Google Docs
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
          // Ordered list icon — mimics Google Docs
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

      {/*Editor*/}
      <EditorContent editor={editor} />

      {/*Footer*/}
      {isExpanded && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : (
            <p className="text-xs text-slate-400">
              {editor?.storage.characterCount?.characters?.() ?? ""} 
            </p>
          )}
          <div className="flex gap-2">
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