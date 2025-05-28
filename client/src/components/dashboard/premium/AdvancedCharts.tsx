import { memo } from "react";
import { motion } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Importar Analytics do schema compartilhado
type Analytics = {
  id: number;
  date: string;
  revenue: string;
  visitors: string;
};

interface AdvancedChartsProps {
  analyticsData: Analytics[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-lg p-3 shadow-xl">
        <p className="text-zinc-300 text-sm">{`Data: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {`${entry.dataKey === 'revenue' ? 'Receita' : 'Visitantes'}: ${
              entry.dataKey === 'revenue' 
                ? `R$ ${entry.value.toLocaleString('pt-BR')}` 
                : entry.value.toLocaleString('pt-BR')
            }`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueAreaChart = memo(({ data }: { data: Analytics[] }) => {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    revenue: parseInt(item.revenue),
    visitors: parseInt(item.visitors)
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="glass-card border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-200 flex items-center gap-2">
            📈 Receita & Visitantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#visitorsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
});

const ConversionDonutChart = memo(() => {
  const data = [
    { name: 'Conversões', value: 68, color: '#10b981' },
    { name: 'Abandonos', value: 32, color: '#ef4444' },
  ];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="glass-card border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-200 flex items-center gap-2">
            🎯 Taxa de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-lg p-3">
                        <p className="text-zinc-300 text-sm">{payload[0].payload.name}</p>
                        <p className="text-white font-medium">{payload[0].value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-zinc-400">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

const FunnelConversionChart = memo(() => {
  const funnelData = [
    { name: 'Visitantes', value: 10000, fill: '#3b82f6' },
    { name: 'Leads', value: 3500, fill: '#8b5cf6' },
    { name: 'Oportunidades', value: 1200, fill: '#f59e0b' },
    { name: 'Clientes', value: 480, fill: '#10b981' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <Card className="glass-card border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-200 flex items-center gap-2">
            🔥 Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-lg p-3">
                        <p className="text-zinc-300 text-sm">{payload[0].payload.name}</p>
                        <p className="text-white font-medium">{payload[0].value.toLocaleString('pt-BR')}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
                animationDuration={1500}
              >
                <LabelList 
                  position="center" 
                  fill="#fff" 
                  stroke="none" 
                  fontSize={14}
                  fontWeight="bold"
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
});

const ActivityHeatmap = memo(() => {
  // Simular dados de heatmap (7 dias x 24 horas)
  const generateHeatmapData = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Maior atividade durante horário comercial
        const isBusinessHour = hour >= 8 && hour <= 18;
        const isWeekend = day === 0 || day === 6;
        
        let intensity = Math.random() * 0.3;
        if (isBusinessHour && !isWeekend) {
          intensity += Math.random() * 0.7;
        }
        
        data.push({
          day: days[day],
          hour,
          intensity: Math.min(intensity, 1),
          count: Math.floor(intensity * 100)
        });
      }
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  const getIntensityColor = (intensity: number) => {
    if (intensity < 0.2) return '#1f2937';
    if (intensity < 0.4) return '#065f46';
    if (intensity < 0.6) return '#059669';
    if (intensity < 0.8) return '#10b981';
    return '#34d399';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <Card className="glass-card border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-200 flex items-center gap-2">
            🔥 Mapa de Atividade (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 w-8">{day}</span>
                <div className="flex gap-1">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const dataPoint = heatmapData.find(d => d.day === day && d.hour === hour);
                    return (
                      <motion.div
                        key={`${day}-${hour}`}
                        className="w-3 h-3 rounded-sm cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: getIntensityColor(dataPoint?.intensity || 0) }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: (dayIndex * 24 + hour) * 0.002 
                        }}
                        title={`${day} ${hour}:00 - ${dataPoint?.count || 0} atividades`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
            <span>Menor atividade</span>
            <div className="flex gap-1">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getIntensityColor(intensity) }}
                />
              ))}
            </div>
            <span>Maior atividade</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export const AdvancedCharts = memo(({ analyticsData }: AdvancedChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2">
        <RevenueAreaChart data={analyticsData} />
      </div>
      <ConversionDonutChart />
      <FunnelConversionChart />
      <div className="lg:col-span-2">
        <ActivityHeatmap />
      </div>
    </div>
  );
});