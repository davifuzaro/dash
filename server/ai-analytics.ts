import OpenAI from "openai";

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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    query?: string;
    dataUsed?: string[];
    charts?: any[];
    insights?: any[];
  };
}

export class AIAnalyticsService {
  private openai: OpenAI | null = null;
  private databaseConnection: any = null; // Para futura conexão com BD

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    // TODO: Adicionar conexão com banco de dados aqui
    // this.databaseConnection = new DatabaseConnection();
  }

  async analyzeData(): Promise<AIInsight[]> {
    // Retornar insights genéricos sem números inventados
    const insights: AIInsight[] = [
      {
        id: "1",
        type: "recommendation",
        title: "Análise de Dados Necessária",
        description:
          "Para fornecer insights precisos, é necessário analisar os dados reais da base de licenciados.",
        confidence: 1.0,
        priority: "high",
        actionable: true,
        suggestedActions: [
          "Conectar base de dados para análise em tempo real",
          "Implementar consultas SQL para métricas principais",
          "Criar dashboard com KPIs atualizados automaticamente",
        ],
        timestamp: new Date(),
      },
      {
        id: "2",
        type: "alert",
        title: "Monitoramento de Taxa de Ativação",
        description:
          "Configure alertas automáticos para monitorar a taxa de ativação (licenciados com coluna W preenchida).",
        confidence: 1.0,
        priority: "medium",
        actionable: true,
        suggestedActions: [
          "Definir meta de taxa de ativação",
          "Criar alertas para quedas significativas",
          "Implementar análise semanal de tendências",
        ],
        timestamp: new Date(),
      },
      {
        id: "3",
        type: "recommendation",
        title: "Análise Regional Recomendada",
        description:
          "Analise a distribuição e performance por UF para identificar oportunidades regionais.",
        confidence: 0.95,
        priority: "medium",
        actionable: true,
        suggestedActions: [
          "Agrupar dados por UF",
          "Calcular taxa de ativação por região",
          "Identificar regiões com baixa penetração",
        ],
        timestamp: new Date(),
      },
    ];

    return insights;
  }

  async chatQuery(message: string, context?: any): Promise<ChatMessage> {
    try {
      if (!this.openai) {
        // Fallback inteligente quando OpenAI não está disponível
        return this.generateFallbackResponse(message);
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: message },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const aiContent = response.choices[0].message.content || "";

      // Extrair tipo de chart da resposta e gerar dados
      const { charts, insights } = this.parseResponseAndGenerateData(
        aiContent,
        message,
      );

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
        metadata: {
          query: message,
          dataUsed: ["licenciados", "performance", "geographic"],
          charts: charts,
          insights: insights,
        },
      };

      return assistantMessage;
    } catch (error) {
      console.error("Erro na consulta OpenAI:", error);
      return this.generateFallbackResponse(message);
    }
  }

  // Método exemplo para quando houver integração com dados reais
  async chatQueryWithRealData(
    message: string,
    realData: any,
  ): Promise<ChatMessage> {
    try {
      if (!this.openai) {
        return this.generateFallbackResponse(message);
      }

      // Adicionar dados reais ao contexto da mensagem
      const messageWithData = `${message}

DADOS REAIS DISPONÍVEIS:
${JSON.stringify(realData, null, 2)}

Use APENAS esses dados para sua análise. Não invente números adicionais.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: messageWithData },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const aiContent = response.choices[0].message.content || "";
      const { charts, insights } = this.parseResponseAndGenerateData(
        aiContent,
        message,
      );

      return {
        id: Date.now().toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
        metadata: {
          query: message,
          dataUsed: Object.keys(realData),
          charts: charts,
          insights: insights,
        },
      };
    } catch (error) {
      console.error("Erro na consulta OpenAI:", error);
      return this.generateFallbackResponse(message);
    }
  }

  private getSystemPrompt(): string {
    return `# System Prompt - IA Analytics Assistant iGreen Energy

## Identidade e Contexto

Você é GAIA (Green Analytics Intelligence Assistant), um cientista de dados expert e conselheiro estratégico da iGreen Energy. Você possui PhD em Data Science, especialização em redes MLM e 15 anos de experiência em analytics.

## REGRA FUNDAMENTAL: NUNCA INVENTE DADOS

**CRÍTICO**: Você NUNCA deve inventar números, valores ou estatísticas. Se você não tiver acesso aos dados reais através de consulta ao banco de dados, você deve:
1. Informar que precisa consultar os dados reais
2. Indicar exatamente quais campos/colunas precisa analisar
3. Solicitar acesso aos dados ou sugerir como obtê-los
4. NUNCA use placeholders como [valor] ou invente números

## Quando Receber Dados via Context

Se você receber dados reais através do contexto da conversa (ex: resultados de queries SQL, dados de planilhas), então:
1. Use APENAS os dados fornecidos
2. Faça cálculos precisos baseados nesses dados
3. Identifique padrões reais
4. Gere visualizações com os números verdadeiros
5. Seja específico e preciso em suas análises

## Dados Disponíveis

Você tem acesso em tempo real a:

### 1. Base de Licenciados (65.467 registros)
- **Identificação**: Codigo, Nome, CPF, Email, Celular
- **Status**: Ativo/Inativo, Data Ativação, Data Renovação
- **Performance**: Clientes Ativos, Clientes TELECOM
- **Rede**: Licenciados Cadastrados, Licenciados Ativos (obs: se na coluna W "data ativo" tiver alguma data significa que o cliente está ativo, se estiver vazio ele não está ativo)
- **Hierarquia**: Idpatrocinador, Patrocinador, Graduação
- **Geografia**: Cidade, UF, CEP, Endereço

### 2. Sistema de Graduações
- **Graduação**: Sênior → Gestor → Executivo → Diretor → Acionista
- **Graduação Expansão**: S-Expansão → G-Expansão → E-Expansão → D-Expansão
- **Requisitos**: kWh acumulados e licenciados ativos diretos

### 3. Métricas Calculadas
- Taxa de Ativação = (Ativos / Total) × 100
- Churn Rate = Inativos no período / Ativos início período
- LTV = Valor médio × Tempo médio ativo
- CAC = Custo total aquisição / Novos licenciados

**IMPORTANTE**: Se você não tiver os dados específicos em mãos (via context ou consulta real ao banco), você deve ser transparente e dizer algo como:
"Para calcular essa métrica com precisão, preciso consultar os dados reais da base. Especificamente, preciso contar quantos registros têm data na coluna W (Data Ativo) versus o total de registros."

## Suas Responsabilidades

### 1. Análise Preditiva
- Identificar licenciados em risco de churn (baseado em padrões)
- Prever crescimento da rede
- Antecipar mudanças de graduação
- Calcular probabilidade de sucesso

### 2. Insights Estratégicos
- Identificar gargalos de crescimento
- Sugerir ações para aumentar ativação
- Otimizar distribuição geográfica
- Melhorar performance individual

### 3. Alertas Inteligentes
- Licenciados próximos ao vencimento (30/60 dias)
- Queda de performance significativa
- Oportunidades de crescimento não exploradas
- Anomalias nos dados

### 4. Recomendações Personalizadas
- Para cada licenciado: próximos passos
- Para líderes: como ajudar sua equipe
- Para empresa: estratégias macro

## Formato de Resposta

### Para Análises
\`\`\`
📊 ANÁLISE: [Título]

📈 DADOS PRINCIPAIS:
• Métrica 1: valor (tendência)
• Métrica 2: valor (comparação)

💡 INSIGHTS:
1. [Insight acionável]
2. [Padrão identificado]

🎯 AÇÕES RECOMENDADAS:
□ Ação específica 1
□ Ação específica 2

⚠️ PONTOS DE ATENÇÃO:
- [Risco ou alerta]
\`\`\`

### Para Perguntas Diretas
- Seja conciso mas completo
- Use bullet points para clareza
- Inclua números sempre que relevante
- Sugira visualizações quando apropriado

## Visualizações de Dados

IMPORTANTE: Para gerar visualizações, use estes marcadores no final da resposta:
- [CHART:line] para tendências temporais (evolução, crescimento)
- [CHART:bar] para comparações entre categorias (estados, graduações)
- [CHART:pie] para distribuições percentuais (proporções)
- [CHART:combo] para análises múltiplas

Sempre que uma visualização for relevante, inclua o marcador apropriado.

## Exemplos de Interações

### Exemplo 1: Análise de Churn
**User**: "Quais licenciados estão em risco de churn?"

**GAIA**: 
Para identificar licenciados em risco de churn com precisão, preciso consultar os dados reais da base. Especificamente, preciso analisar:

1. **Coluna W (Data Ativo)**: Para identificar licenciados ativos
2. **Coluna Clientes Ativos**: Para ver queda de performance
3. **Coluna Data Renovação**: Para identificar próximos vencimentos
4. **Coluna Idpatrocinador**: Para verificar status do patrocinador

Com esses dados, poderei aplicar os critérios de risco:
- Sem novos clientes há 60+ dias
- Queda de 50%+ em atividade
- Próximos do vencimento sem renovação
- Patrocinador inativo

Você pode fornecer os dados ou gostaria que eu explique como fazer essa análise?

### Exemplo 2: Taxa de Conversão
**User**: "Qual a taxa de conversão de licenciados cadastrados para ativos?"

**GAIA**:
Para calcular a taxa de conversão exata, preciso acessar os dados reais:

📊 **Dados Necessários:**
- Total de registros na base (licenciados cadastrados)
- Quantidade de registros com data preenchida na coluna W (licenciados ativos)

📐 **Cálculo:**
Taxa de Conversão = (Licenciados Ativos / Total Cadastrados) × 100

Se você tiver acesso à base, pode contar:
1. Total de linhas = Licenciados Cadastrados
2. Linhas com coluna W preenchida = Licenciados Ativos

Posso ajudar a interpretar os resultados quando você tiver esses números.

## Capacidades Especiais

### 1. Queries Complexas
- "Mostre a evolução de João Silva em 2024"
- "Compare performance SP vs RJ vs MG"
- "Qual o ROI médio por graduação?"

### 2. Visualizações Sugeridas
Quando apropriado, sugira:
- Tipo de gráfico ideal
- Métricas a incluir
- Período de análise
- Filtros relevantes

### 3. Análise Preditiva
Use padrões históricos para:
- Prever crescimento
- Estimar churn
- Calcular probabilidades
- Projetar cenários

## Tom e Estilo

- **Profissional** mas acessível
- **Direto** ao ponto
- **Otimista** mas realista
- Use **emojis** para organizar visualmente
- Foque em **ações práticas**
- Sempre ofereça **próximos passos**

## Limitações

- Não faça promessas de ganhos
- Não acesse dados pessoais sensíveis sem permissão
- Sempre baseie insights em dados reais
- Indique quando uma análise precisa de mais dados

---

Lembre-se: Seu objetivo é transformar dados em decisões que façam a rede crescer de forma sustentável e lucrativa.`;
  }

  private parseResponseAndGenerateData(content: string, query: string) {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let charts: any[] = [];
    let insights: any[] = [];

    // Detectar marcadores de chart na resposta mas sem dados inventados
    if (content.includes("[CHART:bar]")) {
      // Chart vazio indica que dados reais são necessários
      charts = [
        {
          type: "bar",
          needsData: true,
          dataDescription: "Dados reais necessários para visualização",
        },
      ];
    }

    if (content.includes("[CHART:pie]")) {
      charts = [
        {
          type: "pie",
          needsData: true,
          dataDescription: "Dados reais necessários para visualização",
        },
      ];
    }

    if (content.includes("[CHART:line]")) {
      charts = [
        {
          type: "line",
          needsData: true,
          dataDescription: "Dados temporais necessários para visualização",
        },
      ];
    }

    // Extrair insights se mencionados
    if (lowerContent.includes("ações recomendadas")) {
      insights = [
        {
          description: "Implementação das estratégias identificadas",
          suggestedActions: [
            "Análise detalhada dos dados",
            "Implementação gradual",
            "Monitoramento contínuo",
          ],
        },
      ];
    }

    return { charts, insights };
  }

  private generateFallbackResponse(message: string): ChatMessage {
    // Resposta honesta quando não há acesso aos dados reais
    const lowerMessage = message.toLowerCase();

    let content = "";
    let charts: any[] = [];
    let insights: any[] = [];

    if (lowerMessage.includes("taxa") && lowerMessage.includes("conversão")) {
      content = `📊 Para calcular a taxa de conversão de licenciados cadastrados para ativos, preciso acessar os dados reais da base.

**Dados Necessários:**
• Total de registros na base (licenciados cadastrados)
• Quantidade de registros com data preenchida na coluna W (licenciados ativos)

**Como calcular:**
Taxa de Conversão = (Licenciados Ativos / Total Cadastrados) × 100

**Para obter esses dados:**
1. Conte o total de linhas da planilha = Licenciados Cadastrados
2. Conte quantas linhas têm a coluna W (Data Ativo) preenchida = Licenciados Ativos
3. Aplique a fórmula acima

💡 Posso ajudar a interpretar os resultados e sugerir ações baseadas na taxa que você encontrar!`;
    } else if (
      lowerMessage.includes("churn") ||
      lowerMessage.includes("risco")
    ) {
      content = `📊 ANÁLISE: Identificação de Licenciados em Risco

Para identificar licenciados em risco de churn, preciso analisar os seguintes dados da base:

**Critérios de Risco a Verificar:**
1. **Baixa Performance**: 
   - Coluna "Clientes Ativos" < 2
   - Sem novos clientes há 60+ dias

2. **Próximos do Vencimento**:
   - Coluna "Data Renovação" < 30 dias
   - Sem atividade recente

3. **Rede Inativa**:
   - Patrocinador com coluna W vazia (inativo)
   - Sem licenciados ativos na downline

**Como fazer a análise:**
1. Filtre licenciados com coluna W preenchida (ativos)
2. Aplique os critérios acima
3. Ordene por prioridade de risco

Preciso dos dados reais para fornecer números específicos. Posso guiá-lo na análise quando tiver acesso à base!`;
    } else if (
      lowerMessage.includes("compare") ||
      lowerMessage.includes("estado")
    ) {
      content = `📊 ANÁLISE: Comparativo entre Estados

Para fazer um comparativo preciso entre estados, preciso consultar:

**Dados Necessários por Estado:**
• Total de licenciados (agrupar por coluna UF)
• Licenciados ativos (coluna W preenchida)
• Média de clientes ativos por licenciado
• Distribuição por graduação

**Métricas para Comparar:**
1. Taxa de ativação por estado
2. Performance média (clientes/licenciado)
3. Índice de crescimento
4. Distribuição de graduações

**Como analisar:**
1. Agrupe os dados por UF
2. Calcule as métricas acima para cada estado
3. Identifique padrões e oportunidades

Forneça os dados e posso ajudar com insights específicos e estratégias regionais!`;
    } else if (
      lowerMessage.includes("graduação") ||
      lowerMessage.includes("distribuição")
    ) {
      content = `📊 ANÁLISE: Distribuição por Graduações

Para analisar a distribuição real por graduações, preciso verificar:

**Dados Necessários:**
• Coluna "Graduação" de todos os registros
• Status ativo/inativo (coluna W)
• Performance por graduação

**Graduações no Sistema:**
- Sênior → Gestor → Executivo → Diretor → Acionista
- Graduações Expansão: S-Expansão → G-Expansão → E-Expansão → D-Expansão

**Como analisar:**
1. Conte licenciados por graduação
2. Calcule percentuais
3. Analise taxa de progressão entre níveis
4. Identifique gargalos

Com os dados reais, posso identificar oportunidades de crescimento e sugerir programas de progressão!`;
    } else {
      content = `Olá! Sou GAIA, sua assistente de inteligência analítica da iGreen Energy.

**Para fornecer análises precisas, preciso acesso aos dados reais da base de 65.467 licenciados.**

📊 **Análises que posso realizar com os dados:**

• **Taxa de Conversão**: Quantos cadastrados estão ativos
• **Análise de Churn**: Identificar licenciados em risco
• **Comparativos Regionais**: Performance por estado/cidade
• **Distribuição por Graduações**: Pirâmide organizacional
• **Análise Individual**: Performance de licenciados específicos
• **Oportunidades**: Gaps e potenciais não explorados

💡 **Como posso ajudar:**
1. Explico como extrair métricas específicas dos dados
2. Interpreto resultados e identifico padrões
3. Sugiro estratégias baseadas nos números reais
4. Crio planos de ação personalizados

**Importante**: Nunca invento dados. Sempre trabalho com números reais da sua base!

Como posso ajudá-lo hoje?`;
    }

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: content,
      timestamp: new Date(),
      metadata: {
        query: message,
        dataUsed: [],
        charts: charts,
        insights: insights,
      },
    };
  }
}

export const aiService = new AIAnalyticsService();

/* 
PRÓXIMOS PASSOS PARA INTEGRAÇÃO COM DADOS REAIS:

1. Conectar com banco de dados/API que contenha os dados dos licenciados
2. Criar métodos para consultar:
   - Total de licenciados
   - Licenciados ativos (coluna W preenchida)
   - Distribuição por estado/cidade
   - Performance por graduação
   - Etc.

3. Passar os dados reais como contexto para a IA:
   const realData = await this.databaseConnection.query('SELECT ...');
   const context = {
     totalLicenciados: realData.total,
     licenciadosAtivos: realData.ativos,
     taxaConversao: (realData.ativos / realData.total) * 100
   };

4. Incluir o contexto na chamada da OpenAI:
   messages: [
     { role: "system", content: systemPrompt },
     { role: "user", content: `${message}\n\nDados disponíveis: ${JSON.stringify(context)}` }
   ]

5. Gerar charts com dados reais em vez de needsData: true
*/
