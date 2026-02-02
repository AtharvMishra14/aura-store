import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "No API Key found in env" });
  }

  try {
    // We fetch the list of models directly from Google's REST API
    // This bypasses the library to see exactly what the server sees.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: "GET" }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        status: "Error from Google", 
        code: response.status,
        details: errorText 
      });
    }

    const data = await response.json();
    
    // Return the list of valid model names
    return NextResponse.json({ 
      key_status: "Active",
      valid_models: data.models?.map((m: any) => m.name) || [] 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}