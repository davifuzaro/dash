import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Metric } from "@shared/schema";

interface MetricCardProps {
  metric: Metric;
  index: number;
}

const iconMap: Record<string, string> = {
  revenue: "💰",
  users: "👥",
  orders: "🛒",
  conversion: "🎯",
};

const colorMap: Record<string, string> = {
  revenue: "bg-emerald-500/10 text-emerald-500",
  users: "bg-blue-500/10 text-blue-500",
  orders: "bg-purple-500/10 text-purple-500",
  conversion: "bg-orange-500/10 text-orange-500",
};

export function MetricCard({ metric, index }: MetricCardProps) {
  const isIncrease = metric.changeType === "increase";
  const changeValue = parseFloat(metric.change);
  const formattedValue = metric.category === "revenue" 
    ? `R$ ${parseFloat(metric.value).toLocaleString('pt-BR')}`
    : metric.category === "conversion"
    ? `${metric.value}%`
    : parseFloat(metric.value).toLocaleString('pt-BR');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="metric-card glass-card border-zinc-800 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 mb-1">{metric.name}</p>
              <motion.p
                className="text-2xl font-bold text-zinc-50"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              >
                {formattedValue}
              </motion.p>
              <p className={cn(
                "text-sm mt-1 flex items-center",
                isIncrease ? "text-emerald-400" : "text-red-400"
              )}>
                {isIncrease ? (
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 inline mr-1" />
                )}
                {isIncrease ? "+" : ""}{changeValue}% {metric.period}
              </p>
            </div>
            <motion.div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                colorMap[metric.category] || "bg-zinc-500/10 text-zinc-500"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {iconMap[metric.category] || "📊"}
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
