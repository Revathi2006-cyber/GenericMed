import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

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
          thumbnail: "https://ui-avatars.com/api/?name=Apollo+Pharmacy&background=0284c7&color=fff&rounded=true&bold=true"
        },
        {
          pharmacy: "Netmeds",
          price: `₹${basePrice}.00`,
          extracted_price: basePrice,
          link: "https://www.netmeds.com",
          thumbnail: "https://ui-avatars.com/api/?name=Netmeds&background=059669&color=fff&rounded=true&bold=true"
        },
        {
          pharmacy: "1mg",
          price: `₹${basePrice + 2}.00`,
          extracted_price: basePrice + 2,
          link: "https://www.1mg.com",
          thumbnail: "https://ui-avatars.com/api/?name=1mg&background=ea580c&color=fff&rounded=true&bold=true"
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
