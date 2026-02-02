import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Define the system instructions clearly
const SYSTEM_PROMPT = `You are a Mobile App Security Auditor. Analyze the following app metadata. Look for signs of scams, phishing, impossible claims (e.g., "Download more RAM"), or copyright infringement. Return ONLY a valid JSON object with no markdown or extra text: { "score": number (0-100, where 100 is perfectly safe), "summary": "Short explanation for the user", "flags": ["list", "of", "red", "flags"] }. If no issues found, flags can be an empty array.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const appId = body.app_id as string;

    if (!appId) {
      return NextResponse.json({ error: "Missing app_id" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const supabase = await createClient();

    // 1. Fetch App Data
    const { data: app, error: appError } = await supabase
      .from("apps")
      .select(`id, title, description, category, profiles!developer_id (username)`)
      .eq("id", appId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const developerName = (app.profiles as { username?: string } | null)?.username ?? "Unknown";

    // 2. Fetch Latest Version
    const { data: versions } = await supabase
      .from("app_versions")
      .select("id")
      .eq("app_id", appId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestVersion = versions?.[0];
    if (!latestVersion) {
      return NextResponse.json({ error: "No version found" }, { status: 404 });
    }

    // 3. Prepare the AI Prompt
    const userPrompt = `App metadata to analyze:
    - Title: ${app.title}
    - Description: ${app.description}
    - Category: ${app.category}
    - Developer: ${developerName}`;

    // Combine system prompt with user prompt for maximum model compatibility
    const finalPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // --- FINAL FIX: Using the standard free-tier friendly alias ---
    // "gemini-flash-latest" was in your valid_models list and avoids the 429 quota error.
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Generate content
    const result = await model.generateContent(finalPrompt);
    const response = result.response;
    const text = response.text();

    // 4. Parse the Result
    let parsed: { score: number; summary: string; flags?: string[] };
    try {
      // Clean up markdown code blocks (```json) if the AI includes them
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : cleanText;
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("AI Parse Error. Raw Text:", text);
      return NextResponse.json(
        { error: "AI returned invalid response", raw: text },
        { status: 500 }
      );
    }

    // 5. Save to Database
    const score = Math.max(0, Math.min(100, Math.round(parsed.score ?? 50)));
    const summary = typeof parsed.summary === "string" ? parsed.summary : "Analysis completed.";

    const { error: updateError } = await supabase
      .from("app_versions")
      .update({
        ai_safety_score: score,
        ai_safety_summary: summary,
      })
      .eq("id", latestVersion.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      version_id: latestVersion.id,
      ai_safety_score: score,
      ai_safety_summary: summary,
      model_used: "gemini-flash-latest"
    });

  } catch (err) {
    console.error("Audit error:", err);
    return NextResponse.json(
      {
        error: "Analysis failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}