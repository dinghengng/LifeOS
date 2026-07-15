"use client";

export function MoodScienceCard() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Why track mood?</h2>
      <div className="flex flex-col gap-3 text-sm text-slate-600">
        <p>
          Mood tracking provides a safe space to process how you feel rather than bottling it up.
        </p>
        <p>
          By logging your feelings, you identify hidden patterns, recognise triggers and predict emotional dips early.
        </p>
        <p>
          People who log mood consistently build a trusting relationship with themselves
        </p>
      </div>
    </div>
  );
}

export function MoodLinkTip() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Tip</h2>
        <p className="mt-3 text-sm text-slate-600">
          Link a mood log to a journal entry (or a journal entry to a mood log) using the
          &quot;Link mood&quot; button to connect how you felt to what you wrote.
        </p>
    </div>
  );
}