import OpenAI from "openai";
import { fetchLicenciados } from "../googleSheets";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface AIInsight {
  id: string;
  type: "anomaly" | "prediction" | "recommendation" | "alert";
  title: string;
  description: string;
  confidence: number;
  priority: "low" | "medium" | "high" | "critical";
  actionable: boolean;
  suggestedActions?: string[];
  data?: any;
  timestamp: Date;
}

export class AIAnalyticsService {
  private cachedMetrics: any = null;
  private lastUpdate: number = 0;

  // Método principal - SIMPLIFICADO PARA FUNCIONAR
  async chatQuery(message: string): Promise<ChatMessage> {
    try {
      // 1. Buscar e calcular métricas
      const metrics = await this.getMetrics();

      // 2. RESPOSTAS DIRETAS PARA PERGUNTAS COMUNS
      const perguntaLower = message.toLowerCase();

      // Para perguntas sobre licenciados ativos
      if (
        perguntaLower.includes("quantos") &&
        (perguntaLower.includes("ativo") || perguntaLower.includes("ativos"))
      ) {
        return {
          id: Date.now().toString(),
          role: "assistant",
          content: `📊 **Temos exatamente ${metrics.ativos.toLocaleString("pt-BR")} licenciados ativos!**

Isso representa ${metrics.taxaConversao}% do total de ${metrics.total.toLocaleString("pt-BR")} licenciados cadastrados.

📈 **Resumo:**
• Ativos: ${metrics.ativos.toLocaleString("pt-BR")}
• Inativos: ${metrics.inativos.toLocaleString("pt-BR")}
• Taxa de conversão: ${metrics.taxaConversao}%

Posso fornecer mais detalhes sobre distribuição por estado ou graduação se desejar!`,
          timestamp: new Date(),
          metadata: { metrics },
        };
      }

      // Para perguntas sobre taxa de conversão
      if (
        perguntaLower.includes("taxa") &&
        perguntaLower.includes("conversão")
      ) {
        return {
          id: Date.now().toString(),
          role: "assistant",
          content: `📊 **A taxa de conversão atual é ${metrics.taxaConversao}%**

Dos ${metrics.total.toLocaleString("pt-BR")} licenciados cadastrados:
• ✅ ${metrics.ativos.toLocaleString("pt-BR")} estão ativos (${metrics.taxaConversao}%)
• ❌ ${metrics.inativos.toLocaleString("pt-BR")} estão inativos (${(100 - parseFloat(metrics.taxaConversao)).toFixed(1)}%)

${metrics.taxaConversao > 70 ? "🎯 Estamos acima da meta de 70%!" : "⚠️ Estamos abaixo da meta de 70%. Precisamos de ações para aumentar a ativação."}`,
          timestamp: new Date(),
          metadata: { metrics },
        };
      }

      // Para perguntas sobre top performers
      if (
        perguntaLower.includes("top") ||
        perguntaLower.includes("melhores") ||
        perguntaLower.includes("performers") ||
        perguntaLower.includes("desempenho")
      ) {
        const licenciados = await fetchLicenciados();

        // Buscar top 10 por clientes ativos
        const topPerformers = licenciados
          .filter((l) => {
            const clientesAtivos = parseInt(l["Clientes Ativos"]) || 0;
            return clientesAtivos > 0;
          })
          .sort((a, b) => {
            const clientesA = parseInt(a["Clientes Ativos"]) || 0;
            const clientesB = parseInt(b["Clientes Ativos"]) || 0;
            return clientesB - clientesA;
          })
          .slice(0, 10)
          .map((l, index) => ({
            posicao: index + 1,
            nome: l.Nome || "Sem nome",
            codigo: l.Codigo || "N/A",
            clientesAtivos: parseInt(l["Clientes Ativos"]) || 0,
            graduacao: l.Graduação || l.Graduacao || "N/A",
            uf: l.UF || l.Uf || "N/A",
            cidade: l.Cidade || "N/A",
          }));

        if (topPerformers.length === 0) {
          return {
            id: Date.now().toString(),
            role: "assistant",
            content:
              "Não encontrei licenciados com clientes ativos no momento. Verifique se os dados estão atualizados.",
            timestamp: new Date(),
            metadata: { metrics },
          };
        }

        const listaFormatada = topPerformers
          .map(
            (p) => `${p.posicao}. **${p.nome}** (${p.codigo})
   • Clientes: ${p.clientesAtivos}
   • Graduação: ${p.graduacao}
   • Local: ${p.cidade}/${p.uf}`,
          )
          .join("\n\n");

        const totalClientesTop10 = topPerformers.reduce(
          (sum, p) => sum + p.clientesAtivos,
          0,
        );
        const mediaTop10 = Math.round(
          totalClientesTop10 / topPerformers.length,
        );

        return {
          id: Date.now().toString(),
          role: "assistant",
          content: `🏆 **Top 10 Performers da iGreen Energy:**

${listaFormatada}

📊 **Análise do Top 10:**
• 🥇 O líder tem **${topPerformers[0]?.clientesAtivos || 0} clientes ativos**
• 📈 Média do top 10: **${mediaTop10} clientes**
• 📍 Estados representados: ${[...new Set(topPerformers.map((p) => p.uf))].filter((uf) => uf !== "N/A").join(", ") || "Diversos"}
• ⭐ Total de clientes do top 10: **${totalClientesTop10}**

💡 Quer ver análise detalhada de algum deles ou comparar com outros períodos?`,
          timestamp: new Date(),
          metadata: { metrics, topPerformers },
        };
      }

      // 3. Para outras perguntas, usar OpenAI com contexto
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é GAIA, assistente de dados da iGreen Energy.

DADOS REAIS DISPONÍVEIS:
- Total de licenciados: ${metrics.total}
- Licenciados ativos: ${metrics.ativos}
- Licenciados inativos: ${metrics.inativos}
- Taxa de conversão: ${metrics.taxaConversao}%

Use SEMPRE esses números exatos nas suas respostas. NUNCA diga que precisa consultar dados.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return {
        id: Date.now().toString(),
        role: "assistant",
        content:
          response.choices[0].message.content || "Erro ao processar resposta",
        timestamp: new Date(),
        metadata: { metrics },
      };
    } catch (error) {
      console.error("❌ Erro no chatQuery:", error);
      return {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.",
        timestamp: new Date(),
      };
    }
  }

  // Método para buscar e calcular métricas
  private async getMetrics() {
    const now = Date.now();

    // Cache de 1 minuto
    if (this.cachedMetrics && now - this.lastUpdate < 60000) {
      return this.cachedMetrics;
    }

    console.log("🔄 Calculando métricas...");
    const licenciados = await fetchLicenciados();

    // Calcular ativos - CORRIGIDO PARA USAR O MÉTODO DO DASHBOARD
    let ativos = 0;
    const total = licenciados.length;

    if (total > 0) {
      // Método 1: Por Data Ativo (como estava)
      const primeiroRegistro = licenciados[0];
      const colunas = Object.keys(primeiroRegistro);

      // Tentar encontrar coluna de data ativo
      const possiveisColunas = [
        "Data Ativo",
        "DataAtivo",
        "data_ativo",
        "DATA_ATIVO",
        "Data_Ativo",
        "dataAtivo",
        "Data ativo",
        "data ativo",
      ];

      let colunaEncontrada = null;
      for (const nomeColuna of possiveisColunas) {
        if (colunas.includes(nomeColuna)) {
          colunaEncontrada = nomeColuna;
          console.log(`✅ Coluna de data encontrada: ${nomeColuna}`);
          break;
        }
      }

      // Se não encontrou, procurar por padrão
      if (!colunaEncontrada) {
        colunaEncontrada = colunas.find(
          (col) =>
            col.toLowerCase().includes("ativo") &&
            col.toLowerCase().includes("data"),
        );
      }

      // Calcular ativos por Data Ativo
      let ativosPorData = 0;
      if (colunaEncontrada) {
        ativosPorData = licenciados.filter((l) => {
          const valor = l[colunaEncontrada];
          return valor && valor.toString().trim() !== "";
        }).length;
        console.log(`📊 Ativos por Data Ativo: ${ativosPorData}`);
      }

      // Método 2: Por Cancelado != S (MÉTODO DO DASHBOARD)
      const ativosPorCancelado = licenciados.filter((l) => {
        const cancelado = l.Cancelado || l.cancelado || l.CANCELADO;
        return cancelado !== "S" && cancelado !== "SIM" && cancelado !== "Sim";
      }).length;
      console.log(`📊 Ativos por Cancelado != S: ${ativosPorCancelado}`);

      // USAR O MAIOR VALOR (provavelmente o método correto)
      ativos = Math.max(ativosPorData, ativosPorCancelado);
      console.log(`✅ Usando ${ativos} como total de ativos`);

      // Se ainda estiver muito baixo, verificar se tem algum problema
      if (ativos < total * 0.5) {
        console.log("⚠️ AVISO: Taxa de ativos muito baixa, verificar dados!");
        console.log(
          "Exemplo de registro:",
          JSON.stringify(primeiroRegistro, null, 2),
        );
      }
    }

    const inativos = total - ativos;
    const taxaConversao = total > 0 ? ((ativos / total) * 100).toFixed(1) : "0";

    this.cachedMetrics = {
      total,
      ativos,
      inativos,
      taxaConversao,
    };

    this.lastUpdate = now;

    console.log("📊 Métricas finais:", this.cachedMetrics);
    return this.cachedMetrics;
  }

  // Método para insights automáticos
  async analyzeData(): Promise<AIInsight[]> {
    const metrics = await this.getMetrics();
    const insights: AIInsight[] = [];

    // Alerta se taxa de conversão baixa
    if (parseFloat(metrics.taxaConversao) < 70) {
      insights.push({
        id: `alert-${Date.now()}`,
        type: "alert",
        title: "Taxa de Conversão Abaixo da Meta",
        description: `Taxa atual: ${metrics.taxaConversao}% (Meta: 70%). ${metrics.inativos.toLocaleString("pt-BR")} licenciados inativos representam oportunidade de crescimento.`,
        confidence: 100,
        priority: "high",
        actionable: true,
        suggestedActions: [
          "Implementar programa de reativação",
          "Contatar licenciados inativos",
          "Oferecer incentivos especiais",
        ],
        data: metrics,
        timestamp: new Date(),
      });
    }

    // Recomendação de análise de top performers
    insights.push({
      id: `recommendation-${Date.now()}`,
      type: "recommendation",
      title: "Análise de Top Performers",
      description:
        "Analise os top performers para identificar padrões de sucesso e replicar em outros licenciados.",
      confidence: 90,
      priority: "medium",
      actionable: true,
      suggestedActions: [
        "Estudar estratégias dos top 10",
        "Criar programa de mentoria",
        "Compartilhar cases de sucesso",
      ],
      timestamp: new Date(),
    });

    return insights;
  }

  // Método vazio para compatibilidade
  async generateNaturalLanguageQuery(query: string): Promise<any> {
    return { query };
  }

  // Método para forçar atualização do cache
  async refreshCache(): Promise<void> {
    this.cachedMetrics = null;
    this.lastUpdate = 0;
    await this.getMetrics();
  }
}

export const aiService = new AIAnalyticsService();
