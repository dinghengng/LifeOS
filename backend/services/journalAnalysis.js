const pool = require("../db");
const { analyzeJournalEntry } = require("./groqClient");

async function runAndStoreAnalysis(entryId, userId, content) {
  const analysis = await analyzeJournalEntry(content);
  if (!analysis) return; 

  try {
    await pool.query(
      `UPDATE journal_entries
       SET ai_mood_score = $1, ai_themes = $2, ai_confidence = $3, ai_analyzed_at = NOW()
       WHERE id = $4 AND user_id = $5`,
      [analysis.mood_score, JSON.stringify(analysis.themes), analysis.confidence, entryId, userId],
    );
  } catch (err) {
    console.error(`[journalAnalysis] Failed to store analysis for entry ${entryId}:`, err.message);
  }
}

module.exports = { runAndStoreAnalysis };