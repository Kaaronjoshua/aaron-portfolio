import 'dotenv/config';
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname + "/public"));

// EJS setup
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.get("/", (req, res) => {
  res.render("index", { page: "home" });
});

app.get("/about", (req, res) => {
  res.render("about", { page: "about" });
});

app.get("/projects", (req, res) => {
  res.render("projects", { page: "projects" });
});

app.get("/experience", (req, res) => {
  res.render("experience", { page: "experience" });
});

app.get("/achievements", (req, res) => {
  res.render("achievements", { page: "achievements" });
});

app.get("/contact", (req, res) => {
  res.render("contact", { page: "contact" });
});

// ── Contact form submission ──
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  const webhookUrl = process.env.APPS_SCRIPT_URL;
  if (!webhookUrl || webhookUrl.includes("YOUR_DEPLOYMENT_ID")) {
    return res.status(500).json({ success: false, error: "Webhook not configured." });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: "contact", name, email, extra: subject, message }),
      redirect: "follow",
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to reach webhook." });
  }
});

// ── Experience "Join" form submission ──
app.post("/api/join", async (req, res) => {
  const { name, email, profession } = req.body;

  if (!name || !email || !profession) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  const webhookUrl = process.env.APPS_SCRIPT_URL;
  if (!webhookUrl || webhookUrl.includes("YOUR_DEPLOYMENT_ID")) {
    return res.status(500).json({ success: false, error: "Webhook not configured." });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: "experience", name, email, extra: profession }),
      redirect: "follow",
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to reach webhook." });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
