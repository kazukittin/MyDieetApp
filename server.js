const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "0.0.0.0";
const root = __dirname;
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "entries.json");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

ensureDataFile();

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (url.pathname === "/api/entries") {
    handleEntries(request, response);
    return;
  }

  serveStatic(url.pathname, response);
});

server.listen(port, host, () => {
  const addresses = getLocalAddresses();
  console.log("My Diet Notebook is running.");
  console.log(`PC: http://localhost:${port}`);
  addresses.forEach((address) => console.log(`Phone: http://${address}:${port}`));
});

function handleEntries(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, readEntries());
    return;
  }

  if (request.method === "PUT") {
    readBody(request)
      .then((body) => {
        const entries = JSON.parse(body || "[]");
        if (!Array.isArray(entries)) {
          sendJson(response, 400, { error: "Entries must be an array." });
          return;
        }

        const cleaned = entries.map(normalizeEntry).filter(Boolean);
        writeEntries(cleaned);
        sendJson(response, 200, cleaned);
      })
      .catch(() => {
        sendJson(response, 400, { error: "Could not save entries." });
      });
    return;
  }

  sendJson(response, 405, { error: "Method not allowed." });
}

function serveStatic(pathname, response) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(root, safePath));

  if (!filePath.startsWith(root) || filePath.startsWith(dataDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function readEntries() {
  try {
    const entries = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  fs.writeFileSync(dataFile, `${JSON.stringify(entries, null, 2)}\n`);
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(dataFile)) writeEntries([]);
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object" || typeof entry.date !== "string") return null;
  const weightMorning = numberOrNull(entry.weightMorning);
  const weightNight = numberOrNull(entry.weightNight);
  const weight = weightNight ?? weightMorning ?? numberOrNull(entry.weight);
  return {
    date: entry.date,
    weight,
    weightMorning,
    weightNight,
    sleep: numberOrNull(entry.sleep),
    intakeCalories: numberOrNull(entry.intakeCalories),
    burnCalories: numberOrNull(entry.burnCalories),
    exerciseMinutes: numberOrNull(entry.exerciseMinutes),
    exerciseType: typeof entry.exerciseType === "string" ? entry.exerciseType : "",
    exerciseIntensity: typeof entry.exerciseIntensity === "string" ? entry.exerciseIntensity : "normal",
    exerciseNote: typeof entry.exerciseNote === "string" ? entry.exerciseNote : "",
    meal: clampNumber(entry.meal, 1, 3, 2),
    meals: Array.isArray(entry.meals) ? entry.meals.filter((item) => typeof item === "string") : [],
    habits: Array.isArray(entry.habits) ? entry.habits.filter((item) => typeof item === "string") : [],
    mood: typeof entry.mood === "string" ? entry.mood : "calm",
    note: typeof entry.note === "string" ? entry.note : "",
    updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date().toISOString(),
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}
