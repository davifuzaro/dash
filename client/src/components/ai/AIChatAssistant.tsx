import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    query?: string;
    dataUsed?: string[];
    charts?: any[];
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
  timestamp: Date;
}

const QuickQueries = memo(({ onSelect }: { onSelect: (query: string) => void }) => {
  const quickQueries = [
    "Quais licenciados estão em risco de churn?",
    "Mostre performance por região",
    "Sugira ações para aumentar ativação",
    "Compare SP vs RJ",
    "Analise tendências de crescimento",
    "Identifique oportunidades de expansão"
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400 font-medium">Perguntas rápidas:</p>
      <div className="grid grid-cols-1 gap-2">
        {quickQueries.map((query, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="justify-start text-left h-auto p-3 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
            onClick={() => onSelect(query)}
          >
            <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
            {query}
          </Button>
        ))}
      </div>
    </div>
  );
});

const InsightCard = memo(({ insight }: { insight: AIInsight }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'prediction': return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'recommendation': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Bot className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-blue-500 bg-blue-500/10';
      case 'low': return 'border-zinc-500 bg-zinc-500/10';
      default: return 'border-zinc-700 bg-zinc-800/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border rounded-lg p-4 space-y-3",
        getPriorityColor(insight.priority)
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getInsightIcon(insight.type)}
          <div>
            <h4 className="font-medium text-zinc-200">{insight.title}</h4>
            <Badge variant="outline" className="text-xs mt-1">
              {insight.confidence}% confiança
            </Badge>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-zinc-400">{insight.description}</p>
      
      {insight.suggestedActions && insight.suggestedActions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Ações Sugeridas:
          </p>
          <ul className="space-y-1">
            {insight.suggestedActions.map((action, index) => (
              <li key={index} className="text-sm text-zinc-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
});

export const AIChatAssistant = memo(() => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const response = await fetch('/api/ai/insights');
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const chatResponse = await response.json();
      setMessages(prev => [...prev, chatResponse]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, não foi possível processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <Card className="glass-card border-zinc-800 h-full flex flex-col">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              Assistente de IA
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-zinc-200 mb-2">
                      Olá! Sou seu assistente de análise de dados
                    </h3>
                    <p className="text-zinc-400">
                      Faça perguntas sobre seus licenciados, performance, tendências e muito mais.
                    </p>
                  </div>
                  <QuickQueries onSelect={sendMessage} />
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}
                        
                        <div className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.role === 'user' 
                            ? 'bg-emerald-500/20 text-emerald-100' 
                            : 'bg-zinc-800 text-zinc-200'
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs text-zinc-500 mt-2">
                            {message.timestamp.toLocaleTimeString('pt-BR')}
                          </p>
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="bg-zinc-800 rounded-lg p-3">
                        <div className="flex gap-1">
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-zinc-500 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1,
                                delay: i * 0.2 
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="border-t border-zinc-800 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Faça uma pergunta sobre seus dados..."
                  className="flex-1 bg-zinc-800 border-zinc-700"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <div>
        <Card className="glass-card border-zinc-800 h-full">
          <CardHeader className="border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Insights Automáticos
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={loadInsights}
                disabled={isLoadingInsights}
              >
                Atualizar
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-6">
              {isLoadingInsights ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-zinc-700 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-zinc-700 rounded mb-2" />
                      <div className="h-3 bg-zinc-700 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
                  <p className="text-zinc-400">
                    Nenhum insight disponível no momento.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});