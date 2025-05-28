import { 
  users, metrics, analytics, activities, appUsers, settings,
  licenciados, networkTree, syncLogs,
  type User, type InsertUser, 
  type Metric, type InsertMetric,
  type Analytics, type InsertAnalytics,
  type Activity, type InsertActivity,
  type AppUser, type InsertAppUser,
  type Settings, type InsertSettings,
  type Licenciado, type InsertLicenciado,
  type NetworkTree, type InsertNetworkTree, type NetworkNode,
  type SyncLog, type InsertSyncLog, type KPIData,
  type LicenciadoQuery
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Metrics
  getMetrics(): Promise<Metric[]>;
  createMetric(metric: InsertMetric): Promise<Metric>;
  
  // Analytics
  getAnalytics(days?: number): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  
  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // App Users
  getAppUsers(): Promise<AppUser[]>;
  createAppUser(user: InsertAppUser): Promise<AppUser>;
  updateAppUser(id: number, updates: Partial<InsertAppUser>): Promise<AppUser | undefined>;
  deleteAppUser(id: number): Promise<boolean>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
  
  // Licenciados
  getLicenciados(query: LicenciadoQuery): Promise<{ data: Licenciado[]; total: number; page: number; totalPages: number }>;
  getLicenciado(id: number): Promise<Licenciado | undefined>;
  createLicenciado(licenciado: InsertLicenciado): Promise<Licenciado>;
  updateLicenciado(id: number, updates: Partial<InsertLicenciado>): Promise<Licenciado | undefined>;
  deleteLicenciado(id: number): Promise<boolean>;
  bulkCreateLicenciados(licenciados: InsertLicenciado[]): Promise<Licenciado[]>;
  
  // Network Tree
  getNetworkTree(rootId?: number): Promise<NetworkNode[]>;
  createNetworkNode(node: InsertNetworkTree): Promise<NetworkTree>;
  updateNetworkNode(id: number, updates: Partial<InsertNetworkTree>): Promise<NetworkTree | undefined>;
  
  // KPIs
  getKPIs(): Promise<KPIData>;
  
  // Sync Logs
  getSyncLogs(limit?: number): Promise<SyncLog[]>;
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private metrics: Map<number, Metric>;
  private analytics: Map<number, Analytics>;
  private activities: Map<number, Activity>;
  private appUsers: Map<number, AppUser>;
  private settings: Settings | undefined;
  private licenciados: Map<number, Licenciado>;
  private networkNodes: Map<number, NetworkTree>;
  private syncLogs: Map<number, SyncLog>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.metrics = new Map();
    this.analytics = new Map();
    this.activities = new Map();
    this.appUsers = new Map();
    this.licenciados = new Map();
    this.networkNodes = new Map();
    this.syncLogs = new Map();
    this.currentId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Initialize metrics
    const sampleMetrics: Metric[] = [
      { id: 1, name: "Receita Total", value: "245670", change: "12.5", changeType: "increase", period: "vs mês anterior", category: "revenue", createdAt: new Date() },
      { id: 2, name: "Usuários Ativos", value: "18247", change: "8.3", changeType: "increase", period: "vs mês anterior", category: "users", createdAt: new Date() },
      { id: 3, name: "Pedidos", value: "1429", change: "-2.1", changeType: "decrease", period: "vs mês anterior", category: "orders", createdAt: new Date() },
      { id: 4, name: "Taxa Conversão", value: "3.24", change: "0.8", changeType: "increase", period: "vs mês anterior", category: "conversion", createdAt: new Date() },
    ];
    
    sampleMetrics.forEach(metric => this.metrics.set(metric.id, metric));

    // Initialize analytics data for the last 30 days
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const analyticsData: Analytics = {
        id: 30 - i,
        date: dateStr,
        revenue: (Math.random() * 50000 + 150000).toFixed(2),
        users: Math.floor(Math.random() * 5000 + 15000),
        orders: Math.floor(Math.random() * 200 + 1200),
        conversionRate: (Math.random() * 2 + 2.5).toFixed(2),
        organicTraffic: (Math.random() * 20 + 35).toFixed(1),
        socialTraffic: (Math.random() * 15 + 20).toFixed(1),
        directTraffic: (Math.random() * 10 + 10).toFixed(1),
        emailTraffic: (Math.random() * 15 + 5).toFixed(1),
      };
      
      this.analytics.set(analyticsData.id, analyticsData);
    }

    // Initialize activities
    const sampleActivities: Activity[] = [
      { id: 1, type: "user", title: "Novo usuário registrado", description: "maria.silva@email.com se juntou à plataforma", timestamp: new Date(Date.now() - 2 * 60 * 1000), userId: null },
      { id: 2, type: "order", title: "Novo pedido #1247", description: "Pedido no valor de R$ 189,90", timestamp: new Date(Date.now() - 5 * 60 * 1000), userId: null },
      { id: 3, type: "payment", title: "Pagamento processado", description: "Transação #TX-7892 aprovada", timestamp: new Date(Date.now() - 12 * 60 * 1000), userId: null },
    ];
    
    sampleActivities.forEach(activity => this.activities.set(activity.id, activity));

    // Initialize app users
    const sampleAppUsers: AppUser[] = [
      { id: 1, name: "Ana Beatriz", email: "ana.beatriz@email.com", status: "active", lastAccess: new Date(Date.now() - 2 * 60 * 60 * 1000), avatar: "AB" },
      { id: 2, name: "Carlos Santos", email: "carlos.santos@email.com", status: "inactive", lastAccess: new Date(Date.now() - 24 * 60 * 60 * 1000), avatar: "CS" },
      { id: 3, name: "Diana Costa", email: "diana.costa@email.com", status: "active", lastAccess: new Date(Date.now() - 30 * 60 * 1000), avatar: "DC" },
    ];
    
    sampleAppUsers.forEach(user => this.appUsers.set(user.id, user));

    // Initialize settings
    this.settings = {
      id: 1,
      companyName: "Minha Empresa Ltd.",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      darkMode: true,
      animations: true,
      sounds: false,
    };

    // Initialize sample licenciados data
    const sampleLicenciados: Licenciado[] = [
      { 
        id: 1, codigo: 1001, nome: "João Silva", status: "ativo", 
        clientesAtivos: 45, clientesTelecom: 12, graduacao: "Diamante",
        patrocinadorId: null, cidade: "São Paulo", uf: "SP",
        dataAtivacao: new Date('2023-01-15'), createdAt: new Date(), updatedAt: new Date()
      },
      { 
        id: 2, codigo: 1002, nome: "Maria Santos", status: "ativo", 
        clientesAtivos: 32, clientesTelecom: 8, graduacao: "Ouro",
        patrocinadorId: 1, cidade: "Rio de Janeiro", uf: "RJ",
        dataAtivacao: new Date('2023-02-20'), createdAt: new Date(), updatedAt: new Date()
      },
      { 
        id: 3, codigo: 1003, nome: "Carlos Oliveira", status: "pendente", 
        clientesAtivos: 15, clientesTelecom: 3, graduacao: "Prata",
        patrocinadorId: 1, cidade: "Belo Horizonte", uf: "MG",
        dataAtivacao: new Date('2023-03-10'), createdAt: new Date(), updatedAt: new Date()
      },
    ];
    
    sampleLicenciados.forEach(licenciado => this.licenciados.set(licenciado.id, licenciado));

    // Initialize network tree
    const sampleNetworkNodes: NetworkTree[] = [
      { id: 1, licenciadoId: 1, parentId: null, level: 0, path: "1", createdAt: new Date() },
      { id: 2, licenciadoId: 2, parentId: 1, level: 1, path: "1.2", createdAt: new Date() },
      { id: 3, licenciadoId: 3, parentId: 1, level: 1, path: "1.3", createdAt: new Date() },
    ];
    
    sampleNetworkNodes.forEach(node => this.networkNodes.set(node.id, node));

    this.currentId = 100;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMetrics(): Promise<Metric[]> {
    return Array.from(this.metrics.values());
  }

  async createMetric(insertMetric: InsertMetric): Promise<Metric> {
    const id = this.currentId++;
    const metric: Metric = { ...insertMetric, id, createdAt: new Date() };
    this.metrics.set(id, metric);
    return metric;
  }

  async getAnalytics(days: number = 30): Promise<Analytics[]> {
    const allAnalytics = Array.from(this.analytics.values());
    return allAnalytics
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = this.currentId++;
    const analytics: Analytics = { ...insertAnalytics, id };
    this.analytics.set(id, analytics);
    return analytics;
  }

  async getActivities(limit: number = 10): Promise<Activity[]> {
    const allActivities = Array.from(this.activities.values());
    return allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentId++;
    const activity: Activity = { ...insertActivity, id, timestamp: new Date() };
    this.activities.set(id, activity);
    return activity;
  }

  async getAppUsers(): Promise<AppUser[]> {
    return Array.from(this.appUsers.values());
  }

  async createAppUser(insertAppUser: InsertAppUser): Promise<AppUser> {
    const id = this.currentId++;
    const user: AppUser = { ...insertAppUser, id, lastAccess: new Date() };
    this.appUsers.set(id, user);
    return user;
  }

  async updateAppUser(id: number, updates: Partial<InsertAppUser>): Promise<AppUser | undefined> {
    const existingUser = this.appUsers.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: AppUser = { ...existingUser, ...updates };
    this.appUsers.set(id, updatedUser);
    return updatedUser;
  }

  async deleteAppUser(id: number): Promise<boolean> {
    return this.appUsers.delete(id);
  }

  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const settings: Settings = { ...insertSettings, id: 1 };
    this.settings = settings;
    return settings;
  }

  // Licenciados methods
  async getLicenciados(query: LicenciadoQuery): Promise<{ data: Licenciado[]; total: number; page: number; totalPages: number }> {
    let allLicenciados = Array.from(this.licenciados.values());

    // Apply filters
    if (query.search) {
      const search = query.search.toLowerCase();
      allLicenciados = allLicenciados.filter(l => 
        l.nome.toLowerCase().includes(search) ||
        l.codigo.toString().includes(search) ||
        l.cidade.toLowerCase().includes(search)
      );
    }

    if (query.status) {
      allLicenciados = allLicenciados.filter(l => l.status === query.status);
    }

    if (query.uf) {
      allLicenciados = allLicenciados.filter(l => l.uf === query.uf);
    }

    if (query.graduacao) {
      allLicenciados = allLicenciados.filter(l => l.graduacao === query.graduacao);
    }

    // Apply sorting
    allLicenciados.sort((a, b) => {
      const aValue = a[query.sortBy];
      const bValue = b[query.sortBy];
      
      if (query.sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Apply pagination
    const total = allLicenciados.length;
    const totalPages = Math.ceil(total / query.limit);
    const offset = (query.page - 1) * query.limit;
    const data = allLicenciados.slice(offset, offset + query.limit);

    return { data, total, page: query.page, totalPages };
  }

  async getLicenciado(id: number): Promise<Licenciado | undefined> {
    return this.licenciados.get(id);
  }

  async createLicenciado(insertLicenciado: InsertLicenciado): Promise<Licenciado> {
    const id = this.currentId++;
    const licenciado: Licenciado = { 
      ...insertLicenciado, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.licenciados.set(id, licenciado);
    return licenciado;
  }

  async updateLicenciado(id: number, updates: Partial<InsertLicenciado>): Promise<Licenciado | undefined> {
    const existingLicenciado = this.licenciados.get(id);
    if (!existingLicenciado) return undefined;
    
    const updatedLicenciado: Licenciado = { 
      ...existingLicenciado, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.licenciados.set(id, updatedLicenciado);
    return updatedLicenciado;
  }

  async deleteLicenciado(id: number): Promise<boolean> {
    return this.licenciados.delete(id);
  }

  async bulkCreateLicenciados(insertLicenciados: InsertLicenciado[]): Promise<Licenciado[]> {
    const licenciados: Licenciado[] = [];
    
    for (const insertLicenciado of insertLicenciados) {
      const id = this.currentId++;
      const licenciado: Licenciado = { 
        ...insertLicenciado, 
        id, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      this.licenciados.set(id, licenciado);
      licenciados.push(licenciado);
    }
    
    return licenciados;
  }

  // Network Tree methods
  async getNetworkTree(rootId?: number): Promise<NetworkNode[]> {
    const allNodes = Array.from(this.networkNodes.values());
    const allLicenciados = Array.from(this.licenciados.values());
    
    // Build hierarchy
    const buildTree = (parentId: number | null, level: number = 0): NetworkNode[] => {
      return allNodes
        .filter(node => node.parentId === parentId)
        .map(node => {
          const licenciado = allLicenciados.find(l => l.id === node.licenciadoId);
          if (!licenciado) return null;
          
          const networkNode: NetworkNode = {
            ...licenciado,
            level: node.level,
            parentId: node.parentId,
            children: buildTree(node.licenciadoId, level + 1)
          };
          
          return networkNode;
        })
        .filter(Boolean) as NetworkNode[];
    };
    
    return buildTree(rootId || null);
  }

  async createNetworkNode(insertNode: InsertNetworkTree): Promise<NetworkTree> {
    const id = this.currentId++;
    const node: NetworkTree = { ...insertNode, id, createdAt: new Date() };
    this.networkNodes.set(id, node);
    return node;
  }

  async updateNetworkNode(id: number, updates: Partial<InsertNetworkTree>): Promise<NetworkTree | undefined> {
    const existingNode = this.networkNodes.get(id);
    if (!existingNode) return undefined;
    
    const updatedNode: NetworkTree = { ...existingNode, ...updates };
    this.networkNodes.set(id, updatedNode);
    return updatedNode;
  }

  // KPIs method
  async getKPIs(): Promise<KPIData> {
    const allLicenciados = Array.from(this.licenciados.values());
    
    const totalLicenciados = allLicenciados.length;
    const licenciadosAtivos = allLicenciados.filter(l => l.status === 'ativo').length;
    const clientesTotais = allLicenciados.reduce((sum, l) => sum + l.clientesAtivos, 0);
    const clientesTelecom = allLicenciados.reduce((sum, l) => sum + l.clientesTelecom, 0);
    
    // Calculate monthly growth (mock calculation)
    const currentMonth = new Date().getMonth();
    const lastMonthLicenciados = allLicenciados.filter(l => 
      new Date(l.dataAtivacao).getMonth() === currentMonth - 1
    ).length;
    const crescimentoMensal = lastMonthLicenciados > 0 
      ? ((totalLicenciados - lastMonthLicenciados) / lastMonthLicenciados) * 100 
      : 0;

    return {
      totalLicenciados,
      licenciadosAtivos,
      clientesTotais,
      clientesTelecom,
      crescimentoMensal
    };
  }

  // Sync Logs methods
  async getSyncLogs(limit: number = 10): Promise<SyncLog[]> {
    const allLogs = Array.from(this.syncLogs.values());
    return allLogs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createSyncLog(insertLog: InsertSyncLog): Promise<SyncLog> {
    const id = this.currentId++;
    const log: SyncLog = { ...insertLog, id, createdAt: new Date() };
    this.syncLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
