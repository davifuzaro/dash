import { memo, Suspense } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "./KPICard";
import { AdvancedCharts } from "./AdvancedCharts";
import { LeaderboardTable } from "./LeaderboardTable";
import { Card, CardContent } from "@/components/ui/card";

// Mock data generators para o dashboard premium
const generateKPIData = () => {
  const sparklineData = Array.from({ length: 7 }, (_, i) => ({
    value: Math.random() * 100 + 50,
    label: `Dia ${i + 1}`,
  }));

  return [
    {
      title: "Receita Total",
      value: 847250,
      change: 12.5,
      changeType: "increase" as const,
      period: "vs. mês anterior",
      icon: DollarSign,
      color: "emerald",
      sparklineData,
      target: 1000000,
      format: "currency" as const,
    },
    {
      title: "Licenciados Ativos",
      value: 2456,
      change: 8.2,
      changeType: "increase" as const,
      period: "vs. mês anterior",
      icon: Users,
      color: "blue",
      sparklineData: sparklineData.map((d) => ({ ...d, value: d.value * 0.8 })),
      target: 3000,
      format: "number" as const,
    },
    {
      title: "Taxa de Conversão",
      value: 18.6,
      change: 2.1,
      changeType: "increase" as const,
      period: "vs. mês anterior",
      icon: Target,
      color: "purple",
      sparklineData: sparklineData.map((d) => ({ ...d, value: d.value * 0.2 })),
      target: 25,
      format: "percentage" as const,
    },
    {
      title: "Crescimento Mensal",
      value: 34.8,
      change: 15.3,
      changeType: "increase" as const,
      period: "vs. mês anterior",
      icon: TrendingUp,
      color: "orange",
      sparklineData: sparklineData.map((d) => ({ ...d, value: d.value * 0.4 })),
      target: 40,
      format: "percentage" as const,
    },
    {
      title: "NPS Score",
      value: 87,
      change: 4.2,
      changeType: "increase" as const,
      period: "vs. trimestre anterior",
      icon: Zap,
      color: "pink",
      sparklineData: sparklineData.map((d) => ({ ...d, value: d.value * 0.9 })),
      target: 90,
      format: "number" as const,
    },
    {
      title: "ROI Marketing",
      value: 312.5,
      change: 18.7,
      changeType: "increase" as const,
      period: "vs. mês anterior",
      icon: BarChart3,
      color: "blue",
      sparklineData: sparklineData.map((d) => ({ ...d, value: d.value * 3 })),
      target: 400,
      format: "percentage" as const,
    },
  ];
};

const generateLeaderboardData = () => [
  {
    id: 1,
    name: "Ana Silva",
    email: "ana@empresa.com",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=ana`,
    revenue: 245680,
    clients: 89,
    growth: 23.5,
    status: "online" as const,
    level: "platinum" as const,
    streak: 12,
    lastActivity: new Date(),
  },
  {
    id: 2,
    name: "Carlos Santos",
    email: "carlos@empresa.com",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=carlos`,
    revenue: 198450,
    clients: 76,
    growth: 18.2,
    status: "online" as const,
    level: "gold" as const,
    streak: 8,
    lastActivity: new Date(),
  },
  {
    id: 3,
    name: "Mariana Costa",
    email: "mariana@empresa.com",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=mariana`,
    revenue: 167890,
    clients: 65,
    growth: 15.7,
    status: "away" as const,
    level: "gold" as const,
    streak: 6,
    lastActivity: new Date(),
  },
  {
    id: 4,
    name: "João Oliveira",
    email: "joao@empresa.com",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=joao`,
    revenue: 143220,
    clients: 58,
    growth: 12.3,
    status: "online" as const,
    level: "silver" as const,
    streak: 4,
    lastActivity: new Date(),
  },
  {
    id: 5,
    name: "Beatriz Lima",
    email: "beatriz@empresa.com",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=beatriz`,
    revenue: 126750,
    clients: 52,
    growth: 9.8,
    status: "offline" as const,
    level: "silver" as const,
    streak: 3,
    lastActivity: new Date(),
  },
  {
    id: 6,
    name: "Rafael Mendes",
    email: "rafael@empresa.com",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=rafael`,
    revenue: 98340,
    clients: 41,
    growth: 7.2,
    status: "online" as const,
    level: "bronze" as const,
    streak: 2,
    lastActivity: new Date(),
  },
];

const LoadingSkeleton = memo(() => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="glass-card border-zinc-800">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-zinc-700 rounded-xl"></div>
                <div className="w-16 h-6 bg-zinc-700 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="w-32 h-8 bg-zinc-700 rounded"></div>
                <div className="w-24 h-4 bg-zinc-700 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

export const InteractiveDashboard = memo(() => {
  // Simulando queries reais com dados mockados
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const kpiData = generateKPIData();
  const leaderboardData = generateLeaderboardData();

  if (analyticsLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header animado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          Dashboard Premium
        </h1>
        <p className="text-zinc-400 text-lg">
          Análise avançada de performance e crescimento
        </p>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>

      {/* Advanced Charts Section */}
      <Suspense fallback={<LoadingSkeleton />}>
        <AdvancedCharts
          analyticsData={Array.isArray(analyticsData) ? analyticsData : []}
        />
      </Suspense>

      {/* Leaderboard Table */}
      <LeaderboardTable users={leaderboardData} />

      {/* Footer com estatísticas rápidas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8"
      >
        {[
          { label: "Uptime", value: "99.9%", color: "text-emerald-400" },
          { label: "Latência Média", value: "42ms", color: "text-blue-400" },
          { label: "Requests/min", value: "2.4k", color: "text-purple-400" },
          { label: "Satisfação", value: "4.9★", color: "text-yellow-400" },
        ].map((stat, index) => (
          <Card key={stat.label} className="glass-card border-zinc-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                {stat.label}
              </p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
});
