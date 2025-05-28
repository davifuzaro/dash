import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MoreHorizontal, 
  Medal, 
  TrendingUp, 
  TrendingDown,
  Crown,
  Award,
  Star,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  revenue: number;
  clients: number;
  growth: number;
  status: 'online' | 'offline' | 'away';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  streak: number;
  lastActivity: Date;
}

interface LeaderboardTableProps {
  users: LeaderboardUser[];
}

const StatusIndicator = memo(({ status }: { status: 'online' | 'offline' | 'away' }) => {
  const statusConfig = {
    online: { color: 'bg-emerald-500', label: 'Online' },
    offline: { color: 'bg-zinc-500', label: 'Offline' },
    away: { color: 'bg-yellow-500', label: 'Ausente' }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={cn("w-2 h-2 rounded-full", config.color)}
        animate={status === 'online' ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: status === 'online' ? Infinity : 0, duration: 2 }}
      />
      <span className="text-xs text-zinc-500">{config.label}</span>
    </div>
  );
});

const LevelBadge = memo(({ level }: { level: 'bronze' | 'silver' | 'gold' | 'platinum' }) => {
  const levelConfig = {
    bronze: { 
      icon: Medal, 
      color: 'from-amber-600 to-amber-800', 
      textColor: 'text-amber-100',
      borderColor: 'border-amber-600/50'
    },
    silver: { 
      icon: Award, 
      color: 'from-zinc-400 to-zinc-600', 
      textColor: 'text-zinc-100',
      borderColor: 'border-zinc-400/50'
    },
    gold: { 
      icon: Star, 
      color: 'from-yellow-400 to-yellow-600', 
      textColor: 'text-yellow-900',
      borderColor: 'border-yellow-400/50'
    },
    platinum: { 
      icon: Crown, 
      color: 'from-purple-400 to-purple-600', 
      textColor: 'text-purple-100',
      borderColor: 'border-purple-400/50'
    }
  };

  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(
      "bg-gradient-to-r border gap-1.5 px-2 py-1",
      config.color,
      config.textColor,
      config.borderColor
    )}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium capitalize">{level}</span>
    </Badge>
  );
});

const UserRow = memo(({ user, position, isSelected, onSelect }: {
  user: LeaderboardUser;
  position: number;
  isSelected: boolean;
  onSelect: (id: number) => void;
}) => {
  const getRankIcon = (pos: number) => {
    if (pos === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (pos === 2) return <Medal className="w-5 h-5 text-zinc-400" />;
    if (pos === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-zinc-400 font-bold text-lg">#{pos}</span>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: position * 0.05 }}
      whileHover={{ backgroundColor: "rgba(39, 39, 42, 0.5)" }}
      className={cn(
        "border-b border-zinc-800 cursor-pointer transition-colors",
        isSelected && "bg-zinc-800/50"
      )}
      onClick={() => onSelect(user.id)}
    >
      {/* Posição */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-center">
          {getRankIcon(position)}
        </div>
      </td>

      {/* Usuário */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-zinc-700">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm font-medium">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <StatusIndicator status={user.status} />
            </div>
          </div>
          <div>
            <p className="font-medium text-zinc-200">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Nível */}
      <td className="px-6 py-4">
        <LevelBadge level={user.level} />
      </td>

      {/* Receita */}
      <td className="px-6 py-4">
        <div className="text-right">
          <p className="font-semibold text-zinc-200">
            R$ {user.revenue.toLocaleString('pt-BR')}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            {user.growth > 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
            <span className={cn(
              "text-xs font-medium",
              user.growth > 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {user.growth > 0 ? "+" : ""}{user.growth.toFixed(1)}%
            </span>
          </div>
        </div>
      </td>

      {/* Clientes */}
      <td className="px-6 py-4">
        <div className="text-center">
          <p className="font-semibold text-zinc-200">{user.clients}</p>
          <Progress 
            value={(user.clients / 100) * 100} 
            className="w-16 h-2 mt-2 mx-auto"
          />
        </div>
      </td>

      {/* Sequência */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-1">
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(user.streak, 5) }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-400"
              />
            ))}
            {user.streak > 5 && (
              <span className="text-xs text-emerald-400 font-medium ml-1">
                +{user.streak - 5}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Ações */}
      <td className="px-6 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
            <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800">
              Ver perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800">
              Enviar mensagem
            </DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800">
              Ver relatórios
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
});

export const LeaderboardTable = memo(({ users }: LeaderboardTableProps) => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'revenue' | 'clients' | 'growth'>('revenue');

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.revenue - a.revenue;
        case 'clients':
          return b.clients - a.clients;
        case 'growth':
          return b.growth - a.growth;
        default:
          return 0;
      }
    });
  }, [users, sortBy]);

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
    >
      <Card className="glass-card border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zinc-200 flex items-center gap-2">
              🏆 Ranking de Performance
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('revenue')}
                className="text-xs"
              >
                Receita
              </Button>
              <Button
                variant={sortBy === 'clients' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('clients')}
                className="text-xs"
              >
                Clientes
              </Button>
              <Button
                variant={sortBy === 'growth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('growth')}
                className="text-xs"
              >
                Crescimento
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Nível
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Receita
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Clientes
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Sequência
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedUsers.map((user, index) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      position={index + 1}
                      isSelected={selectedUsers.includes(user.id)}
                      onSelect={handleUserSelect}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-4 bg-zinc-800/50 border-t border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  {selectedUsers.length} usuário(s) selecionado(s)
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Exportar
                  </Button>
                  <Button size="sm" variant="outline">
                    Ação em lote
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedUsers([])}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});