import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to lowdb-style json file persistence
const DB_FILE = path.join(process.cwd(), "survey_db.json");

// Helper to initialize database if it doesn't exist
function initDB() {
  const defaultUsers = [
    {
      id: "admin_01",
      name: "Director Rose ann Sumacot",
      email: "dir.roseann@leyte.gov.ph",
      role: "Admin",
      username: "admin",
      password: "admin123"
    },
    {
      id: "staff_01",
      name: "Staff Assist: Joven R.",
      email: "staff.joven@leyte.gov.ph",
      role: "Staff",
      username: "staff",
      password: "staff123"
    }
  ];

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      let needsWrite = false;
      if (!parsed.users) {
        parsed.users = defaultUsers;
        needsWrite = true;
      } else {
        // Ensure admin's name is updated to "Director Rose ann Sumacot"
        const adminUser = parsed.users.find((u: any) => u.id === "admin_01");
        if (adminUser && adminUser.name !== "Director Rose ann Sumacot") {
          adminUser.name = "Director Rose ann Sumacot";
          needsWrite = true;
        }
      }
      if (needsWrite) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      }
      return parsed;
    } catch (e) {
      console.error("Error reading database file, resetting to default.", e);
    }
  }

  // Default seed data for Hinunangan, Southern Leyte
  const defaultDB = {
    users: defaultUsers,
    destinations: [
      {
        id: "dest-1",
        name: "San Pablo Island (Pong Dako)",
        category: "Island",
        description: "The larger of the beautiful twin islands of Hinunangan. Famous for its thriving reef, clear blue waters, lush palms, and pristine sandy shores popular for snorkeling and day outings.",
        location: "Brgy. San Pablo, Hinunangan",
        averageRating: 4.8,
        totalReviews: 6
      },
      {
        id: "dest-2",
        name: "San Pedro Island (Pong Gamay)",
        category: "Island",
        description: "The smaller twin island with absolute tranquility. Known for its magnificent stretch of white beach, coconut plantation trails, and magnificent turtle sightings during snorkeling tours.",
        location: "Brgy. San Pedro, Hinunangan",
        averageRating: 4.7,
        totalReviews: 4
      },
      {
        id: "dest-3",
        name: "Tahusan Beach",
        category: "Beach",
        description: "The surfing capital of Hinunangan. Offers cream-colored volcanic sands, steady swells ideal for surfing, skimboarding, and several cozy beachfront huts for spectacular sunset viewings.",
        location: "Brgy. Tahusan, Hinunangan",
        averageRating: 4.5,
        totalReviews: 5
      },
      {
        id: "dest-4",
        name: "Biasong Spring",
        category: "Spring",
        description: "A cold freshwater spring that sits directly bordering the shoreline, allowing visitors to plunge into freezing mountain waters right after swimming in the salty sea.",
        location: "Brgy. Biasong, Hinunangan",
        averageRating: 4.3,
        totalReviews: 3
      },
      {
        id: "dest-5",
        name: "Talisay Beach",
        category: "Beach",
        description: "A peaceful coastal retreat characterized by calm clean waters, shaded tables under Talisay trees, and an atmosphere suitable for family picnics and weekend camping.",
        location: "Brgy. Talisay, Hinunangan",
        averageRating: 4.2,
        totalReviews: 2
      },
      {
        id: "dest-6",
        name: "Town Plaza & San Pedro & Pablo Heritage Church",
        category: "Heritage",
        description: "The structural heart of Hinunangan. A clean town plaza flanked by historical Spanish-era church foundations and a view overlooking the serene Hinunangan Bay.",
        location: "Poblacion, Hinunangan",
        averageRating: 4.0,
        totalReviews: 2
      }
    ],
    questions: [
      {
        id: "q-1",
        text: "How would you rate the environmental cleanliness and waste management of the site?",
        category: "Cleanliness",
        type: "rating",
        isActive: true
      },
      {
        id: "q-2",
        text: "How satisfied are you with the hospitality, friendliness, and helpfulness of the locals and tourism personnel?",
        category: "Hospitality",
        type: "rating",
        isActive: true
      },
      {
        id: "q-3",
        text: "Are tourist assistance, safety signage, and emergency responders easily accessible if needed?",
        category: "Safety",
        type: "rating",
        isActive: true
      },
      {
        id: "q-4",
        text: "How accessible was the destination in terms of roads, transport options, and signage?",
        category: "Accessibility",
        type: "rating",
        isActive: true
      },
      {
        id: "q-5",
        text: "How well did this destination's scenery, accommodation, and natural features meet your expectations?",
        category: "Attraction Quality",
        type: "rating",
        isActive: true
      },
      {
        id: "q-6",
        text: "Would you visit this destination again or recommend it to other tourists?",
        category: "Attraction Quality",
        type: "yes_no",
        isActive: true
      },
      {
        id: "q-7",
        text: "Please share any additional feedback, issues encountered, or recommendations to help us elevate your experience.",
        category: "Attraction Quality",
        type: "text",
        isActive: true
      }
    ],
    responses: [
      {
        id: "resp-1",
        touristName: "Haruto Sato",
        touristEmail: "haruto.sato@yahoo.com",
        nationality: "Japan",
        ageGroup: "25-34",
        dateSubmitted: "2026-05-18T10:30:00Z",
        destinationId: "dest-1",
        answers: {
          "q-1": 5,
          "q-2": 5,
          "q-3": 4,
          "q-4": 4,
          "q-5": 5,
          "q-6": true,
          "q-7": "San Pablo Island has incredible coral reefs! The locals are extremely friendly. Getting there by boat from Hinunangan was simple enough, but could have better signage at the docking area."
        },
        feedbackText: "Amazing island paradise with incredible reef snorkeling. Highly recommended!",
        overallRating: 4.6,
        encodedBy: "self"
      },
      {
        id: "resp-2",
        touristName: "Amelia Watson",
        touristEmail: "amelia.wat92@gmail.com",
        nationality: "Australia",
        ageGroup: "18-24",
        dateSubmitted: "2026-05-19T14:15:00Z",
        destinationId: "dest-3",
        answers: {
          "q-1": 4,
          "q-2": 5,
          "q-3": 4,
          "q-4": 5,
          "q-5": 5,
          "q-6": true,
          "q-7": "Tahusan is so good for beginner surfing! Rental boards are cheap too. Please maintain the waste segregation system near beach huts so plastics don't get washed to sea."
        },
        feedbackText: "Super fun surf session, gentle waves and incredibly welcoming local surf guides.",
        overallRating: 4.6,
        encodedBy: "Staff Member Maria"
      },
      {
        id: "resp-3",
        touristName: "Regie Reales Jr.",
        touristEmail: "regierealesjr@gmail.com",
        nationality: "Philippines",
        ageGroup: "25-34",
        dateSubmitted: "2026-05-20T08:00:00Z",
        destinationId: "dest-2",
        answers: {
          "q-1": 5,
          "q-2": 5,
          "q-3": 5,
          "q-4": 4,
          "q-5": 5,
          "q-6": true,
          "q-7": "The white sand on San Pedro Island (Pong Gamay) is unbelievably pristine! Peaceful beach walks and genuine island vibes."
        },
        feedbackText: "Absolutely beautiful white beach. Calm, quiet, and wonderfully preserved.",
        overallRating: 4.8,
        encodedBy: "self"
      },
      {
        id: "resp-4",
        touristName: "John Connor",
        touristEmail: "j.connor@gmail.com",
        nationality: "USA",
        ageGroup: "35-44",
        dateSubmitted: "2026-05-15T11:45:00Z",
        destinationId: "dest-4",
        answers: {
          "q-1": 4,
          "q-2": 4,
          "q-3": 3,
          "q-4": 4,
          "q-5": 4,
          "q-6": true,
          "q-7": "Cold water is awesome right next to the sea! But watch out for slippery stones."
        },
        feedbackText: "Very refreshing spring! A bit slippery around the deckings.",
        overallRating: 3.8,
        encodedBy: "self"
      },
      {
        id: "resp-5",
        touristName: "Charly Clerc",
        touristEmail: "charly.c@gmail.com",
        nationality: "Germany",
        ageGroup: "45-54",
        dateSubmitted: "2026-05-17T09:12:00Z",
        destinationId: "dest-1",
        answers: {
          "q-1": 4,
          "q-2": 4,
          "q-3": 4,
          "q-4": 4,
          "q-5": 5,
          "q-6": true,
          "q-7": "The sanctuary snorkeling area is super protected. We saw sea turtles. Boatmen take safety seriously and provide life jackets."
        },
        feedbackText: "Magnificent underwater biodiversity, turtles, and vivid corals.",
        overallRating: 4.2,
        encodedBy: "Staff Member Mark"
      }
    ],
    logs: [
      {
        id: "log-1",
        timestamp: "2026-05-15T09:00:00Z",
        userRole: "Admin",
        actorName: "Tourism Officer",
        action: "Database Initialized",
        details: "Tourism office database generated or reloaded."
      },
      {
        id: "log-2",
        timestamp: "2026-05-19T14:15:00Z",
        userRole: "Staff",
        actorName: "Staff Member Maria",
        action: "Encoded Tourist Response",
        details: "Assisted Amelia Watson in registering feedback for Tahusan Beach."
      }
    ],
    aiReport: null
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf-8");
  return defaultDB;
}

// Global db instance
let db = initDB();

// Sync in-memory changes back to file system
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// ---------------- API ENDPOINTS ----------------

// Destinations
app.get("/api/destinations", (req, res) => {
  res.json(db.destinations);
});

app.post("/api/destinations", (req, res) => {
  const { name, category, description, location } = req.body;
  if (!name || !category || !location) {
    return res.status(400).json({ error: "Name, category, and location are required" });
  }
  const newDest = {
    id: "dest-" + Date.now(),
    name,
    category,
    description: description || "",
    location,
    averageRating: 0,
    totalReviews: 0
  };
  db.destinations.push(newDest);

  // Add Log
  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Tourism Officer",
    action: "Destination Added",
    details: `Added new destination: ${name} (${category})`
  });

  saveDB();
  res.status(201).json(newDest);
});

app.put("/api/destinations/:id", (req, res) => {
  const { id } = req.params;
  const { name, category, description, location } = req.body;
  const idx = db.destinations.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Destination not found" });
  }

  db.destinations[idx] = {
    ...db.destinations[idx],
    name: name || db.destinations[idx].name,
    category: category || db.destinations[idx].category,
    description: description !== undefined ? description : db.destinations[idx].description,
    location: location || db.destinations[idx].location
  };

  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Tourism Officer",
    action: "Destination Updated",
    details: `Modified details for: ${db.destinations[idx].name}`
  });

  saveDB();
  res.json(db.destinations[idx]);
});

app.delete("/api/destinations/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.destinations.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Destination not found" });
  }
  const name = db.destinations[idx].name;
  db.destinations.splice(idx, 1);

  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Tourism Officer",
    action: "Destination Deleted",
    details: `Removed destination: ${name}`
  });

  saveDB();
  res.json({ message: "Destination deleted" });
});


// Questions Group
app.get("/api/questions", (req, res) => {
  res.json(db.questions);
});

app.post("/api/questions", (req, res) => {
  const { text, category, type } = req.body;
  if (!text || !category || !type) {
    return res.status(400).json({ error: "Text, category, and type are required" });
  }

  const newQ = {
    id: "q-" + Date.now(),
    text,
    category,
    type,
    isActive: true
  };
  db.questions.push(newQ);

  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Tourism Officer",
    action: "Survey Question Added",
    details: `Created new ${category} question.`
  });

  saveDB();
  res.status(201).json(newQ);
});

app.put("/api/questions/:id", (req, res) => {
  const { id } = req.params;
  const { text, category, type, isActive } = req.body;
  const idx = db.questions.findIndex(q => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Question not found" });
  }

  db.questions[idx] = {
    ...db.questions[idx],
    text: text !== undefined ? text : db.questions[idx].text,
    category: category !== undefined ? category : db.questions[idx].category,
    type: type !== undefined ? type : db.questions[idx].type,
    isActive: isActive !== undefined ? isActive : db.questions[idx].isActive
  };

  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Tourism Officer",
    action: "Survey Question Updated",
    details: `Updated configuration of survey question ${id}.`
  });

  saveDB();
  res.json(db.questions[idx]);
});

app.delete("/api/questions/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.questions.findIndex(q => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Question not found" });
  }
  db.questions.splice(idx, 1);

  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Tourism Officer",
    action: "Survey Question Deleted",
    details: `Deleted question ID ${id}.`
  });

  saveDB();
  res.json({ message: "Question deleted" });
});


// Survey responses
app.get("/api/responses", (req, res) => {
  res.json(db.responses);
});

app.post("/api/responses", (req, res) => {
  const { touristName, touristEmail, nationality, ageGroup, destinationId, answers, feedbackText, encodedBy } = req.body;

  if (!touristName || !nationality || !destinationId || !answers) {
    return res.status(400).json({ error: "Tourist Name, nationality, destination, and survey answers are required" });
  }

  // Calculate overallRating based on the numeric rating answers
  let totalRatingSum = 0;
  let ratingCount = 0;
  for (const qId of Object.keys(answers)) {
    const question = db.questions.find(q => q.id === qId);
    if (question && question.type === "rating" && typeof answers[qId] === "number") {
      totalRatingSum += answers[qId];
      ratingCount++;
    }
  }
  const overallRating = ratingCount > 0 ? parseFloat((totalRatingSum / ratingCount).toFixed(1)) : 4.0;

  const newResponse = {
    id: "resp-" + Date.now(),
    touristName,
    touristEmail: touristEmail || "",
    nationality,
    ageGroup: ageGroup || "25-34",
    dateSubmitted: new Date().toISOString(),
    destinationId,
    answers,
    feedbackText: feedbackText || "",
    overallRating,
    encodedBy: encodedBy || "self"
  };

  db.responses.unshift(newResponse);

  // Re-calculate the averageRating and totalReviews for the Destination
  const destIdx = db.destinations.findIndex(d => d.id === destinationId);
  if (destIdx !== -1) {
    const destResponses = db.responses.filter(r => r.destinationId === destinationId);
    const avg = parseFloat((destResponses.reduce((acc, r) => acc + r.overallRating, 0) / destResponses.length).toFixed(1));
    db.destinations[destIdx].averageRating = avg;
    db.destinations[destIdx].totalReviews = destResponses.length;
  }

  // Create audit activity log item
  const isStaff = encodedBy && encodedBy !== "self";
  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: isStaff ? "Staff" : "Tourist",
    actorName: isStaff ? encodedBy : touristName,
    action: "Survey Response Submitted",
    details: `Survey submitted for ${db.destinations[destIdx]?.name || 'Destination'}. Average satisfaction: ${overallRating}/5`
  });

  saveDB();
  res.status(201).json(newResponse);
});


// Audit logs
app.get("/api/logs", (req, res) => {
  res.json(db.logs);
});


// User Accounts Group Admin Controller
app.get("/api/users", (req, res) => {
  res.json(db.users || []);
});

app.post("/api/users", (req, res) => {
  const { name, email, role, username, password } = req.body;
  if (!name || !role || !username || !password) {
    return res.status(400).json({ error: "Name, role, username, and password are required" });
  }

  const userList = db.users || [];
  const exists = userList.some((u: any) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Username already registered" });
  }

  const newUser = {
    id: "user-" + Date.now(),
    name: name.trim(),
    email: email ? email.trim() : "",
    role,
    username: username.trim().toLowerCase(),
    password: password.trim()
  };

  if (!db.users) {
    db.users = [];
  }
  db.users.push(newUser);

  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Created User Account",
    details: `Created new ${role} account for ${name} (username: ${username})`
  });

  saveDB();
  res.status(201).json(newUser);
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const userList = db.users || [];
  const idx = userList.findIndex((u: any) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User account not found" });
  }

  const targetUser = userList[idx];
  if (targetUser.username === "admin") {
    return res.status(400).json({ error: "Cannot delete primary Administrator account" });
  }

  userList.splice(idx, 1);
  db.users = userList;

  db.logs.unshift({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Deleted User Account",
    details: `Removed accounts access for ${targetUser.role} member: ${targetUser.name}`
  });

  saveDB();
  res.json({ message: "Account deleted successfully" });
});


// Gemini AI Tourism Officer Advisor Insights
app.post("/api/ai-report/generate", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Return a beautiful semantic deterministic fallback report if API key is not yet configured,
    // in order not to crash the user experience and show realistic suggestions!
    const sampleReports = [
      {
        overallSatisfaction: "Excellent (Average 4.5/5.0) - Strong tourist interest in beaches and eco-marines, with specific focus on San Pablo & San Pedro white sand and marine life preservation.",
        swotAnalysis: {
          strengths: [
            "Incredible marine biodiversity and pristine white coral sands (especially the Twin Islands: San Pablo and San Pedro).",
            "Extremely high hospitality score with tourists repeatedly praising the genuine warmth of the Hinunangan locals.",
            "Great surfing and skimboarding swells at Tahusan Beach catering to adventurism seekers."
          ],
          weaknesses: [
            "Inadequate prominent signaling or instructions at key jump-off ports/boat terminals to islands.",
            "Potential waste collection delays at busy beachfront huts such as Tahusan causing concern from conservationists.",
            "Biasong Cold Spring safety needs work, particularly with wet, slippery access stairs."
          ],
          opportunities: [
            "Develop community-based sustainable diving and snorkeling instruction packages under Hinunangan local cooperatives.",
            "Implement high-visibility QR-code based tourist information plaques that detail boat rates, guide schedules, and environment laws.",
            "Introduce an off-grid green energy surfing festival at Tahusan Beach to increase youth ecotourism."
          ],
          threats: [
            "Overcrowding of pristine marine sanctuaries in San Pablo without strictly enforced daily boat quotas.",
            "Environmental degradation and single-use microplastics making their way to delicate nearshore coral reefs.",
            "Sudden storm surges typical to the Southern Leyte sea region disrupting the livelihoods of local motorized bangkareros."
          ]
        },
        destinationInsights: [
          {
            destinationName: "San Pablo Island (Pong Dako)",
            insight: "Highly rated snorkeling sanctuary. Visitors report turtle sightings but suggest clearer instructions on marine reserve boundaries.",
            recommendation: "Deploy visible floating buoys to mark sanctuary limits and guide boat operators on non-anchoring zones."
          },
          {
            destinationName: "Tahusan Beach",
            insight: "Excellent rating for beginner surf waves and local instructors. Minor concerns about waste collection around tourist huts.",
            recommendation: "Provide color-coded smart bins near the huts and coordinate clean-day sweeps with surf guides."
          },
          {
            destinationName: "Biasong Spring",
            insight: "Unique cold-spring on the coast. Scores are slightly lower due to slippery landing steps.",
            recommendation: "Install anti-slip texturized strips and clean algae build-up on the spring steps."
          }
        ],
        strategicRecommendations: [
          "Establish an Official Tourist Registration & Information Center terminal near Poblacion.",
          "Coordinate ecological training and standard flat-rates for boatmen heading to San Pablo/San Pedro twin islands.",
          "Implement unified Hinunangan Eco-Passes where environmental fees fund smart waste collection at beaches."
        ],
        generatedAt: new Date().toISOString()
      }
    ];
    db.aiReport = sampleReports[0];
    saveDB();
    return res.json({
      report: db.aiReport,
      isDemo: true,
      message: "This is a preconfigured high-fidelity analysis for Hinunangan. To fetch live dynamic evaluations using your database responses, configure your GEMINI_API_KEY in Settings."
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    // Let's summarize our dataset for Gemini to analyze
    const summaryData = {
      totalResponses: db.responses.length,
      destinations: db.destinations.map(d => ({ name: d.name, category: d.category, totalReviews: d.totalReviews, averageRating: d.averageRating })),
      questions: db.questions.filter(q => q.isActive).map(q => ({ text: q.text, category: q.category })),
      recentFeedbackList: db.responses.slice(0, 15).map(r => ({
        destination: db.destinations.find(d => d.id === r.destinationId)?.name || 'Unknown',
        rating: r.overallRating,
        feedback: r.feedbackText,
        nationality: r.nationality
      }))
    };

    const prompt = `You are an expert tourism systems consultant advising the Municipal Tourism Officer of Hinunangan, Southern Leyte, Philippines.
Analyse this Tourist Satisfaction Survey dataset:
${JSON.stringify(summaryData, null, 2)}

Provide your output in valid, clean JSON that strictly conforms to this TypeScript interface:
interface GeminiResponseAnalysis {
  overallSatisfaction: string; // concise high-level assessment sentence
  swotAnalysis: {
    strengths: string[]; // at least 3 concrete points based on feedback and Southern Leyte context
    weaknesses: string[]; // at least 3 points
    opportunities: string[]; // at least 3 points
    threats: string[]; // at least 3 points
  };
  destinationInsights: {
    destinationName: string;
    insight: string;
    recommendation: string;
  }[]; // for at least 3 of our main attractions
  strategicRecommendations: string[]; // 3-4 concrete tourism development strategies
}

Return ONLY this JSON. Do not write any markdown codeblock backticks or conversational text. Start and end with curly brackets {}. Ensure all strings are escape-quoted cleanly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedReport = JSON.parse(response.text.trim());
    parsedReport.generatedAt = new Date().toISOString();

    db.aiReport = parsedReport;
    saveDB();

    res.json({
      report: db.aiReport,
      isDemo: false
    });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: "Failed to generate AI survey analysis: " + error.message });
  }
});


// Get existing AI report
app.get("/api/ai-report", (req, res) => {
  res.json(db.aiReport);
});


// RESET DB back to default (useful for testing)
app.post("/api/reset-db", (req, res) => {
  fs.unlinkSync(DB_FILE);
  db = initDB();
  res.json({ message: "Database reset to factory defaults", db });
});


// Vite middleware/Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hinunangan Survey Server running on http://localhost:${PORT}`);
  });
}

startServer();
