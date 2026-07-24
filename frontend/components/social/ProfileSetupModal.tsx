"use client";

import { useRef } from "react";
import ProfileSettingsSection from "../settings/ProfileSettingsSection";

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export default function ProfileSetupModal({ onComplete, onSkip }: Props) {
  const saveRef = useRef<(() => Promise<{ username: string } | null>) | null>(null);

  const handleSave = async () => {
    if (saveRef.current) {
      const result = await saveRef.current();
      if (result) onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 overflow-y-auto flex-1">
          <h2 className="text-xl font-semibold text-slate-800">Set up your profile</h2>
          <p className="text-sm text-slate-500 mt-1">Choose a username so others can find you.</p>
          <div className="mt-5">
            <ProfileSettingsSection saveRef={saveRef} />
          </div>
          <div className="flex justify-between items-center mt-6">
            <button onClick={onSkip} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition">
              Skip for now
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}