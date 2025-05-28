import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, TrendingUp, Users, AlertTriangle, Lightbulb, Send, Mic, MicOff, RotateCcw, BarChart3, PieChart, LineChart, Copy } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    query?: string;
    dataUsed?: string[];
    charts?: any[];
    insights?: any[];
  };
}

interface AIInsight {
  id: string;
  type: 'anomaly' | 'prediction' | 'recommendation' | 'alert';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestedActions?: string[];
  data?: any;
  timestamp: Date;
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! Sou sua assistente de IA especializada em analytics da iGreen Energy. Posso ajudar você a analisar dados dos 65.467 licenciados, identificar tendências e sugerir estratégias. Como posso ajudar hoje?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI insights
  const { data: aiInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/ai/insights'],
    queryFn: async () => {
      const response = await fetch('/api/ai/insights');
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQuestions = [
    "Quais licenciados estão em risco de churn?",
    "Compare a performance de SP vs RJ",
    "Qual a melhor estratégia para aumentar ativação?",
    "Mostre o ranking dos top performers",
    "Analise a distribuição por graduações",
    "Identifique padrões de crescimento",
    "Quais são os principais gargalos?",
    "Sugestões para melhorar conversão"
  ];

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context: { timestamp: new Date() } }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: (response: any) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Invalidate insights to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/ai/insights'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível processar sua mensagem. Tente novamente.",
        variant: "destructive"
      });
      console.error('Chat error:', error);
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    chatMutation.mutate(input);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Não suportado",
        description: "Reconhecimento de voz não suportado neste navegador",
        variant: "destructive"
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Erro de voz",
        description: "Não foi possível capturar o áudio. Tente novamente.",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto",
        variant: "destructive"
      });
    }
  };

  const renderChart = (chartData: any, type: string) => {
    if (!chartData || !chartData.data) return null;

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsLineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }} 
              />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }} 
              />
              <Pie 
                dataKey="value" 
                data={chartData.data} 
                cx="50%" 
                cy="50%" 
                outerRadius={60}
              >
                {chartData.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    const parts = message.content.split(/(\[CHART:.*?\])/g);
    
    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          if (part.startsWith('[CHART:') && part.endsWith(']')) {
            const chartType = part.match(/\[CHART:(.*?)\]/)?.[1];
            if (message.metadata?.charts && message.metadata.charts.length > 0) {
              return (
                <div key={index} className="bg-zinc-800 p-4 rounded-lg border border-zinc-600">
                  <div className="flex items-center space-x-2 mb-3">
                    {chartType === 'line' && <LineChart className="w-4 h-4 text-purple-400" />}
                    {chartType === 'bar' && <BarChart3 className="w-4 h-4 text-green-400" />}
                    {chartType === 'pie' && <PieChart className="w-4 h-4 text-blue-400" />}
                    <span className="text-sm font-medium text-zinc-300">
                      {chartType === 'line' ? 'Gráfico de Linha' :
                       chartType === 'bar' ? 'Gráfico de Barras' :
                       chartType === 'pie' ? 'Gráfico de Pizza' : 'Gráfico'}
                    </span>
                  </div>
                  {renderChart(message.metadata.charts[0], chartType || 'line')}
                </div>
              );
            }
            return null;
          }
          
          return part ? (
            <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
              {part}
            </p>
          ) : null;
        })}
        
        {message.metadata?.insights && message.metadata.insights.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-zinc-300 flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>Insights Principais</span>
            </h4>
            {message.metadata.insights.map((insight: any, index: number) => (
              <div key={index} className="bg-zinc-800 p-3 rounded-lg border-l-4 border-yellow-400">
                <p className="text-sm text-zinc-300">{insight.description}</p>
                {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-zinc-400 mb-1">Ações sugeridas:</p>
                    <ul className="text-xs text-zinc-300 space-y-1">
                      {insight.suggestedActions.map((action: string, actionIndex: number) => (
                        <li key={actionIndex} className="flex items-start space-x-1">
                          <span className="text-purple-400">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400 bg-clip-text text-transparent">
              IA Assistant
            </h1>
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Assistente de IA especializada em analytics da iGreen Energy. 
            Análise inteligente de 65.467 licenciados com insights acionáveis.
          </p>
        </motion.div>

        {/* AI Insights Banner */}
        {aiInsights && Array.isArray(aiInsights) && aiInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-400/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span>Insights Automáticos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiInsights.slice(0, 3).map((insight: AIInsight) => (
                    <div key={insight.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-600">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{insight.title}</h4>
                        <Badge 
                          variant={insight.priority === 'critical' ? 'destructive' : 
                                  insight.priority === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">{insight.description}</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-zinc-500">{Math.round(insight.confidence * 100)}% confiança</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Chat Interface */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Suggested Questions Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-white text-base">
                    <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span>Sugestões</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Clique para fazer perguntas comuns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left justify-start h-auto p-3 text-xs leading-relaxed border-zinc-600 hover:border-purple-400 hover:bg-purple-500/10 whitespace-normal break-words"
                      onClick={() => setInput(question)}
                    >
                      <span className="block text-left">{question}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="bg-zinc-800/50 border-zinc-700 h-[600px] flex flex-col">
                <CardHeader className="border-b border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-white font-medium">IA Analytics Assistant</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-emerald-400 text-emerald-400">
                        Online
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMessages([{
                            id: "1",
                            role: "assistant",
                            content: "Olá! Sou sua assistente de IA especializada em analytics da iGreen Energy. Como posso ajudar hoje?",
                            timestamp: new Date(),
                          }]);
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 relative group ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                        }`}
                      >
                        {renderMessageContent(message)}
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString('pt-BR')}
                          </p>
                          {message.role === 'assistant' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-zinc-700 border border-zinc-600 rounded-2xl p-4">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Input Area */}
                <div className="border-t border-zinc-700 p-4">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua pergunta sobre analytics..."
                        className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 resize-none pr-12"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={handleVoiceInput}
                        disabled={isListening}
                      >
                        {isListening ? (
                          <MicOff className="w-4 h-4 text-red-400" />
                        ) : (
                          <Mic className="w-4 h-4 text-zinc-400 hover:text-white" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {isListening && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-red-400 mt-2 flex items-center space-x-2"
                    >
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span>Escutando...</span>
                    </motion.p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}