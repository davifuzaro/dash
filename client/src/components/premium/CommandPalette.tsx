import { useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Calculator, 
  Users, 
  BarChart3, 
  Settings, 
  Home,
  FileText,
  Download,
  RefreshCw,
  Zap,
  Command,
  ArrowRight,
  Hash,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface CommandAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'navigation' | 'actions' | 'analytics' | 'ai' | 'settings';
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryColors = {
  navigation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  actions: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  analytics: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ai: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  settings: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
};

const categoryLabels = {
  navigation: 'Navegação',
  actions: 'Ações',
  analytics: 'Analytics',
  ai: 'Inteligência Artificial',
  settings: 'Configurações'
};

export const CommandPalette = memo(({ isOpen, onClose }: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();

  const actions: CommandAction[] = useMemo(() => [
    // Navegação
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Visão geral e métricas principais',
      icon: Home,
      category: 'navigation',
      keywords: ['dashboard', 'inicio', 'home', 'principal'],
      action: () => { setLocation('/dashboard'); onClose(); }
    },
    {
      id: 'nav-licenciados',
      title: 'Licenciados',
      description: 'Gerenciar licenciados e performance',
      icon: Users,
      category: 'navigation',
      keywords: ['licenciados', 'usuarios', 'vendedores', 'equipe'],
      action: () => { setLocation('/licenciados'); onClose(); }
    },
    {
      id: 'nav-analytics',
      title: 'Analytics',
      description: 'Relatórios e análises detalhadas',
      icon: BarChart3,
      category: 'navigation',
      keywords: ['analytics', 'relatorios', 'analises', 'graficos'],
      action: () => { setLocation('/analytics'); onClose(); }
    },
    {
      id: 'nav-network',
      title: 'Rede',
      description: 'Visualização da estrutura de rede',
      icon: Hash,
      category: 'navigation',
      keywords: ['rede', 'network', 'hierarquia', 'estrutura'],
      action: () => { setLocation('/network'); onClose(); }
    },
    {
      id: 'nav-settings',
      title: 'Configurações',
      description: 'Preferências e configurações do sistema',
      icon: Settings,
      category: 'navigation',
      keywords: ['configuracoes', 'settings', 'preferencias'],
      action: () => { setLocation('/settings'); onClose(); }
    },

    // Ações
    {
      id: 'action-export',
      title: 'Exportar Dados',
      description: 'Exportar dados para CSV ou Excel',
      icon: Download,
      category: 'actions',
      keywords: ['exportar', 'export', 'csv', 'excel', 'download'],
      action: () => { console.log('Exportar dados'); onClose(); },
      shortcut: '⌘E'
    },
    {
      id: 'action-refresh',
      title: 'Atualizar Dados',
      description: 'Sincronizar com fontes externas',
      icon: RefreshCw,
      category: 'actions',
      keywords: ['atualizar', 'refresh', 'sync', 'sincronizar'],
      action: () => { window.location.reload(); },
      shortcut: '⌘R'
    },
    {
      id: 'action-calculate',
      title: 'Calculadora',
      description: 'Calculadora avançada para métricas',
      icon: Calculator,
      category: 'actions',
      keywords: ['calculadora', 'calculate', 'calc', 'matematica'],
      action: () => { console.log('Abrir calculadora'); onClose(); }
    },

    // Analytics
    {
      id: 'analytics-performance',
      title: 'Relatório de Performance',
      description: 'Análise detalhada de performance por período',
      icon: BarChart3,
      category: 'analytics',
      keywords: ['performance', 'relatorio', 'analise', 'metricas'],
      action: () => { console.log('Gerar relatório de performance'); onClose(); }
    },
    {
      id: 'analytics-trends',
      title: 'Análise de Tendências',
      description: 'Identificar padrões e tendências nos dados',
      icon: TrendingUp,
      category: 'analytics',
      keywords: ['tendencias', 'trends', 'padroes', 'crescimento'],
      action: () => { console.log('Análise de tendências'); onClose(); }
    },

    // IA
    {
      id: 'ai-insights',
      title: 'Insights Automáticos',
      description: 'Gerar insights com inteligência artificial',
      icon: Zap,
      category: 'ai',
      keywords: ['insights', 'ia', 'ai', 'inteligencia', 'automatico'],
      action: () => { console.log('Gerar insights IA'); onClose(); },
      shortcut: '⌘I'
    },
    {
      id: 'ai-chat',
      title: 'Assistente de IA',
      description: 'Conversar com o assistente inteligente',
      icon: MessageSquare,
      category: 'ai',
      keywords: ['chat', 'assistente', 'conversa', 'perguntas'],
      action: () => { console.log('Abrir chat IA'); onClose(); },
      shortcut: '⌘K'
    }
  ], [setLocation, onClose]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    
    const searchTerms = query.toLowerCase().split(' ');
    return actions.filter(action => {
      const searchableText = [
        action.title,
        action.description,
        ...action.keywords
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [actions, query]);

  const groupedActions = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    filteredActions.forEach(action => {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }
      groups[action.category].push(action);
    });
    return groups;
  }, [filteredActions]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredActions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredActions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            filteredActions[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  const handleActionClick = (action: CommandAction) => {
    action.action();
  };

  let currentIndex = 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-zinc-900/95 backdrop-blur-xl border-zinc-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header com search */}
          <div className="border-b border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <Command className="w-5 h-5 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite um comando ou busque por ações..."
                className="border-0 bg-transparent text-lg placeholder:text-zinc-500 focus-visible:ring-0"
                autoFocus
              />
              <div className="flex gap-1">
                <kbd className="pointer-events-none select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                  esc
                </kbd>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="max-h-[400px] overflow-y-auto">
            {Object.keys(groupedActions).length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-400">Nenhum comando encontrado</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Tente buscar por "dashboard", "licenciados" ou "analytics"
                </p>
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedActions).map(([category, categoryActions]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </div>
                    <div className="space-y-1">
                      {categoryActions.map((action) => {
                        const isSelected = currentIndex === selectedIndex;
                        const itemIndex = currentIndex++;
                        
                        return (
                          <motion.div
                            key={action.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: itemIndex * 0.02 }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-150",
                              isSelected
                                ? "bg-emerald-500/20 border border-emerald-500/30"
                                : "hover:bg-zinc-800/50"
                            )}
                            onClick={() => handleActionClick(action)}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center border",
                              categoryColors[action.category]
                            )}>
                              <action.icon className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-zinc-200 truncate">
                                  {action.title}
                                </h3>
                                {action.shortcut && (
                                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-400">
                                    {action.shortcut}
                                  </kbd>
                                )}
                              </div>
                              <p className="text-sm text-zinc-400 truncate">
                                {action.description}
                              </p>
                            </div>

                            {isSelected && (
                              <ArrowRight className="w-4 h-4 text-emerald-400" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer com dicas */}
          <div className="border-t border-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800">↑↓</kbd>
                  <span>navegar</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800">↵</kbd>
                  <span>executar</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800">esc</kbd>
                  <span>fechar</span>
                </div>
              </div>
              <div className="text-emerald-400">
                {filteredActions.length} comando{filteredActions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
});

// Hook para usar o Command Palette globalmente
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    openPalette: () => setIsOpen(true),
    closePalette: () => setIsOpen(false)
  };
};