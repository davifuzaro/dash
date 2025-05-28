import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Activity,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Share2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface MLInsight {
  id: string;
  type: "prediction" | "anomaly" | "pattern" | "recommendation";
  confidence: number;
  impact: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  metrics?: Record<string, any>;
  actions?: string[];
  visual?: {
    type: "trend" | "comparison" | "distribution";
    data: any[];
  };
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastUpdated: Date;
  dataPoints: number;
}

export const MLInsightsPanel: React.FC = () => {
  const [insights, setInsights] = useState<MLInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<MLInsight | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState(false);
  const [activeModel, setActiveModel] = useState<
    "churn" | "growth" | "segmentation"
  >("churn");

  const [modelMetrics] = useState<ModelMetrics>({
    accuracy: 94.2,
    precision: 92.8,
    recall: 95.1,
    f1Score: 93.9,
    lastUpdated: new Date(),
    dataPoints: 65467,
  });

  useEffect(() => {
    loadMLInsights();
  }, [activeModel]);

  const loadMLInsights = async () => {
    setLoading(true);
    try {
      // Simular chamada à API de ML
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Gerar insights baseados no modelo ativo
      const newInsights = generateMLInsights(activeModel);
      setInsights(newInsights);

      // Auto-selecionar o primeiro insight crítico ou de alto impacto
      const criticalInsight = newInsights.find(
        (i) => i.impact === "critical" || i.impact === "high",
      );
      if (criticalInsight) {
        setSelectedInsight(criticalInsight);
      }
    } catch (error) {
      console.error("Erro ao carregar insights ML:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMLInsights = (model: string): MLInsight[] => {
    const baseInsights: MLInsight[] = [
      {
        id: "1",
        type: "anomaly",
        confidence: 96.8,
        impact: "critical",
        title: "Anomalia Detectada: Queda Abrupta em SP",
        description:
          "Detectada redução de 32% nas ativações em São Paulo nos últimos 3 dias, significativamente fora do padrão histórico.",
        metrics: {
          reduction: -32,
          affectedUsers: 892,
          timeframe: "3 dias",
          zScore: 3.2,
        },
        actions: [
          "Investigar campanhas ativas na região",
          "Contatar top performers de SP",
          "Ativar campanha de emergência",
        ],
        visual: {
          type: "trend",
          data: [
            { day: "Seg", normal: 280, actual: 275 },
            { day: "Ter", normal: 285, actual: 260 },
            { day: "Qua", normal: 290, actual: 220 },
            { day: "Qui", normal: 295, actual: 190 },
          ],
        },
      },
      {
        id: "2",
        type: "prediction",
        confidence: 89.3,
        impact: "high",
        title: "Previsão: Crescimento Explosivo em MG",
        description:
          "Modelo prevê crescimento de 45% em Minas Gerais nos próximos 30 dias baseado em padrões sazonais e atividade recente.",
        metrics: {
          expectedGrowth: 45,
          currentBase: 3240,
          projectedBase: 4698,
          confidence: 89.3,
        },
        actions: [
          "Aumentar estoque na região",
          "Preparar equipe de suporte",
          "Lançar programa de mentoria",
        ],
      },
      {
        id: "3",
        type: "pattern",
        confidence: 92.1,
        impact: "medium",
        title: "Padrão Identificado: Ciclo de Ativação",
        description:
          "Descoberto padrão de ativação em ondas a cada 15 dias, correlacionado com campanhas de email marketing.",
        metrics: {
          cycleLength: 15,
          peakIncrease: 23,
          correlation: 0.84,
        },
        actions: [
          "Otimizar timing de campanhas",
          "Preparar recursos para picos",
          "Ajustar estratégia de comunicação",
        ],
      },
      {
        id: "4",
        type: "recommendation",
        confidence: 87.6,
        impact: "high",
        title: "Oportunidade: Upgrade de Graduação",
        description:
          "1,247 licenciados identificados com potencial imediato para upgrade baseado em performance e engajamento.",
        metrics: {
          potentialRevenue: 186000,
          candidatesCount: 1247,
          successProbability: 72,
        },
        actions: [
          "Criar campanha personalizada",
          "Oferecer incentivos especiais",
          "Acompanhamento individual",
        ],
      },
    ];

    // Filtrar ou modificar baseado no modelo
    if (model === "churn") {
      return baseInsights.filter(
        (i) => i.type === "anomaly" || i.type === "prediction",
      );
    } else if (model === "growth") {
      return baseInsights.filter(
        (i) => i.type === "prediction" || i.type === "pattern",
      );
    } else {
      return baseInsights.filter(
        (i) => i.type === "pattern" || i.type === "recommendation",
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMLInsights();
    setRefreshing(false);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "critical":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "anomaly":
        return AlertTriangle;
      case "prediction":
        return TrendingUp;
      case "pattern":
        return Activity;
      case "recommendation":
        return Target;
      default:
        return Brain;
    }
  };

  const InsightCard = ({ insight }: { insight: MLInsight }) => {
    const Icon = getTypeIcon(insight.type);
    const isSelected = selectedInsight?.id === insight.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setSelectedInsight(insight)}
        className={cn(
          "p-4 rounded-lg border cursor-pointer transition-all",
          isSelected
            ? "bg-zinc-800 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn("p-2 rounded-lg", getImpactColor(insight.impact))}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {insight.type}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {insight.confidence}% confiança
                </span>
              </div>
            </div>
          </div>

          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-1 bg-emerald-500/20 rounded-full"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
            </motion.div>
          )}
        </div>

        <p className="text-xs text-zinc-400 line-clamp-2">
          {insight.description}
        </p>

        {insight.metrics && (
          <div className="flex items-center gap-4 mt-3">
            {Object.entries(insight.metrics)
              .slice(0, 2)
              .map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="text-zinc-500">{key}: </span>
                  <span className="font-medium text-zinc-300">
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </span>
                </div>
              ))}
          </div>
        )}
      </motion.div>
    );
  };

  const ModelPerformanceCard = () => (
    <Card className="glass-card border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Performance do Modelo
          </span>
          <Badge className="bg-emerald-500/10 text-emerald-400">
            Atualizado há 2h
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Acurácia</span>
              <span className="text-sm font-medium">
                {modelMetrics.accuracy}%
              </span>
            </div>
            <Progress value={modelMetrics.accuracy} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Precisão</span>
              <span className="text-sm font-medium">
                {modelMetrics.precision}%
              </span>
            </div>
            <Progress value={modelMetrics.precision} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Recall</span>
              <span className="text-sm font-medium">
                {modelMetrics.recall}%
              </span>
            </div>
            <Progress value={modelMetrics.recall} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">F1 Score</span>
              <span className="text-sm font-medium">
                {modelMetrics.f1Score}%
              </span>
            </div>
            <Progress value={modelMetrics.f1Score} className="h-2" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Dataset: {modelMetrics.dataPoints.toLocaleString()} registros
          </span>
          <span>
            Última atualização: {modelMetrics.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-zinc-400">Processando insights com IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-400" />
            Machine Learning Insights
          </h2>
          <p className="text-zinc-400 mt-1">
            Análise preditiva em tempo real com modelos de IA
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="border-zinc-700"
          >
            {showDetails ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {showDetails ? "Ocultar" : "Detalhes"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-zinc-700"
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")}
            />
            Atualizar
          </Button>

          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Model Selector */}
      <Tabs value={activeModel} onValueChange={(v) => setActiveModel(v as any)}>
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger
            value="churn"
            className="data-[state=active]:bg-zinc-700"
          >
            <UserX className="w-4 h-4 mr-2" />
            Previsão de Churn
          </TabsTrigger>
          <TabsTrigger
            value="growth"
            className="data-[state=active]:bg-zinc-700"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Análise de Crescimento
          </TabsTrigger>
          <TabsTrigger
            value="segmentation"
            className="data-[state=active]:bg-zinc-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Segmentação Inteligente
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeModel} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Insights List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Insights Detectados</h3>
                <Badge variant="outline" className="text-xs">
                  {insights.length} insights
                </Badge>
              </div>

              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>

            {/* Selected Insight Detail */}
            <div className="lg:col-span-2">
              {selectedInsight ? (
                <motion.div
                  key={selectedInsight.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Main Card */}
                  <Card className="glass-card border-zinc-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-3">
                            <div
                              className={cn(
                                "p-2 rounded-lg",
                                getImpactColor(selectedInsight.impact),
                              )}
                            >
                              {React.createElement(
                                getTypeIcon(selectedInsight.type),
                                {
                                  className: "w-6 h-6",
                                },
                              )}
                            </div>
                            {selectedInsight.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge
                              variant="outline"
                              className={getImpactColor(selectedInsight.impact)}
                            >
                              {selectedInsight.impact} impact
                            </Badge>
                            <span className="text-sm text-zinc-400">
                              {selectedInsight.confidence}% confidence
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-400 mb-2">
                          Descrição
                        </h4>
                        <p className="text-zinc-300">
                          {selectedInsight.description}
                        </p>
                      </div>

                      {selectedInsight.metrics && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-400 mb-3">
                            Métricas Chave
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(selectedInsight.metrics).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="p-3 bg-zinc-800/50 rounded-lg"
                                >
                                  <p className="text-xs text-zinc-500 capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </p>
                                  <p className="text-lg font-semibold mt-1">
                                    {typeof value === "number"
                                      ? value.toLocaleString("pt-BR", {
                                          maximumFractionDigits: 1,
                                        })
                                      : value}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {selectedInsight.actions && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-400 mb-3">
                            Ações Recomendadas
                          </h4>
                          <div className="space-y-2">
                            {selectedInsight.actions.map((action, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer"
                              >
                                <div className="p-1 bg-emerald-500/20 rounded">
                                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-sm">{action}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedInsight.visual && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-400 mb-3">
                            Visualização
                          </h4>
                          <div className="p-4 bg-zinc-900 rounded-lg">
                            {/* Aqui você pode adicionar gráficos específicos baseados no tipo de visual */}
                            <div className="h-48 flex items-center justify-center text-zinc-500">
                              <BarChart3 className="w-8 h-8" />
                              <span className="ml-2">
                                Gráfico de {selectedInsight.visual.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Model Performance */}
                  {showDetails && <ModelPerformanceCard />}
                </motion.div>
              ) : (
                <Card className="glass-card border-zinc-800 h-full flex items-center justify-center">
                  <CardContent>
                    <div className="text-center">
                      <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400">
                        Selecione um insight para ver detalhes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Real-time Status */}
      <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-400">Modelo Online</span>
          </div>
          <div className="text-sm text-zinc-500">
            <Clock className="w-3 h-3 inline mr-1" />
            Última análise: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-zinc-400">CPU: 42%</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-zinc-400">Latência: 23ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Adicionar import onde necessário:
import { UserX } from "lucide-react";
