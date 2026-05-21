import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

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

let pool: any = null;
let mysqlConfigured = false;
let mysqlError: string | null = null;
let mysqlStatus = "Not Configured";
let mysqlHostInfo = "";

// Aiven MySQL startup and verification
async function initMySQL() {
  const mysqlUrl = process.env.MYSQL_URL;
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT || "3306";
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE || "defaultdb";

  if (!mysqlUrl && !host) {
    mysqlStatus = "Not Configured (Missing env vars)";
    console.log("MySQL Database: No connection URI or host configured in environment. Operating in local JSON mode.");
    return;
  }

  try {
    const connectionOptions: any = {
      ssl: {
        rejectUnauthorized: false
      },
      connectTimeout: 10000,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    };

    if (mysqlUrl) {
      pool = mysql.createPool({
        uri: mysqlUrl,
        ...connectionOptions
      });
      // Try to parse host info for status page
      try {
        const u = new URL(mysqlUrl);
        mysqlHostInfo = `${u.hostname}:${u.port || 3306}/${u.pathname.replace(/^\//, '')}`;
      } catch (e) {
        mysqlHostInfo = "Aiven Cloud Instance Connection URI";
      }
    } else {
      connectionOptions.host = host;
      connectionOptions.port = parseInt(port);
      connectionOptions.user = user;
      connectionOptions.password = password;
      connectionOptions.database = database;
      pool = mysql.createPool(connectionOptions);
      mysqlHostInfo = `${host}:${port}/${database}`;
    }

    // Ping check
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    mysqlConfigured = true;
    mysqlStatus = "Connected (MySQL/Aiven Live)";
    console.log(`MySQL Database: Successfully connected to cloud instance at ${mysqlHostInfo}.`);

    // Bootstrap tables & seed initial data
    await bootstrapMySQLSchema();
    await seedMySQLIfNecessary();

  } catch (err: any) {
    mysqlConfigured = false;
    mysqlError = err.message || "Unknown database error";
    mysqlStatus = "Connection Failed";
    pool = null;
    console.error("MySQL Database: Connection error. Defaulting safely to local JSON storage. Error details:", err.message);
  }
}

async function bootstrapMySQLSchema() {
  if (!pool) return;
  console.log("MySQL Database: Verifying schema tables exist...");
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS db_users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      role VARCHAR(50) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS db_destinations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      location VARCHAR(255) NOT NULL,
      averageRating FLOAT DEFAULT 0,
      totalReviews INT DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS db_questions (
      id VARCHAR(255) PRIMARY KEY,
      text TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      isActive BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS db_responses (
      id VARCHAR(255) PRIMARY KEY,
      touristName VARCHAR(255) NOT NULL,
      touristEmail VARCHAR(255),
      nationality VARCHAR(100) NOT NULL,
      ageGroup VARCHAR(50),
      dateSubmitted VARCHAR(100) NOT NULL,
      destinationId VARCHAR(255) NOT NULL,
      answers TEXT NOT NULL,
      feedbackText TEXT,
      overallRating FLOAT DEFAULT 0,
      encodedBy VARCHAR(100)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS db_logs (
      id VARCHAR(255) PRIMARY KEY,
      timestamp VARCHAR(100) NOT NULL,
      userRole VARCHAR(50) NOT NULL,
      actorName VARCHAR(255) NOT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS db_ai_reports (
      id VARCHAR(255) PRIMARY KEY,
      report TEXT NOT NULL,
      generatedAt VARCHAR(100) NOT NULL
    )
  `);
}

async function seedMySQLIfNecessary() {
  if (!pool) return;
  
  try {
    const [users] = await pool.query("SELECT COUNT(*) as count FROM db_users");
    if (users[0].count === 0) {
      console.log("Seeding MySQL db_users table...");
      for (const u of db.users) {
        await pool.query(
          "INSERT INTO db_users (id, name, email, role, username, password) VALUES (?, ?, ?, ?, ?, ?)",
          [u.id, u.name, u.email || "", u.role, u.username, u.password || ""]
        );
      }
    }

    const [dests] = await pool.query("SELECT COUNT(*) as count FROM db_destinations");
    if (dests[0].count === 0) {
      console.log("Seeding MySQL db_destinations table...");
      for (const d of db.destinations) {
        await pool.query(
          "INSERT INTO db_destinations (id, name, category, description, location, averageRating, totalReviews) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [d.id, d.name, d.category, d.description, d.location, d.averageRating, d.totalReviews]
        );
      }
    }

    const [qs] = await pool.query("SELECT COUNT(*) as count FROM db_questions");
    if (qs[0].count === 0) {
      console.log("Seeding MySQL db_questions table...");
      for (const q of db.questions) {
        await pool.query(
          "INSERT INTO db_questions (id, text, category, type, isActive) VALUES (?, ?, ?, ?, ?)",
          [q.id, q.text, q.category, q.type, q.isActive ? 1 : 0]
        );
      }
    }

    const [resps] = await pool.query("SELECT COUNT(*) as count FROM db_responses");
    if (resps[0].count === 0) {
      console.log("Seeding MySQL db_responses table...");
      for (const r of db.responses) {
        await pool.query(
          "INSERT INTO db_responses (id, touristName, touristEmail, nationality, ageGroup, dateSubmitted, destinationId, answers, feedbackText, overallRating, encodedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [r.id, r.touristName, r.touristEmail || "", r.nationality, r.ageGroup || "", r.dateSubmitted, r.destinationId, JSON.stringify(r.answers), r.feedbackText || "", r.overallRating, r.encodedBy || "self"]
        );
      }
    }

    const [logs] = await pool.query("SELECT COUNT(*) as count FROM db_logs");
    if (logs[0].count === 0) {
      console.log("Seeding MySQL db_logs table...");
      for (const l of db.logs) {
        await pool.query(
          "INSERT INTO db_logs (id, timestamp, userRole, actorName, action, details) VALUES (?, ?, ?, ?, ?, ?)",
          [l.id, l.timestamp, l.userRole, l.actorName, l.action, l.details]
        );
      }
    }
    console.log("MySQL Database: Seeding process completed successfully.");
  } catch (error) {
    console.error("MySQL Database: error seeding database tables", error);
  }
}

// Global active-fallback access wrappers
async function getDestinations() {
  if (mysqlConfigured && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM db_destinations");
      return rows;
    } catch (e) {
      console.error("MySQL getDestinations error, using memory fallback", e);
    }
  }
  return db.destinations;
}

async function addDestination(dest: any) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query(
        "INSERT INTO db_destinations (id, name, category, description, location, averageRating, totalReviews) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [dest.id, dest.name, dest.category, dest.description, dest.location, dest.averageRating, dest.totalReviews]
      );
    } catch (e) {
      console.error("MySQL addDestination error", e);
    }
  }
  db.destinations.push(dest);
  saveDB();
}

async function updateDestination(id: string, destData: any) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query(
        "UPDATE db_destinations SET name = ?, category = ?, description = ?, location = ?, averageRating = ?, totalReviews = ? WHERE id = ?",
        [destData.name, destData.category, destData.description, destData.location, destData.averageRating, destData.totalReviews, id]
      );
    } catch (e) {
      console.error("MySQL updateDestination error", e);
    }
  }
  const idx = db.destinations.findIndex(d => d.id === id);
  if (idx !== -1) {
    db.destinations[idx] = { ...db.destinations[idx], ...destData };
    saveDB();
  }
}

async function deleteDestination(id: string) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query("DELETE FROM db_destinations WHERE id = ?", [id]);
    } catch (e) {
      console.error("MySQL deleteDestination error", e);
    }
  }
  const idx = db.destinations.findIndex(d => d.id === id);
  if (idx !== -1) {
    db.destinations.splice(idx, 1);
    saveDB();
  }
}

async function getQuestions() {
  if (mysqlConfigured && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM db_questions");
      return rows.map((r: any) => ({
        ...r,
        isActive: !!r.isActive
      }));
    } catch (e) {
      console.error("MySQL getQuestions error, using memory fallback", e);
    }
  }
  return db.questions;
}

async function addQuestion(q: any) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query(
        "INSERT INTO db_questions (id, text, category, type, isActive) VALUES (?, ?, ?, ?, ?)",
        [q.id, q.text, q.category, q.type, q.isActive ? 1 : 0]
      );
    } catch (e) {
      console.error("MySQL addQuestion error", e);
    }
  }
  db.questions.push(q);
  saveDB();
}

async function updateQuestion(id: string, qData: any) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query(
        "UPDATE db_questions SET text = ?, category = ?, type = ?, isActive = ? WHERE id = ?",
        [qData.text, qData.category, qData.type, qData.isActive ? 1 : 0, id]
      );
    } catch (e) {
      console.error("MySQL updateQuestion error", e);
    }
  }
  const idx = db.questions.findIndex(q => q.id === id);
  if (idx !== -1) {
    db.questions[idx] = { ...db.questions[idx], ...qData };
    saveDB();
  }
}

async function deleteQuestion(id: string) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query("DELETE FROM db_questions WHERE id = ?", [id]);
    } catch (e) {
      console.error("MySQL deleteQuestion error", e);
    }
  }
  const idx = db.questions.findIndex(q => q.id === id);
  if (idx !== -1) {
    db.questions.splice(idx, 1);
    saveDB();
  }
}

async function getUsers() {
  if (mysqlConfigured && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM db_users");
      return rows;
    } catch (e) {
      console.error("MySQL getUsers error, using memory fallback", e);
    }
  }
  return db.users || [];
}

async function addUser(u: any) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query(
        "INSERT INTO db_users (id, name, email, role, username, password) VALUES (?, ?, ?, ?, ?, ?)",
        [u.id, u.name, u.email || "", u.role, u.username, u.password || ""]
      );
    } catch (e) {
      console.error("MySQL addUser error", e);
    }
  }
  if (!db.users) db.users = [];
  db.users.push(u);
  saveDB();
}

async function deleteUser(id: string) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query("DELETE FROM db_users WHERE id = ?", [id]);
    } catch (e) {
      console.error("MySQL deleteUser error", e);
    }
  }
  if (db.users) {
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.users.splice(idx, 1);
      saveDB();
    }
  }
}

async function getResponses() {
  if (mysqlConfigured && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM db_responses ORDER BY dateSubmitted DESC");
      return rows.map((r: any) => ({
        ...r,
        answers: typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers
      }));
    } catch (e) {
      console.error("MySQL getResponses error, using memory fallback", e);
    }
  }
  return db.responses;
}

async function addResponse(resp: any) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query(
        "INSERT INTO db_responses (id, touristName, touristEmail, nationality, ageGroup, dateSubmitted, destinationId, answers, feedbackText, overallRating, encodedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [resp.id, resp.touristName, resp.touristEmail || "", resp.nationality, resp.ageGroup || "", resp.dateSubmitted, resp.destinationId, JSON.stringify(resp.answers), resp.feedbackText || "", resp.overallRating, resp.encodedBy || "self"]
      );
    } catch (e) {
      console.error("MySQL addResponse error", e);
    }
  }
  db.responses.unshift(resp);

  // Recalculating the destination metadata
  const destId = resp.destinationId;
  const destResponses = db.responses.filter(r => r.destinationId === destId);
  const avg = parseFloat((destResponses.reduce((acc, r) => acc + r.overallRating, 0) / destResponses.length).toFixed(1));
  const total = destResponses.length;

  if (mysqlConfigured && pool) {
    try {
      await pool.query(
        "UPDATE db_destinations SET averageRating = ?, totalReviews = ? WHERE id = ?",
        [avg, total, destId]
      );
    } catch (e) {
      console.error("MySQL update destination stats error", e);
    }
  }

  const destIdx = db.destinations.findIndex(d => d.id === destId);
  if (destIdx !== -1) {
    db.destinations[destIdx].averageRating = avg;
    db.destinations[destIdx].totalReviews = total;
  }
  saveDB();
}

async function getLogs() {
  if (mysqlConfigured && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM db_logs ORDER BY timestamp DESC");
      return rows;
    } catch (e) {
      console.error("MySQL getLogs error, using memory fallback", e);
    }
  }
  return db.logs;
}

async function addLog(logItem: any) {
  if (mysqlConfigured && pool) {
    try {
      await pool.query(
        "INSERT INTO db_logs (id, timestamp, userRole, actorName, action, details) VALUES (?, ?, ?, ?, ?, ?)",
        [logItem.id, logItem.timestamp, logItem.userRole, logItem.actorName, logItem.action, logItem.details]
      );
    } catch (e) {
      console.error("MySQL addLog error", e);
    }
  }
  db.logs.unshift(logItem);
  saveDB();
}

async function getAiReport() {
  if (mysqlConfigured && pool) {
    try {
      const [rows] = await pool.query("SELECT * FROM db_ai_reports ORDER BY generatedAt DESC LIMIT 1");
      if (rows.length > 0) {
        return typeof rows[0].report === "string" ? JSON.parse(rows[0].report) : rows[0].report;
      }
    } catch (e) {
      console.error("MySQL getAiReport error", e);
    }
  }
  return db.aiReport;
}

async function saveAiReport(report: any) {
  if (mysqlConfigured && pool) {
    try {
      const reportId = "rep-" + Date.now();
      await pool.query(
        "INSERT INTO db_ai_reports (id, report, generatedAt) VALUES (?, ?, ?)",
        [reportId, JSON.stringify(report), report.generatedAt || new Date().toISOString()]
      );
    } catch (e) {
      console.error("MySQL saveAiReport error", e);
    }
  }
  db.aiReport = report;
  saveDB();
}

async function resetMySQL() {
  if (mysqlConfigured && pool) {
    try {
      await pool.query("DROP TABLE IF EXISTS db_users");
      await pool.query("DROP TABLE IF EXISTS db_destinations");
      await pool.query("DROP TABLE IF EXISTS db_questions");
      await pool.query("DROP TABLE IF EXISTS db_responses");
      await pool.query("DROP TABLE IF EXISTS db_logs");
      await pool.query("DROP TABLE IF EXISTS db_ai_reports");
      await bootstrapMySQLSchema();
      console.log("MySQL Database: Reset of cloud tables completed successfully.");
    } catch (e) {
      console.error("MySQL Database resetMySQL error", e);
    }
  }
}

// ---------------- API ENDPOINTS ----------------

// 1. MySQL Connectivity Status Indicator
app.get("/api/mysql-status", (req, res) => {
  res.json({
    configured: mysqlConfigured,
    status: mysqlStatus,
    hostInfo: mysqlHostInfo || "LocalStorage (SQLite mock or JSON fallback)",
    error: mysqlError,
    ssl: mysqlConfigured
  });
});

// Destinations
app.get("/api/destinations", async (req, res) => {
  const list = await getDestinations();
  res.json(list);
});

app.post("/api/destinations", async (req, res) => {
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
  await addDestination(newDest);

  // Add Log
  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Destination Added",
    details: `Added new destination: ${name} (${category})`
  });

  res.status(201).json(newDest);
});

app.put("/api/destinations/:id", async (req, res) => {
  const { id } = req.params;
  const { name, category, description, location } = req.body;
  
  const originalList = await getDestinations();
  const currentItem = originalList.find((d: any) => d.id === id);
  if (!currentItem) {
    return res.status(404).json({ error: "Destination not found" });
  }

  const updatedDest = {
    name: name || currentItem.name,
    category: category || currentItem.category,
    description: description !== undefined ? description : currentItem.description,
    location: location || currentItem.location,
    averageRating: currentItem.averageRating,
    totalReviews: currentItem.totalReviews
  };

  await updateDestination(id, updatedDest);

  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Destination Updated",
    details: `Modified details for: ${updatedDest.name}`
  });

  res.json({ id, ...updatedDest });
});

app.delete("/api/destinations/:id", async (req, res) => {
  const { id } = req.params;
  const originalList = await getDestinations();
  const currentItem = originalList.find((d: any) => d.id === id);
  if (!currentItem) {
    return res.status(404).json({ error: "Destination not found" });
  }

  const name = currentItem.name;
  await deleteDestination(id);

  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Destination Deleted",
    details: `Removed destination: ${name}`
  });

  res.json({ message: "Destination deleted" });
});


// Questions Group
app.get("/api/questions", async (req, res) => {
  const list = await getQuestions();
  res.json(list);
});

app.post("/api/questions", async (req, res) => {
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
  await addQuestion(newQ);

  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Survey Question Added",
    details: `Created new ${category} question.`
  });

  res.status(201).json(newQ);
});

app.put("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  const { text, category, type, isActive } = req.body;
  
  const originalList = await getQuestions();
  const currentItem = originalList.find((q: any) => q.id === id);
  if (!currentItem) {
    return res.status(404).json({ error: "Question not found" });
  }

  const updatedQ = {
    text: text !== undefined ? text : currentItem.text,
    category: category !== undefined ? category : currentItem.category,
    type: type !== undefined ? type : currentItem.type,
    isActive: isActive !== undefined ? !!isActive : currentItem.isActive
  };

  await updateQuestion(id, updatedQ);

  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Survey Question Updated",
    details: `Updated configuration of survey question ${id}.`
  });

  res.json({ id, ...updatedQ });
});

app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  const originalList = await getQuestions();
  const currentItem = originalList.find((q: any) => q.id === id);
  if (!currentItem) {
    return res.status(404).json({ error: "Question not found" });
  }

  await deleteQuestion(id);

  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Survey Question Deleted",
    details: `Deleted question ID ${id}.`
  });

  res.json({ message: "Question deleted" });
});


// Survey responses
app.get("/api/responses", async (req, res) => {
  const list = await getResponses();
  res.json(list);
});

app.post("/api/responses", async (req, res) => {
  const { touristName, touristEmail, nationality, ageGroup, destinationId, answers, feedbackText, encodedBy } = req.body;

  if (!touristName || !nationality || !destinationId || !answers) {
    return res.status(400).json({ error: "Tourist Name, nationality, destination, and survey answers are required" });
  }

  // Calculate overallRating based on the numeric rating answers
  let totalRatingSum = 0;
  let ratingCount = 0;
  const currentQuestions = await getQuestions();
  
  for (const qId of Object.keys(answers)) {
    const question = currentQuestions.find((q: any) => q.id === qId);
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

  await addResponse(newResponse);

  const currentDests = await getDestinations();
  const destItem = currentDests.find((d: any) => d.id === destinationId);

  // Create audit activity log item
  const isStaff = encodedBy && encodedBy !== "self";
  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: isStaff ? "Staff" : "Tourist",
    actorName: isStaff ? encodedBy : touristName,
    action: "Survey Response Submitted",
    details: `Survey submitted for ${destItem?.name || 'Destination'}. Average satisfaction: ${overallRating}/5`
  });

  res.status(201).json(newResponse);
});


// Audit logs
app.get("/api/logs", async (req, res) => {
  const list = await getLogs();
  res.json(list);
});


// User Accounts Group Admin Controller
app.get("/api/users", async (req, res) => {
  const list = await getUsers();
  res.json(list);
});

app.post("/api/users", async (req, res) => {
  const { name, email, role, username, password } = req.body;
  if (!name || !role || !username || !password) {
    return res.status(400).json({ error: "Name, role, username, and password are required" });
  }

  const userList = await getUsers();
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

  await addUser(newUser);

  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Created User Account",
    details: `Created new ${role} account for ${name} (username: ${username})`
  });

  res.status(201).json(newUser);
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const userList = await getUsers();
  const currentU = userList.find((u: any) => u.id === id);
  if (!currentU) {
    return res.status(404).json({ error: "User account not found" });
  }

  if (currentU.username === "admin") {
    return res.status(400).json({ error: "Cannot delete primary Administrator account" });
  }

  await deleteUser(id);

  await addLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    userRole: "Admin",
    actorName: "Director Rose ann Sumacot",
    action: "Deleted User Account",
    details: `Removed accounts access for ${currentU.role} member: ${currentU.name}`
  });

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
    
    await saveAiReport(sampleReports[0]);
    
    return res.json({
      report: sampleReports[0],
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

    const activeResponses = await getResponses();
    const activeDests = await getDestinations();
    const activeQuestions = await getQuestions();

    // Let's summarize our dataset for Gemini to analyze
    const summaryData = {
      totalResponses: activeResponses.length,
      destinations: activeDests.map((d: any) => ({ name: d.name, category: d.category, totalReviews: d.totalReviews, averageRating: d.averageRating })),
      questions: activeQuestions.filter((q: any) => q.isActive).map((q: any) => ({ text: q.text, category: q.category })),
      recentFeedbackList: activeResponses.slice(0, 15).map((r: any) => ({
        destination: activeDests.find((d: any) => d.id === r.destinationId)?.name || 'Unknown',
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

    await saveAiReport(parsedReport);

    res.json({
      report: parsedReport,
      isDemo: false
    });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: "Failed to generate AI survey analysis: " + error.message });
  }
});


// Get existing AI report
app.get("/api/ai-report", async (req, res) => {
  const r = await getAiReport();
  res.json(r);
});


// RESET DB back to default (useful for testing)
app.post("/api/reset-db", async (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
  } catch (e) {}
  
  db = initDB();
  await resetMySQL();
  res.json({ message: "Database reset to factory defaults", db });
});



// Vite middleware/Static serving
async function startServer() {
  // Try initializing cloud database connection prior to routing assets
  await initMySQL();

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
