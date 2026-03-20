import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Startup diagnostics
  console.log(`[Startup] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Startup] Current working directory: ${process.cwd()}`);
  console.log(`[Startup] __dirname: ${__dirname}`);

  const distPath = path.resolve(process.cwd(), 'dist');
  console.log(`[Startup] Expected dist path: ${distPath}`);

  if (fs.existsSync(distPath)) {
    console.log(`[Startup] dist directory exists.`);
    const files = fs.readdirSync(distPath);
    console.log(`[Startup] dist contents: ${files.join(', ')}`);
    
    if (fs.existsSync(path.join(distPath, 'index.html'))) {
      console.log(`[Startup] dist/index.html exists.`);
      const stats = fs.statSync(path.join(distPath, 'index.html'));
      console.log(`[Startup] dist/index.html size: ${stats.size} bytes`);
    } else {
      console.error(`[Startup] dist/index.html MISSING!`);
    }
  } else {
    console.error(`[Startup] dist directory MISSING!`);
  }

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Log requests in production to help diagnose blank screen
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  app.get("/api/medicine-prices", async (req, res) => {
    const { medicine } = req.query;
    if (!medicine) {
      return res.status(400).json({ error: "Medicine name is required" });
    }

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate realistic mock prices based on the medicine name
      const basePrice = Math.floor(Math.random() * 150) + 20;
      
      const results = [
        {
          pharmacy: "Apollo Pharmacy",
          price: `₹${basePrice + 5}.00`,
          extracted_price: basePrice + 5,
          link: "https://www.apollopharmacy.in",
          thumbnail: "https://www.apollopharmacy.in/favicon.ico"
        },
        {
          pharmacy: "Netmeds",
          price: `₹${basePrice}.00`,
          extracted_price: basePrice,
          link: "https://www.netmeds.com",
          thumbnail: "https://www.netmeds.com/favicon.ico"
        },
        {
          pharmacy: "1mg",
          price: `₹${basePrice + 2}.00`,
          extracted_price: basePrice + 2,
          link: "https://www.1mg.com",
          thumbnail: "https://www.1mg.com/favicon.ico"
        }
      ];

      res.json({ results });
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices from pharmacy API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist
    console.log(`[Production] Serving static files from: ${distPath}`);
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', (req, res, next) => {
      // If it's an API request, let it pass through
      if (req.path.startsWith('/api')) {
        return next();
      }
      
      // If it's a request for a file that doesn't exist (e.g. .js, .css), 
      // don't send index.html as it will cause syntax errors in the browser.
      // Instead, send a 404.
      const ext = path.extname(req.path);
      if (ext && ext !== '.html') {
        console.warn(`[Production] 404 for file: ${req.path}`);
        return res.status(404).send('Not found');
      }

      console.log(`[Production] Sending index.html for: ${req.url}`);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
