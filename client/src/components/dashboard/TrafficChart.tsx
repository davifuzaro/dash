import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import type { Analytics } from "@shared/schema";

interface TrafficChartProps {
  data: Analytics[];
}

const trafficSources = [
  { key: "organicTraffic", name: "Busca Orgânica", color: "bg-emerald-500" },
  { key: "socialTraffic", name: "Redes Sociais", color: "bg-blue-500" },
  { key: "directTraffic", name: "Direto", color: "bg-purple-500" },
  { key: "emailTraffic", name: "E-mail", color: "bg-orange-500" },
];

export function TrafficChart({ data }: TrafficChartProps) {
  const trafficData = useMemo(() => {
    if (data.length === 0) return [];
    
    const latest = data[0];
    return trafficSources.map(source => ({
      ...source,
      percentage: parseFloat(latest[source.key as keyof Analytics] as string),
    }));
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="glass-card border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fontes de Tráfego</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trafficData.map((source, index) => (
              <motion.div
                key={source.key}
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${source.color} rounded-full`} />
                  <span className="text-sm">{source.name}</span>
                </div>
                <div className="text-right flex items-center space-x-3">
                  <span className="text-sm font-medium">{source.percentage}%</span>
                  <div className="w-20">
                    <Progress 
                      value={source.percentage} 
                      className="h-2"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
