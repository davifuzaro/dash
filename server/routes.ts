import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMetricSchema, insertAnalyticsSchema, insertActivitySchema, 
  insertAppUserSchema, insertSettingsSchema, insertLicenciadoSchema,
  licenciadoQuerySchema, insertSyncLogSchema
} from "@shared/schema";
import { GoogleSheetsService, cacheService } from "./services/google-sheets";
import { aiService } from "./services/ai-service";
// import createCsvWriter from 'csv-writer'; // Removed for now, implementing simple CSV export

export async function registerRoutes(app: Express): Promise<Server> {
  // Metrics endpoints
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.post("/api/metrics", async (req, res) => {
    try {
      const validatedData = insertMetricSchema.parse(req.body);
      const metric = await storage.createMetric(validatedData);
      res.status(201).json(metric);
    } catch (error) {
      res.status(400).json({ message: "Invalid metric data" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const analytics = await storage.getAnalytics(days);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics", async (req, res) => {
    try {
      const validatedData = insertAnalyticsSchema.parse(req.body);
      const analytics = await storage.createAnalytics(validatedData);
      res.status(201).json(analytics);
    } catch (error) {
      res.status(400).json({ message: "Invalid analytics data" });
    }
  });

  // Activities endpoints
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ message: "Invalid activity data" });
    }
  });

  // App Users endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAppUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertAppUserSchema.parse(req.body);
      const user = await storage.createAppUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateAppUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAppUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  // Licenciados endpoints
  app.get("/api/licenciados", async (req, res) => {
    try {
      const query = licenciadoQuerySchema.parse(req.query);
      const result = await storage.getLicenciados(query);
      res.json(result);
    } catch (error) {
      console.error('Error fetching licenciados:', error);
      res.status(400).json({ message: "Invalid query parameters" });
    }
  });

  app.get("/api/licenciados/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const licenciado = await storage.getLicenciado(id);
      if (!licenciado) {
        return res.status(404).json({ message: "Licenciado not found" });
      }
      res.json(licenciado);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch licenciado" });
    }
  });

  app.post("/api/licenciados", async (req, res) => {
    try {
      const validatedData = insertLicenciadoSchema.parse(req.body);
      const licenciado = await storage.createLicenciado(validatedData);
      res.status(201).json(licenciado);
    } catch (error) {
      res.status(400).json({ message: "Invalid licenciado data" });
    }
  });

  app.put("/api/licenciados/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertLicenciadoSchema.partial().parse(req.body);
      const licenciado = await storage.updateLicenciado(id, updates);
      if (!licenciado) {
        return res.status(404).json({ message: "Licenciado not found" });
      }
      res.json(licenciado);
    } catch (error) {
      res.status(400).json({ message: "Invalid licenciado data" });
    }
  });

  app.delete("/api/licenciados/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLicenciado(id);
      if (!deleted) {
        return res.status(404).json({ message: "Licenciado not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete licenciado" });
    }
  });

  // Analytics KPIs endpoint
  app.get("/api/analytics/kpis", async (req, res) => {
    try {
      const cacheKey = "analytics:kpis";
      let kpis = cacheService.get(cacheKey);
      
      if (!kpis) {
        kpis = await storage.getKPIs();
        cacheService.set(cacheKey, kpis, 30); // Cache for 30 minutes
      }
      
      res.json(kpis);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  // Network tree endpoint
  app.get("/api/network/tree/:id?", async (req, res) => {
    try {
      const rootId = req.params.id ? parseInt(req.params.id) : undefined;
      const cacheKey = `network:tree:${rootId || 'root'}`;
      
      let tree = cacheService.get(cacheKey);
      if (!tree) {
        tree = await storage.getNetworkTree(rootId);
        cacheService.set(cacheKey, tree, 15); // Cache for 15 minutes
      }
      
      res.json(tree);
    } catch (error) {
      console.error('Error fetching network tree:', error);
      res.status(500).json({ message: "Failed to fetch network tree" });
    }
  });

  // Google Sheets sync endpoint
  app.post("/api/sync/sheets", async (req, res) => {
    try {
      const { spreadsheetId, range } = req.body;
      
      if (!spreadsheetId || !range) {
        return res.status(400).json({ 
          message: "spreadsheetId and range are required" 
        });
      }

      // Create sync log
      const syncLog = await storage.createSyncLog({
        source: 'google_sheets',
        status: 'pending',
        recordsProcessed: 0,
        errorMessage: null,
        metadata: JSON.stringify({ spreadsheetId, range })
      });

      // For now, return the log ID - real sync would be implemented with proper credentials
      res.json({ 
        syncId: syncLog.id,
        status: 'pending',
        message: 'Sync initiated. Please provide Google Sheets credentials to complete the sync.'
      });
      
    } catch (error) {
      console.error('Error initiating sync:', error);
      res.status(500).json({ message: "Failed to initiate sync" });
    }
  });

  // Export endpoints
  app.get("/api/export/licenciados", async (req, res) => {
    try {
      const query = licenciadoQuerySchema.parse(req.query);
      const { data } = await storage.getLicenciados({ ...query, limit: 10000 });
      
      const format = req.query.format as string || 'json';
      
      if (format === 'csv') {
        const csvData = data.map(l => ({
          codigo: l.codigo,
          nome: l.nome,
          status: l.status,
          clientesAtivos: l.clientesAtivos,
          clientesTelecom: l.clientesTelecom,
          graduacao: l.graduacao,
          cidade: l.cidade,
          uf: l.uf,
          dataAtivacao: l.dataAtivacao.toISOString().split('T')[0]
        }));
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=licenciados.csv');
        
        // Simple CSV conversion
        const headers = Object.keys(csvData[0] || {});
        const csvContent = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
        ].join('\n');
        
        res.send(csvContent);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error('Error exporting licenciados:', error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Sync logs endpoint
  app.get("/api/sync/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const logs = await storage.getSyncLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sync logs" });
    }
  });

  // AI Analytics endpoints
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const insights = await aiService.analyzeData();
      res.json(insights);
    } catch (error) {
      console.error('AI insights error:', error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const response = await aiService.chatQuery(message, context);
      res.json(response);
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ message: "Failed to process chat query" });
    }
  });

  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const result = await aiService.generateNaturalLanguageQuery(query);
      res.json(result);
    } catch (error) {
      console.error('AI query error:', error);
      res.status(500).json({ message: "Failed to process natural language query" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
