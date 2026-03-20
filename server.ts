import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', (req, res, next) => {
      // If it's an API request, let it pass through (though API routes are defined above)
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
