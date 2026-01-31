import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import Groq from "groq-sdk";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs
} from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// ================= INIT =================
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ================= MIDDLEWARE =================
app.use(cors());

app.use(express.json());

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

// ================= ROUTES =================
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "DayZy AI Server is running" });
});

app.post("/api/ai-chat", aiLimiter, async (req, res) => {
  try {
    const { message, context, userId } = req.body;

    console.log("[AI] Request:", message);

    if (!message || !context || !userId) {
      return res.status(400).json({ error: "Missing required data" });
    }

    const tasks = context.tasks || [];
    const contextString = formatContext(context);

    // Call Groq AI
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are DayZy AI Assistant - a smart task manager.
Respond with ONLY JSON (no markdown, no extra text):
{
  "action": "chat|create|delete|update",
  "response": "Message to user",
  "taskData": {
    "taskId": "id for delete/update",
    "title": "task title for create",
    "date": "YYYY-MM-DD",
    "priority": "low|medium|high",
    "category": "work|personal|meeting|other",
    "completed": true/false
  }
}

ALL TASKS:
${tasks.map(t => `- [${t.id}] ${t.title} (${t.date}) ${t.completed ? "✓" : "✗"}`).join("\n") || "No tasks"}

Rules:
1. For DELETE: Find task by title, extract ID
2. For CREATE: Extract title and date from message
3. For UPDATE: Find task and toggle/update
4. Default: "chat" action with helpful response

User Data:
${contextString}`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    let aiText = response.choices[0].message.content.trim();
    let action = { action: "chat", response: aiText, taskData: {} };

    // Parse JSON
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        action = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("Parse error, using as chat");
    }

    // Execute action
    if (action.action === "delete") {
      const taskId = action.taskData?.taskId;
      if (taskId) {
        await deleteDoc(doc(db, "tasks", taskId));
        console.log(`✅ Deleted: ${taskId}`);
      }
    } else if (action.action === "create") {
      const now = new Date().toISOString().split("T")[0];
      const newTask = {
        owner: userId,
        title: action.taskData?.title || "New Task",
        description: action.taskData?.description || "",
        date: action.taskData?.date || now,
        priority: action.taskData?.priority || "medium",
        category: action.taskData?.category || "work",
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "tasks"), newTask);
      console.log(`✅ Created: ${newTask.title} (${docRef.id})`);
    } else if (action.action === "update") {
      const taskId = action.taskData?.taskId;
      if (taskId) {
        const updateData = { updatedAt: new Date().toISOString() };
        if (action.taskData?.title) updateData.title = action.taskData.title;
        if (action.taskData?.priority) updateData.priority = action.taskData.priority;
        if (action.taskData?.completed !== undefined) updateData.completed = action.taskData.completed;
        await updateDoc(doc(db, "tasks", taskId), updateData);
        console.log(`✅ Updated: ${taskId}`);
      }
    }

    console.log(`Action: ${action.action}`);
    res.json({ response: action.response });

  } catch (error) {
    console.error("🔥 ERROR:", error.message);

    if (error.status === 401) {
      return res.status(401).json({
        error: "Invalid API Key",
        details: "Check GROQ_API_KEY or FIREBASE_* in .env"
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        details: "Please try again in a moment"
      });
    }

    res.status(500).json({
      error: "Failed to process AI request",
      details: error.message
    });
  }
});

// ================= HELPERS =================
function formatContext(context) {
  const { tasks, projects, stats, userEmail } = context;

  return `
User: ${userEmail}

TASKS (${tasks?.length || 0}):
${tasks && tasks.length > 0
  ? tasks.map(t => `• ${t.title} (${t.priority}) - ${t.date} - ${t.completed ? "✓ Done" : "⏳ Pending"}`).join("\n")
  : "No tasks"}

PROJECTS (${projects?.length || 0}):
${projects && projects.length > 0
  ? projects.map(p => `• ${p.name} (${p.members} members)`).join("\n")
  : "No projects"}

STATS: ${stats?.completedTasks || 0}/${stats?.totalTasks || 0} done
`.trim();
}

// ================= START =================
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🚀 DayZy AI Server Started       ║
╠════════════════════════════════════╣
║   Port: ${PORT}
║   Groq: ${process.env.GROQ_API_KEY ? "✅" : "❌"}
║   Firebase: ${process.env.FIREBASE_PROJECT_ID ? "✅" : "❌"}
║   Status: Ready ✨
╚════════════════════════════════════╝
`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});