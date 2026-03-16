import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/health', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok' }));
      });

      server.middlewares.use('/api/medicine-prices', async (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const medicine = url.searchParams.get('medicine');
        
        if (!medicine) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Medicine name is required' }));
          return;
        }

        try {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 800));

          // Generate realistic mock prices based on the medicine name
          const basePrice = Math.floor(Math.random() * 150) + 20;
          
          const results = [
            {
              pharmacy: 'Apollo Pharmacy',
              price: `₹${basePrice + 5}.00`,
              extracted_price: basePrice + 5,
              link: 'https://www.apollopharmacy.in',
              thumbnail: 'https://ui-avatars.com/api/?name=Apollo+Pharmacy&background=0284c7&color=fff&rounded=true&bold=true'
            },
            {
              pharmacy: 'Netmeds',
              price: `₹${basePrice}.00`,
              extracted_price: basePrice,
              link: 'https://www.netmeds.com',
              thumbnail: 'https://ui-avatars.com/api/?name=Netmeds&background=059669&color=fff&rounded=true&bold=true'
            },
            {
              pharmacy: '1mg',
              price: `₹${basePrice + 2}.00`,
              extracted_price: basePrice + 2,
              link: 'https://www.1mg.com',
              thumbnail: 'https://ui-avatars.com/api/?name=1mg&background=ea580c&color=fff&rounded=true&bold=true'
            }
          ];

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ results }));
        } catch (error) {
          console.error('Error fetching prices:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to fetch prices from pharmacy API' }));
        }
      });
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
