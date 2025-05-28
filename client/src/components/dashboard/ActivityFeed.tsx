import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ShoppingCart, CreditCard, Bell, Mail, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Activity } from "@shared/schema";

interface ActivityFeedProps {
  activities: Activity[];
}

const iconMap: Record<string, { icon: React.ComponentType<any>, color: string }> = {
  user: { icon: UserPlus, color: "bg-emerald-500/10 text-emerald-500" },
  order: { icon: ShoppingCart, color: "bg-blue-500/10 text-blue-500" },
  payment: { icon: CreditCard, color: "bg-purple-500/10 text-purple-500" },
  notification: { icon: Bell, color: "bg-orange-500/10 text-orange-500" },
  email: { icon: Mail, color: "bg-yellow-500/10 text-yellow-500" },
  metric: { icon: TrendingUp, color: "bg-pink-500/10 text-pink-500" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="glass-card border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const iconConfig = iconMap[activity.type] || iconMap.notification;
              const Icon = iconConfig.icon;
              
              return (
                <motion.div
                  key={activity.id}
                  className="flex items-center space-x-4 p-3 hover:bg-zinc-800/30 rounded-lg transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${iconConfig.color}`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-200">{activity.title}</p>
                    <p className="text-xs text-zinc-500">{activity.description}</p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
