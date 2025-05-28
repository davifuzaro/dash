import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Network,
  TrendingUp,
  Users,
  Settings,
  Bot,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Activity,
  Award,
  Zap,
  Menu,
  X,
  Loader2,
  LucideIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Tipos TypeScript
interface KPIData {
  totalLicenciados: number;
  licenciadosAtivos: number;
  taxaAtivacao: string;
  totalClientes: number;
  totalTelecom: number;
  crescimentoMensal: string;
}

interface Performer {
  codigo: string;
  nome: string;
  graduacao: string;
  clientesAtivos: number;
  clientesTelecom: number;
  licenciadosAtivos: number;
  cidade: string;
  uf: string;
  patrocinador: string;
}

interface GraduationData {
  name: string;
  value: number;
  color: string;
}

interface StateData {
  uf: string;
  total: number;
  ativos: number;
  clientes: number;
}

interface EvolutionData {
  month: string;
  ativos: number;
  inativos: number;
}

interface KPICardProps {
  title: string;
  value: string;
  change: number | string;
  icon: LucideIcon;
  trend: "up" | "down";
}

interface SidebarItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

const Dashboard: React.FC = () => {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Estados para dados reais
  const [kpis, setKpis] = useState<KPIData>({
    totalLicenciados: 0,
    licenciadosAtivos: 0,
    taxaAtivacao: "0",
    totalClientes: 0,
    totalTelecom: 0,
    crescimentoMensal: "0",
  });

  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [graduationData, setGraduationData] = useState<GraduationData[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar todos os dados ao montar o componente
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async (): Promise<void> => {
    try {
      setLoading(true);

      // Buscar todos os dados em paralelo
      const [kpisRes, performersRes, graduationRes, stateRes, evolutionRes] =
        await Promise.all([
          fetch("/api/dashboard/kpis"),
          fetch("/api/dashboard/top-performers"),
          fetch("/api/dashboard/by-graduation"),
          fetch("/api/dashboard/by-state"),
          fetch("/api/dashboard/evolution"),
        ]);

      // Verificar se todas as respostas estão ok
      if (
        !kpisRes.ok ||
        !performersRes.ok ||
        !graduationRes.ok ||
        !stateRes.ok ||
        !evolutionRes.ok
      ) {
        throw new Error("Erro ao buscar dados");
      }

      // Converter para JSON
      const [
        kpisData,
        performersData,
        graduationData,
        stateData,
        evolutionData,
      ] = await Promise.all([
        kpisRes.json(),
        performersRes.json(),
        graduationRes.json(),
        stateRes.json(),
        evolutionRes.json(),
      ]);

      // Atualizar estados
      setKpis(kpisData);
      setTopPerformers(performersData);
      setGraduationData(graduationData);
      setStateData(stateData);
      setEvolutionData(evolutionData);

      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados. Tente novamente.");
      setLoading(false);
    }
  };

  // Componente de KPI Card
  const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    change,
    icon: Icon,
    trend,
  }) => (
    <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
          <Icon className="w-5 h-5 text-emerald-500" />
        </div>
        <div
          className={`flex items-center text-sm ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}
        >
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span>{change}%</span>
        </div>
      </div>
      <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <div className="mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
          style={{
            width: `${parseFloat(change.toString()) > 0 ? Math.min(parseFloat(change.toString()) * 5, 100) : 50}%`,
          }}
        />
      </div>
    </div>
  );

  // Loading component
  const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  const sidebarItems: SidebarItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "network", icon: Network, label: "Rede" },
    { id: "analytics", icon: TrendingUp, label: "Analytics" },
    { id: "people", icon: Users, label: "Pessoas" },
    { id: "ai", icon: Bot, label: "IA Assistant" },
    { id: "settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 z-50 ${sidebarOpen ? "w-64" : "w-16"}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center space-x-3 ${!sidebarOpen && "justify-center"}`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && (
                <span className="font-bold text-lg">iGreen Energy</span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <nav className="px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === "dashboard") {
                  setLocation("/dashboard");
                } else {
                  setLocation(`/${item.id}`);
                }
              }}
              className={`w-full flex items-center ${sidebarOpen ? "justify-start" : "justify-center"} space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 group ${
                activeTab === item.id
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
              {sidebarOpen && activeTab === item.id && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-lg p-4 border border-emerald-500/20">
              <h4 className="font-semibold text-sm mb-1">Dashboard Pro</h4>
              <p className="text-xs text-zinc-400 mb-3">
                Recursos avançados disponíveis
              </p>
              <button
                onClick={fetchAllData}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-2 rounded-lg transition-colors text-sm"
              >
                Atualizar Dados
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:block p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <div className="hidden md:flex items-center space-x-2 text-sm text-zinc-400">
                  <span>Home</span>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white">Overview</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors w-64"
                  />
                </div>
                <button className="relative p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="font-semibold">A</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Date Filter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors">
                Hoje
              </button>
              <button className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-sm hover:bg-zinc-800 transition-all">
                7 dias
              </button>
              <button className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-sm hover:bg-zinc-800 transition-all">
                30 dias
              </button>
              <button className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-sm hover:bg-zinc-800 transition-all">
                12 meses
              </button>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-colors font-medium">
              <Activity className="w-4 h-4" />
              <span>Exportar Relatório</span>
            </button>
          </div>

          {/* KPI Cards */}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard
                  title="Licenciados Ativos"
                  value={kpis.licenciadosAtivos.toLocaleString("pt-BR")}
                  change={kpis.crescimentoMensal}
                  icon={Users}
                  trend="up"
                />
                <KPICard
                  title="Taxa de Ativação"
                  value={`${kpis.taxaAtivacao}%`}
                  change={5.2}
                  icon={UserCheck}
                  trend="up"
                />
                <KPICard
                  title="Total de Clientes"
                  value={kpis.totalClientes.toLocaleString("pt-BR")}
                  change={8.3}
                  icon={Activity}
                  trend="up"
                />
                <KPICard
                  title="Clientes Telecom"
                  value={kpis.totalTelecom.toLocaleString("pt-BR")}
                  change={12.1}
                  icon={TrendingUp}
                  trend="up"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Evolution Chart */}
                <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Evolução da Rede</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-zinc-400">Ativos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-zinc-400">Inativos</span>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={evolutionData}>
                      <defs>
                        <linearGradient
                          id="colorAtivos"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10B981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10B981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorInativos"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#EF4444"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#EF4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="month" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #27272a",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="ativos"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorAtivos)"
                      />
                      <Area
                        type="monotone"
                        dataKey="inativos"
                        stroke="#EF4444"
                        fillOpacity={1}
                        fill="url(#colorInativos)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Graduation Distribution */}
                <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-6 border border-zinc-800">
                  <h3 className="text-lg font-semibold mb-6">
                    Distribuição por Graduação
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={graduationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          value > 0 ? `${name} (${value})` : ""
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {graduationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #27272a",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top States Bar Chart */}
              <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-6 border border-zinc-800 mb-8">
                <h3 className="text-lg font-semibold mb-6">Top 10 Estados</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="uf" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="total" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    <Bar
                      dataKey="ativos"
                      fill="#10B981"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Performers Table */}
              <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl border border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Top Performers</h3>
                    <button className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
                      Ver todos
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Licenciado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Graduação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Clientes Ativos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Clientes Telecom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Cidade/UF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {topPerformers.map((performer, index) => (
                        <tr
                          key={performer.codigo}
                          className="hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mr-3">
                                <span className="font-semibold">
                                  {performer.nome.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium">
                                  {performer.nome}
                                </div>
                                <div className="text-xs text-zinc-400">
                                  ID: {performer.codigo}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                performer.graduacao === "Acionista"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : performer.graduacao === "Diretor"
                                    ? "bg-gray-500/20 text-gray-400"
                                    : performer.graduacao === "Executivo"
                                      ? "bg-orange-500/20 text-orange-500"
                                      : performer.graduacao === "Gestor"
                                        ? "bg-emerald-500/20 text-emerald-500"
                                        : "bg-blue-500/20 text-blue-500"
                              }`}
                            >
                              {performer.graduacao}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {performer.clientesAtivos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {performer.clientesTelecom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                            {performer.cidade}/{performer.uf}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Achievement Banner */}
          <div className="mt-8 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-xl p-6 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <Award className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">
                    Dashboard Conectado ao Google Sheets!
                  </h4>
                  <p className="text-zinc-400 text-sm mt-1">
                    Dados de {kpis.totalLicenciados.toLocaleString("pt-BR")}{" "}
                    licenciados sendo atualizados em tempo real.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchAllData}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-colors font-medium"
              >
                Atualizar Agora
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
