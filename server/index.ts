import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fetchLicenciados } from "./googleSheets.js";
import { aiService } from "./services/ai-service";
import analyticsRouter from "./analytics-routes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cache para os dados
let cachedData: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para buscar dados com cache
async function getLicenciados() {
  const now = Date.now();
  if (now - lastFetch > CACHE_DURATION || cachedData.length === 0) {
    cachedData = await fetchLicenciados();
    lastFetch = now;
  }
  return cachedData;
}

// ===== APIS DEVEM VIR AQUI - ANTES DO registerRoutes =====

// Endpoint de teste para verificar dados
app.get("/api/test-data", async (req: Request, res: Response) => {
  try {
    console.log("🔍 === TESTE DE DADOS ===");
    const licenciados = await fetchLicenciados();

    console.log(`📊 Total carregado: ${licenciados.length} registros`);

    if (licenciados.length > 0) {
      const primeiro = licenciados[0];
      console.log("🔍 Estrutura do primeiro registro:");
      console.log("Colunas disponíveis:", Object.keys(primeiro));

      // Verificar diferentes possibilidades de coluna de status
      const possibleColumns = [
        "Data Ativo",
        "DataAtivo",
        "data_ativo",
        "DATA_ATIVO",
        "Data_Ativo",
        "dataAtivo",
        "Data ativo",
        "data ativo",
        "Cancelado",
        "Status",
        "Ativo",
      ];

      console.log("🔍 Verificando colunas de status:");
      possibleColumns.forEach((col) => {
        if (primeiro.hasOwnProperty(col)) {
          console.log(`✅ Coluna encontrada: "${col}" = "${primeiro[col]}"`);
        }
      });

      // Contar ativos usando "Data Ativo"
      const ativosDataAtivo = licenciados.filter((l) => {
        const dataAtivo = l["Data Ativo"];
        return dataAtivo && dataAtivo.toString().trim() !== "";
      }).length;

      // Contar ativos usando "Cancelado"
      const ativosNaoCancelados = licenciados.filter((l) => {
        const cancelado = l.Cancelado;
        return cancelado !== "S" && cancelado !== "SIM";
      }).length;

      console.log(`📊 Ativos por "Data Ativo": ${ativosDataAtivo}`);
      console.log(`📊 Ativos por "Cancelado != S": ${ativosNaoCancelados}`);

      const metrics = {
        totalLicenciados: licenciados.length,
        ativosDataAtivo,
        ativosNaoCancelados,
        primeiroRegistro: primeiro,
        colunasDisponiveis: Object.keys(primeiro),
      };

      res.json(metrics);
    } else {
      res.json({ error: "Nenhum dado carregado", total: 0 });
    }
  } catch (error: any) {
    console.error("❌ Erro no teste:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// ENDPOINT DE TESTE PARA VERIFICAR DADOS
// ===========================================
app.get("/api/test-metrics", async (req, res) => {
  try {
    console.log("\n🧪 TESTE DE MÉTRICAS INICIADO");

    // 1. Buscar dados do Google Sheets
    const licenciados = await fetchLicenciados();
    console.log(`✅ Total de registros: ${licenciados.length}`);

    // 2. Verificar estrutura
    if (licenciados.length > 0) {
      const primeiro = licenciados[0];
      const colunas = Object.keys(primeiro);

      console.log("\n📋 Colunas encontradas:");
      colunas.forEach((col) => {
        const valor = primeiro[col];
        console.log(`  - ${col}: "${valor}"`);
      });

      // 3. Tentar calcular ativos
      let ativos = 0;
      let colunaUsada = null;

      // Procurar coluna de ativo
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

      for (const nomeColuna of possiveisColunas) {
        if (colunas.includes(nomeColuna)) {
          colunaUsada = nomeColuna;
          ativos = licenciados.filter(
            (l) => l[nomeColuna] && l[nomeColuna].toString().trim() !== "",
          ).length;
          break;
        }
      }

      // Se não encontrou, procurar por padrão
      if (!colunaUsada) {
        colunaUsada = colunas.find(
          (col) =>
            col.toLowerCase().includes("ativo") ||
            col.toLowerCase().includes("data"),
        );

        if (colunaUsada) {
          ativos = licenciados.filter(
            (l) => l[colunaUsada] && l[colunaUsada].toString().trim() !== "",
          ).length;
        }
      }

      const resultado = {
        sucesso: true,
        metricas: {
          total: licenciados.length,
          ativos: ativos,
          inativos: licenciados.length - ativos,
          taxaConversao: ((ativos / licenciados.length) * 100).toFixed(1) + "%",
        },
        debug: {
          colunaUsada: colunaUsada,
          totalColunas: colunas.length,
          primeirasColunas: colunas.slice(0, 10),
        },
      };

      console.log("\n📊 RESULTADO:", resultado);
      res.json(resultado);
    } else {
      res.json({ sucesso: false, erro: "Nenhum dado encontrado" });
    }
  } catch (error) {
    console.error("❌ ERRO NO TESTE:", error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// TESTE DIRETO DA IA
app.get("/api/test-ia-resposta", async (req, res) => {
  try {
    const { aiService } = await import("./services/ai-service");

    console.log("\n🤖 TESTANDO IA DIRETAMENTE");
    const resposta = await aiService.chatQuery(
      "Quantos licenciados ativos temos?",
    );

    res.json({
      pergunta: "Quantos licenciados ativos temos?",
      resposta: resposta.content,
      metadata: resposta.metadata,
    });
  } catch (error) {
    console.error("❌ ERRO:", error);
    res.status(500).json({ erro: error.message });
  }
});

// Endpoint de sincronização (teste)
app.get("/api/sync-sheets", async (req: Request, res: Response) => {
  try {
    const data = await fetchLicenciados();
    const full = req.query.full === "true"; // Parâmetro para pegar todos os dados

    res.json({
      success: true,
      count: data.length,
      data: full ? data : data.slice(0, 10), // Se full=true, retorna tudo
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// KPIs do Dashboard
app.get("/api/dashboard/kpis", async (req: Request, res: Response) => {
  try {
    const data = await getLicenciados();

    // Contar todos que NÃO estão cancelados como ativos
    const ativos = data.filter(
      (l) =>
        l.Cancelado !== "S" &&
        l.Cancelado !== "SIM" &&
        l.Status !== "CANCELADO" &&
        l.Status !== "INATIVO",
    ).length;
    const total = data.length;

    const kpis = {
      totalLicenciados: total,
      licenciadosAtivos: ativos,
      taxaAtivacao: total > 0 ? ((ativos / total) * 100).toFixed(1) : "0",
      totalClientes: data.reduce(
        (sum, l) => sum + (parseInt(l["Clientes Ativos"]) || 0),
        0,
      ),
      totalTelecom: data.reduce(
        (sum, l) => sum + (parseInt(l["Clientes TELECOM"]) || 0),
        0,
      ),
      licenciadosCadastrados: data.filter((l) => l["Licenciados Cadastrados"])
        .length,
      crescimentoMensal: "23.8", // TODO: Calcular baseado em datas reais
    };

    res.json(kpis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Top Performers
app.get(
  "/api/dashboard/top-performers",
  async (req: Request, res: Response) => {
    try {
      const data = await getLicenciados();

      // Filtrar apenas licenciados não cancelados
      const topPerformers = data
        .filter((l) => l.Cancelado !== "S" && l.Cancelado !== "SIM") // Filtro ajustado
        .map((l) => ({
          codigo: l.Codigo,
          nome: l.Nome,
          graduacao: l.Graduacao || "N/A",
          clientesAtivos: parseInt(l["Clientes Ativos"]) || 0,
          clientesTelecom: parseInt(l["Clientes TELECOM"]) || 0,
          licenciadosAtivos: parseInt(l["Licenciados Ativos"]) || 0,
          cidade: l.Cidade || "N/A",
          uf: l.Uf || "N/A",
          patrocinador: l.Patrocinador || "N/A",
        }))
        .filter((l) => l.clientesAtivos > 0) // Filtrar apenas quem tem clientes
        .sort((a, b) => b.clientesAtivos - a.clientesAtivos)
        .slice(0, 10);

      res.json(topPerformers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Distribuição por Graduação
app.get("/api/dashboard/by-graduation", async (req: Request, res: Response) => {
  try {
    const data = await getLicenciados();

    const graduacoes = [
      "ACIONISTA",
      "DIRETOR",
      "EXECUTIVO",
      "GESTOR",
      "SENIOR",
    ]; // Valores possíveis em maiúsculo
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#10B981", "#3B82F6"];

    const distribution = graduacoes.map((grad, index) => {
      const count = data.filter(
        (l) =>
          l.Cancelado !== "S" &&
          l.Cancelado !== "SIM" &&
          (l.Graduacao?.toUpperCase()?.includes(grad) ||
            l.Graduacaoexpansao?.toUpperCase()?.includes(grad.charAt(0))), // S-EXPANSAO, G-EXPANSAO, etc
      ).length;
      return {
        name: grad.charAt(0) + grad.slice(1).toLowerCase(), // Capitalizar
        value: count,
        color: colors[index],
      };
    });

    res.json(distribution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Distribuição por Estado
app.get("/api/dashboard/by-state", async (req: Request, res: Response) => {
  try {
    const data = await getLicenciados();

    const byState = data.reduce(
      (acc, l) => {
        const uf = l.Uf || "N/A";
        if (!acc[uf]) {
          acc[uf] = {
            uf: uf,
            total: 0,
            ativos: 0,
            clientes: 0,
          };
        }
        acc[uf].total++;
        if (l.Cancelado !== "S" && l.Cancelado !== "SIM") acc[uf].ativos++; // Contabilizar não cancelados como ativos
        acc[uf].clientes += parseInt(l["Clientes Ativos"]) || 0;
        return acc;
      },
      {} as Record<string, any>,
    );

    // Converter para array e ordenar por total
    const stateArray = Object.values(byState)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10); // Top 10 estados

    res.json(stateArray);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Evolução temporal (mockado por enquanto - precisa de dados históricos)
app.get("/api/dashboard/evolution", async (req: Request, res: Response) => {
  try {
    // Por enquanto, vamos retornar dados simulados
    // TODO: Implementar com dados históricos reais
    const evolutionData = [
      { month: "Jan", ativos: 45000, inativos: 12000 },
      { month: "Fev", ativos: 48000, inativos: 11000 },
      { month: "Mar", ativos: 52000, inativos: 10000 },
      { month: "Abr", ativos: 55000, inativos: 9500 },
      { month: "Mai", ativos: 58000, inativos: 9000 },
      { month: "Jun", ativos: 61000, inativos: 8500 },
    ];

    res.json(evolutionData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para buscar rede específica de um licenciado (DEVE VIR ANTES)
app.get("/api/network/:codigo", async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const { levels = "3", includeParent = "true", limit = "200" } = req.query;

    const allData = await getLicenciados();

    // Encontrar o licenciado raiz
    const rootLicenciado = allData.find((l) => l.Codigo === codigo);
    if (!rootLicenciado) {
      return res.status(404).json({
        success: false,
        error: "Licenciado não encontrado",
      });
    }

    const networkData = [];
    const visited = new Set();

    // Função para buscar descendentes recursivamente
    const getDescendants = (
      parentCodigo: string,
      currentLevel: number,
      maxLevels: number,
    ) => {
      if (currentLevel > maxLevels) return;

      // Buscar filhos diretos do patrocinador
      const children = allData.filter(
        (l) =>
          l.Idpatrocinador === parentCodigo &&
          l.Cancelado !== "S" &&
          l.Codigo !== parentCodigo &&
          !visited.has(l.Codigo),
      );

      console.log(
        `Nível ${currentLevel}: Buscando filhos de ${parentCodigo}, encontrados: ${children.length}`,
      );
      children.forEach((child) =>
        console.log(`  - Filho: ${child.Codigo} (${child.Nome})`),
      );

      children.forEach((child) => {
        if (networkData.length < parseInt(limit as string)) {
          visited.add(child.Codigo);
          networkData.push({
            codigo: child.Codigo,
            nome: child.Nome,
            graduacao: child.Graduacao || "N/A",
            status: child.Cancelado === "S" ? "inativo" : "ativo",
            clientesAtivos: parseInt(child["Clientes Ativos"]) || 0,
            clientesTelecom: parseInt(child["Clientes Telecom"]) || 0,
            licenciadosAtivos: parseInt(child["Licenciados Ativos"]) || 0,
            cidade: child.Cidade || "N/A",
            uf: child.Uf || "N/A",
            patrocinador: child.Idpatrocinador,
            graduacaoExpansao: child["Graduação Expansão"] || "N/A",
            tipoLicenca: child["Tipo Licença"] || "N/A",
          });

          // Continuar buscando descendentes deste filho
          getDescendants(child.Codigo, currentLevel + 1, maxLevels);
        }
      });
    };

    // Adicionar o licenciado raiz
    visited.add(rootLicenciado.Codigo);
    networkData.push({
      codigo: rootLicenciado.Codigo,
      nome: rootLicenciado.Nome,
      graduacao: rootLicenciado.Graduacao || "N/A",
      status: rootLicenciado.Cancelado === "S" ? "inativo" : "ativo",
      clientesAtivos: parseInt(rootLicenciado["Clientes Ativos"]) || 0,
      clientesTelecom: parseInt(rootLicenciado["Clientes Telecom"]) || 0,
      licenciadosAtivos: parseInt(rootLicenciado["Licenciados Ativos"]) || 0,
      cidade: rootLicenciado.Cidade || "N/A",
      uf: rootLicenciado.Uf || "N/A",
      patrocinador: rootLicenciado.Idpatrocinador,
      graduacaoExpansao: rootLicenciado["Graduação Expansão"] || "N/A",
      tipoLicenca:
        rootLicenciado["Tipo Licença"] ||
        rootLicenciado["Tipo de Licença"] ||
        "N/A",
    });

    // Adicionar patrocinador (1 nível acima) se solicitado
    if (
      includeParent === "true" &&
      rootLicenciado.Idpatrocinador &&
      rootLicenciado.Idpatrocinador !== "0"
    ) {
      const parent = allData.find(
        (l) => l.Codigo === rootLicenciado.Idpatrocinador,
      );
      if (parent && !visited.has(parent.Codigo)) {
        visited.add(parent.Codigo);
        networkData.push({
          codigo: parent.Codigo,
          nome: parent.Nome,
          graduacao: parent.Graduacao || "N/A",
          status: parent.Cancelado === "S" ? "inativo" : "ativo",
          clientesAtivos: parseInt(parent["Clientes Ativos"]) || 0,
          clientesTelecom: parseInt(parent["Clientes Telecom"]) || 0,
          licenciadosAtivos: parseInt(parent["Licenciados Ativos"]) || 0,
          cidade: parent.Cidade || "N/A",
          uf: parent.Uf || "N/A",
          patrocinador: parent.Idpatrocinador,
          graduacaoExpansao: parent["Graduação Expansão"] || "N/A",
          tipoLicenca:
            parent["Tipo Licença"] || parent["Tipo de Licença"] || "N/A",
        });
      }
    }

    // Buscar descendentes DIRETOS (filhos imediatos)
    console.log(`\n=== BUSCA DE FILHOS DIRETOS ===`);
    console.log(`Código pesquisado: ${rootLicenciado.Codigo}`);
    console.log(`Nome: ${rootLicenciado.Nome}`);
    console.log(`Base de dados tem ${allData.length} licenciados no total`);

    // Buscar apenas filhos diretos onde Idpatrocinador = código do licenciado
    console.log(
      `Procurando licenciados onde Idpatrocinador = "${rootLicenciado.Codigo}"`,
    );

    const filhosDirectos = allData.filter((l) => {
      const isFilhoDirecto = l.Idpatrocinador === rootLicenciado.Codigo;
      const naoECancelado = l.Cancelado !== "S";
      const naoEEleMesmo = l.Codigo !== rootLicenciado.Codigo;

      if (isFilhoDirecto) {
        console.log(
          `  ⚠️ Candidato: ${l.Codigo} (${l.Nome}) - Cancelado: ${l.Cancelado}`,
        );
      }

      return isFilhoDirecto && naoECancelado && naoEEleMesmo;
    });

    console.log(`\n📊 RESULTADO DA BUSCA:`);
    console.log(
      `✅ Encontrados ${filhosDirectos.length} filhos diretos ATIVOS para ${rootLicenciado.Codigo}`,
    );

    if (filhosDirectos.length > 0) {
      console.log(`\n👥 FILHOS DIRETOS ENCONTRADOS:`);
      filhosDirectos.forEach((filho, index) => {
        console.log(
          `  ${index + 1}. ${filho.Codigo} - ${filho.Nome} (${filho.Graduacao})`,
        );
      });
    } else {
      console.log(
        `❌ Nenhum filho direto encontrado. Verificando alguns exemplos da base:`,
      );
      const exemplos = allData.slice(0, 5);
      exemplos.forEach((ex) => {
        console.log(
          `  Exemplo: ${ex.Codigo} - Patrocinador: ${ex.Idpatrocinador} - Cancelado: ${ex.Cancelado}`,
        );
      });
    }

    // Adicionar TODOS os filhos diretos (sem limite)
    filhosDirectos.forEach((filho) => {
      networkData.push({
        codigo: filho.Codigo,
        nome: filho.Nome,
        graduacao: filho.Graduacao || "N/A",
        status: filho.Cancelado === "S" ? "inativo" : "ativo",
        clientesAtivos: parseInt(filho["Clientes Ativos"]) || 0,
        clientesTelecom: parseInt(filho["Clientes Telecom"]) || 0,
        licenciadosAtivos: parseInt(filho["Licenciados Ativos"]) || 0,
        cidade: filho.Cidade || "N/A",
        uf: filho.Uf || "N/A",
        patrocinador: filho.Idpatrocinador,
        graduacaoExpansao: filho["Graduação Expansão"] || "N/A",
        tipoLicenca: filho["Tipo Licença"] || filho["Tipo de Licença"] || "N/A",
      });
    });

    console.log(
      `\n🎯 RESULTADO FINAL: ${networkData.length} nós na rede (patrocinador + licenciado + ${filhosDirectos.length} filhos)`,
    );
    console.log(`=== FIM DA BUSCA ===\n`);

    res.json({
      success: true,
      data: networkData,
      rootId: codigo,
      totalNodes: networkData.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Buscar licenciado específico
app.get("/api/licenciados/:codigo", async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const data = await getLicenciados();

    const licenciado = data.find((l) => l.Codigo === codigo);

    if (!licenciado) {
      return res.status(404).json({ error: "Licenciado não encontrado" });
    }

    res.json(licenciado);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para listar licenciados com paginação
app.get("/api/licenciados", async (req: Request, res: Response) => {
  try {
    const data = await getLicenciados();

    // Parâmetros de query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const status = req.query.status as string;
    const uf = req.query.uf as string;
    const graduacao = req.query.graduacao as string;

    // Filtrar dados
    let filteredData = data;

    // Filtro de busca com prioridade para matches exatos
    if (search) {
      const searchLower = search.toLowerCase().trim();

      // Primeiro, buscar matches exatos de código
      const exactCodeMatches = data.filter((l) => l.Codigo === search);

      // Depois, buscar matches exatos de nome
      const exactNameMatches = data.filter(
        (l) =>
          l.Nome?.toLowerCase() === searchLower &&
          !exactCodeMatches.find((exact) => exact.Codigo === l.Codigo),
      );

      // Por último, buscar matches parciais
      const partialMatches = data.filter((l) => {
        const isAlreadyIncluded =
          exactCodeMatches.find((exact) => exact.Codigo === l.Codigo) ||
          exactNameMatches.find((exact) => exact.Codigo === l.Codigo);

        if (isAlreadyIncluded) return false;

        return (
          l.Nome?.toLowerCase().includes(searchLower) ||
          l.Codigo?.includes(search) ||
          l.Cidade?.toLowerCase().includes(searchLower)
        );
      });

      // Combinar resultados: exatos primeiro, depois parciais
      filteredData = [
        ...exactCodeMatches,
        ...exactNameMatches,
        ...partialMatches,
      ];
    }

    // Filtro de status (adaptar para os dados reais)
    if (status) {
      if (status === "ativo") {
        filteredData = filteredData.filter((l) => l.Cancelado === "N");
      } else if (status === "inativo") {
        filteredData = filteredData.filter((l) => l.Cancelado === "S");
      }
    }

    // Filtro de UF
    if (uf) {
      filteredData = filteredData.filter((l) => l.Uf === uf);
    }

    // Filtro de graduação
    if (graduacao) {
      filteredData = filteredData.filter((l) =>
        l.Graduacao?.toLowerCase().includes(graduacao.toLowerCase()),
      );
    }

    // Paginação
    const total = filteredData.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedData = filteredData.slice(startIndex, endIndex).map((l) => ({
      id: parseInt(l.Codigo) || 0,
      codigo: l.Codigo,
      nome: l.Nome,
      status: l.Cancelado === "N" ? "ativo" : "inativo",
      clientesAtivos: parseInt(l["Clientes Ativos"]) || 0,
      clientesTelecom: parseInt(l["Clientes TELECOM"]) || 0,
      graduacao: l.Graduacao || "N/A",
      cidade: l.Cidade || "N/A",
      uf: l.Uf || "N/A",
      dataAtivacao: l["Data Ativo"] ? new Date(l["Data Ativo"]) : new Date(),
    }));

    res.json({
      data: paginatedData,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error: any) {
    console.error("Erro ao buscar licenciados:", error);
    res.status(500).json({ error: error.message });
  }
});

// KPIs para página de licenciados
app.get("/api/analytics/kpis", async (req: Request, res: Response) => {
  try {
    const data = await getLicenciados();

    const ativos = data.filter((l) => l.Cancelado === "N").length;
    const total = data.length;

    const kpis = {
      totalLicenciados: total,
      licenciadosAtivos: ativos,
      clientesTotais: data.reduce(
        (sum, l) => sum + (parseInt(l["Clientes Ativos"]) || 0),
        0,
      ),
      clientesTelecom: data.reduce(
        (sum, l) => sum + (parseInt(l["Clientes TELECOM"]) || 0),
        0,
      ),
    };

    res.json(kpis);
  } catch (error: any) {
    console.error("Erro ao buscar KPIs:", error);
    res.status(500).json({ error: error.message });
  }
});

// AI Assistant Routes
app.get("/api/ai/insights", async (req: Request, res: Response) => {
  try {
    const insights = await aiService.analyzeData();
    res.json(insights);
  } catch (error: any) {
    console.error("Error fetching AI insights:", error);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});

app.post("/api/ai/chat", async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await aiService.chatQuery(message, context);
    res.json(response);
  } catch (error: any) {
    console.error("Error processing chat message:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

// Analytics routes
app.use(analyticsRouter);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ===== AGORA SIM VEM O registerRoutes E O RESTO =====

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
