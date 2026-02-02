# Phase 4 Specification: AI Security Auditor

## Goal
Automatically analyze every uploaded app using an LLM (Gemini/OpenAI) to generate a "Safety Score" and a "Risk Summary."

## 1. The "Auditor" API (`/api/audit`)
- **Trigger:** This should run automatically after a successful upload, OR via a "Re-analyze" button on the dashboard.
- **Input:** Receives an `app_id`.
- **Logic:**
  1. Fetch the App's Title, Description, Category, and Developer Name from Supabase.
  2. **The Prompt:** Send this data to the LLM with the following system instruction:
     > "You are a Mobile App Security Auditor. Analyze the following app metadata. Look for signs of scams, phishing, impossible claims (e.g., 'Download more RAM'), or copyright infringement. Return a JSON object: { 'score': number (0-100, where 100 is perfectly safe), 'summary': 'Short explanation for the user', 'flags': ['list', 'of', 'red', 'flags'] }."
  3. **Save:** Update the `app_versions` table with the `ai_safety_score` and `ai_safety_summary`.

## 2. UI Updates
- **Dashboard:** Show the Safety Score next to the app in the list. Color code it (Green > 80, Yellow > 50, Red < 50).
- **Public App Page:** Display a "Security Report" card.
  - If Score is High: Show a "Verified Safe by AI" badge.
  - If Score is Low: Show a "Warning: Potential Scam" alert.
  - Display the `ai_safety_summary` text.

## 3. Tech Stack
- Use the `google-generative-ai` library (if using Gemini) or standard `openai` package.
- Ensure the API route handles errors gracefully (e.g., if AI is down, show "Analysis Pending").