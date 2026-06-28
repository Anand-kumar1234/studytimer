/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured in environment variables. AI features will fallback to client heuristics.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. AI Study Planner / Timetable Generator
app.post("/api/ai/planner", async (req, res) => {
  try {
    const { subjects, dailyHours, targetDays, difficulty } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "Please provide a list of subjects." });
    }

    const ai = getAiClient();
    if (!ai) {
      // Return beautiful structured mock/fallback plan if API key is missing
      return res.json({
        fallback: true,
        plan: generateFallbackPlan(subjects, dailyHours, targetDays, difficulty),
        message: "Demo Study Plan (Configure GEMINI_API_KEY for personalized AI scheduling)"
      });
    }

    const prompt = `You are an expert AI Academic Coach and Study Planner. Create a highly optimized, hyper-personalized study timetable.
Subjects to balance: ${subjects.join(", ")}
Target study hours per day: ${dailyHours} hours
Schedule duration: Next ${targetDays || 7} days
Overall difficulty setting: ${difficulty || 'medium'}

Format your response as a valid JSON object with the following structure. Do NOT include any markdown code blocks (e.g. no \`\`\`json) or extra text outside the JSON:
{
  "schedule": [
    {
      "day": "Day 1",
      "sessions": [
        { "subject": "Subject Name", "topic": "Suggested Chapter/Topic", "duration": "Duration in min", "type": "pomodoro or deep-work", "tip": "Quick focus tip" }
      ]
    }
  ],
  "habits": [
    "Suggested habit or routine tip for this balance"
  ],
  "breakRecommendation": "Custom rest strategy"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const contentText = response.text || "{}";
    try {
      const parsed = JSON.parse(contentText);
      res.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", contentText);
      res.json({
        schedule: generateFallbackPlan(subjects, dailyHours, targetDays, difficulty),
        habits: ["Keep a structured environment", "Use Pomodoro blocks of 25-50 minutes"],
        breakRecommendation: "Take a 5-10 minute active recovery break after each focus block."
      });
    }
  } catch (error: any) {
    console.error("AI Planner error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI Planner" });
  }
});

// 3. AI Productivity Insights and Habit Analysis
app.post("/api/ai/suggestions", async (req, res) => {
  try {
    const { history } = req.body; // Array of study sessions

    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.json({
        insights: ["Start your first study session to unlock personalized AI behavior and productivity analysis!"],
        score: 70,
        tips: ["Create clear, bite-sized goals.", "Eliminate screen distractions before launching your timer."]
      });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        fallback: true,
        insights: [
          "Great job tracking your study sessions! Your active subjects are well-distributed.",
          "Consider studying at consistent times of the day to solidify your memory retention.",
          "Ensure you schedule short physical stretches between your intense deep-focus periods."
        ],
        score: 85,
        tips: [
          "Study your hardest subjects in the morning when mental stamina is at its peak.",
          "Implement active recall methods like flashcards during your reviews."
        ]
      });
    }

    const sessionSummary = history.map(s => 
      `- Subject: ${s.subject}, Duration: ${Math.round(s.actualTime / 60)} min, Difficulty: ${s.difficulty}, Productivity: ${s.productivityRating}/5, Date: ${s.date}`
    ).join("\n");

    const prompt = `You are a productivity expert. Analyze the user's recent study sessions and provide concrete insights, a calculated focus/productivity score (out of 100), and personalized coaching tips.

User's study history logs:
${sessionSummary}

Format your response as a valid JSON object with the following structure. Do NOT include markdown code blocks or extra text:
{
  "insights": [
    "Insight sentence 1",
    "Insight sentence 2"
  ],
  "score": 85,
  "tips": [
    "Tip 1",
    "Tip 2"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const contentText = response.text || "{}";
    try {
      const parsed = JSON.parse(contentText);
      res.json(parsed);
    } catch (e) {
      res.json({
        insights: ["Analyze your history with active recall to boost test scores.", "Great study rhythm detected."],
        score: 80,
        tips: ["Implement Feynman technique for hard chapters.", "Limit daily sessions to 4-5 hours of deep focus."]
      });
    }
  } catch (error: any) {
    console.error("AI Suggestions error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI Analyzer" });
  }
});

// Helper fallback planner
function generateFallbackPlan(subjects: string[], dailyHours: number, days: number = 7, difficulty: string = "medium") {
  const schedule = [];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  for (let i = 0; i < days; i++) {
    const dayName = daysOfWeek[i % daysOfWeek.length];
    const daySubjects = [
      subjects[i % subjects.length],
      subjects[(i + 1) % subjects.length]
    ].filter((v, idx, arr) => arr.indexOf(v) === idx); // unique

    const sessions = daySubjects.map((sub, sIdx) => {
      const isHard = difficulty === 'hard' || sIdx === 0;
      const dur = isHard ? 50 : 25;
      return {
        subject: sub,
        topic: `Chapter Review & Practice Exercises`,
        duration: `${dur} min`,
        type: isHard ? "deep-work" : "pomodoro",
        tip: isHard ? "Turn off phone completely. Focus on hardest sub-problems." : "Keep a steady pacing. Reward yourself after this block."
      };
    });

    schedule.push({
      day: `${dayName} (Day ${i+1})`,
      sessions
    });
  }
  return schedule;
}

// -----------------------------------------------------------------------------
// VITE DEV SERVER OR STATIC SERVING
// -----------------------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
});
