import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CountUp from "react-countup";
import confetti from "canvas-confetti";

interface SparklineData {
  value: number;
  label: string;
}

interface KPICardProps {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  period: string;
  icon: React.ComponentType<any>;
  color: string;
  sparklineData?: SparklineData[];
  target?: number;
  format?: 'number' | 'currency' | 'percentage';
  index: number;
}

const MiniSparkline = memo(({ data, color }: { data: SparklineData[]; color: string }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 60;
    const y = 20 - ((point.value - min) / range) * 20;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-16 h-6 opacity-60">
      <svg width="60" height="20" className="overflow-visible">
        <motion.polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </svg>
    </div>
  );
});

export const KPICard = memo(({ 
  title, 
  value, 
  change, 
  changeType, 
  period, 
  icon: Icon, 
  color, 
  sparklineData,
  target,
  format = 'number',
  index 
}: KPICardProps) => {
  const [shouldCelebrate, setShouldCelebrate] = useState(false);
  const isIncrease = changeType === "increase";
  const progressToTarget = target ? (value / target) * 100 : 0;

  useEffect(() => {
    if (target && value >= target && !shouldCelebrate) {
      setShouldCelebrate(true);
      // Easter egg: confetti quando bate a meta
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [value, target, shouldCelebrate]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `R$ ${val.toLocaleString('pt-BR')}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString('pt-BR');
    }
  };

  const colorClasses = {
    'emerald': 'from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30',
    'blue': 'from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30',
    'purple': 'from-purple-500/20 to-purple-600/20 text-purple-400 border-purple-500/30',
    'orange': 'from-orange-500/20 to-orange-600/20 text-orange-400 border-orange-500/30',
    'pink': 'from-pink-500/20 to-pink-600/20 text-pink-400 border-pink-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ 
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
    >
      <Card className="glass-card border-zinc-800 group relative overflow-hidden">
        <CardContent className="p-6">
          {/* Background Gradient Animation */}
          <motion.div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              colorClasses[color as keyof typeof colorClasses]?.split('text-')[0]
            )}
            initial={false}
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    colorClasses[color as keyof typeof colorClasses]
                  )}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-6 h-6" />
                  {shouldCelebrate && (
                    <motion.div
                      className="absolute"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  )}
                </motion.div>
                <div>
                  <p className="text-sm text-zinc-500 font-medium">{title}</p>
                  {target && (
                    <p className="text-xs text-zinc-600">
                      Meta: {formatValue(target)}
                    </p>
                  )}
                </div>
              </div>
              
              {sparklineData && (
                <MiniSparkline 
                  data={sparklineData} 
                  color={colorClasses[color as keyof typeof colorClasses]?.split(' ')[2] || '#10b981'} 
                />
              )}
            </div>

            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <CountUp
                  end={value}
                  duration={2}
                  delay={index * 0.1}
                  preserveValue
                  formattingFn={formatValue}
                  className="text-3xl font-bold text-zinc-50"
                />
              </motion.div>

              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex items-center text-sm font-medium",
                  isIncrease ? "text-emerald-400" : "text-red-400"
                )}>
                  {isIncrease ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    {isIncrease ? "+" : ""}{change.toFixed(1)}%
                  </motion.span>
                </div>
                <span className="text-xs text-zinc-500">{period}</span>
              </div>

              {/* Progress bar para meta */}
              {target && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Progresso</span>
                    <span className={cn(
                      "font-medium",
                      progressToTarget >= 100 ? "text-emerald-400" : "text-zinc-400"
                    )}>
                      {progressToTarget.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-2 rounded-full bg-gradient-to-r",
                        progressToTarget >= 100 
                          ? "from-emerald-500 to-emerald-400" 
                          : `from-${color}-500 to-${color}-400`
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressToTarget, 100)}%` }}
                      transition={{ duration: 1.5, delay: index * 0.1 + 0.7 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});