import React, { useState, useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import {
  Search,
  Users,
  Award,
  TrendingUp,
  RefreshCw,
  Download,
  Loader2,
  Network as NetworkIcon,
  User,
  Crown,
  Star,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Filter,
  ChevronRight,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity,
  MapPin,
  Calendar,
  Zap,
  Target,
  Trophy,
  X,
  Expand,
  Minimize,
} from "lucide-react";

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  codigo: string;
  nome: string;
  graduacao: string;
  clientesAtivos: number;
  clientesTelecom: number;
  cidade: string;
  uf: string;
  level: number;
  patrocinador?: string;
  children?: NetworkNode[];
  _children?: NetworkNode[];
  collapsed?: boolean;
  licenciadosAtivos?: number;
  graduacaoExpansao?: string;
  tipoLicenca?: string;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode;
  target: string | NetworkNode;
}

interface LicenciadoInsights {
  performanceScore: number;
  rankingRegional: number;
  totalRegional: number;
  crescimentoRede: number;
  eficiencia: number;
  comparacaoGraduacao: {
    mediaClientes: number;
    mediaTelecom: number;
    posicao: number;
    total: number;
  };
}

export default function Network() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLicenciado, setSelectedLicenciado] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    totalNodes: 0,
    totalClientes: 0,
    totalTelecom: 0,
    niveis: 0,
  });
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [allNetworkData, setAllNetworkData] = useState<any[]>([]);
  const [simulation, setSimulation] = useState<d3.Simulation<NetworkNode, NetworkLink> | null>(null);

  // Buscar licenciados
  const searchLicenciados = async () => {
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm.length < 1) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/licenciados?search=${encodeURIComponent(trimmedSearchTerm)}&limit=10`
      );
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        // Se há um match exato de código, mostrar só esse
        const exactMatch = data.data.find((licenciado: any) => 
          licenciado.codigo === trimmedSearchTerm
        );
        
        if (exactMatch) {
          setSearchResults([exactMatch]);
        } else {
          setSearchResults(data.data);
        }
        setShowSuggestions(true);
      } else {
        setSearchResults([]);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Erro ao buscar licenciados:", error);
      setSearchResults([]);
      setShowSuggestions(true);
    } finally {
      setLoading(false);
    }
  };

  // Carregar rede do licenciado
  const loadNetworkData = async (licenciadoCodigo: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `/api/network/${licenciadoCodigo}?levels=3&includeParent=true&limit=200`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setAllNetworkData(data.data);
        createD3NetworkVisualization(data.data, licenciadoCodigo);
      }
    } catch (error) {
      console.error("Erro ao carregar rede:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular insights do licenciado
  const calculateLicenciadoInsights = (licenciado: NetworkNode): LicenciadoInsights => {
    if (!allNetworkData || allNetworkData.length === 0) {
      return {
        performanceScore: 0,
        rankingRegional: 0,
        totalRegional: 0,
        crescimentoRede: 0,
        eficiencia: 0,
        comparacaoGraduacao: {
          mediaClientes: 0,
          mediaTelecom: 0,
          posicao: 0,
          total: 0,
        }
      };
    }

    // Dados regionais (mesmo UF)
    const regionais = allNetworkData.filter(l => l.uf === licenciado.uf);
    const rankingRegional = regionais
      .sort((a, b) => (b.clientesAtivos || 0) - (a.clientesAtivos || 0))
      .findIndex(l => l.codigo === licenciado.codigo) + 1;

    // Dados por graduação
    const mesmaGraduacao = allNetworkData.filter(l => l.graduacao === licenciado.graduacao);
    const mediaClientesGrad = mesmaGraduacao.reduce((sum, l) => sum + (l.clientesAtivos || 0), 0) / mesmaGraduacao.length;
    const mediaTelecomGrad = mesmaGraduacao.reduce((sum, l) => sum + (l.clientesTelecom || 0), 0) / mesmaGraduacao.length;
    const posicaoGrad = mesmaGraduacao
      .sort((a, b) => (b.clientesAtivos || 0) - (a.clientesAtivos || 0))
      .findIndex(l => l.codigo === licenciado.codigo) + 1;

    // Calcular métricas
    const descendentes = allNetworkData.filter(l => l.patrocinador === licenciado.codigo);
    const crescimentoRede = descendentes.length;
    const totalClientes = licenciado.clientesAtivos + licenciado.clientesTelecom;
    const eficiencia = descendentes.length > 0 ? totalClientes / descendentes.length : totalClientes;
    
    // Score de performance (0-100)
    const performanceScore = Math.min(100, Math.max(0, 
      (licenciado.clientesAtivos / Math.max(mediaClientesGrad, 1)) * 30 +
      (licenciado.clientesTelecom / Math.max(mediaTelecomGrad, 1)) * 25 +
      (crescimentoRede / Math.max(3, 1)) * 25 +
      (eficiencia / Math.max(10, 1)) * 20
    ));

    return {
      performanceScore: Math.round(performanceScore),
      rankingRegional,
      totalRegional: regionais.length,
      crescimentoRede,
      eficiencia: Math.round(eficiencia * 10) / 10,
      comparacaoGraduacao: {
        mediaClientes: Math.round(mediaClientesGrad),
        mediaTelecom: Math.round(mediaTelecomGrad),
        posicao: posicaoGrad,
        total: mesmaGraduacao.length,
      }
    };
  };

  // Toggle collapse/expand nós
  const toggleNode = (d: NetworkNode) => {
    if (d.children) {
      d._children = d.children;
      d.children = undefined;
      d.collapsed = true;
    } else if (d._children) {
      d.children = d._children;
      d._children = undefined;
      d.collapsed = false;
    }
    updateVisualization();
  };

  // Atualizar visualização após collapse/expand
  const updateVisualization = () => {
    if (!simulation || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    // Recalcular nós e links visíveis
    const root = simulation.nodes()[0];
    const visibleNodes: NetworkNode[] = [];
    const visibleLinks: NetworkLink[] = [];

    const traverse = (node: NetworkNode) => {
      visibleNodes.push(node);
      if (node.children && !node.collapsed) {
        node.children.forEach(child => {
          visibleLinks.push({ source: node.id, target: child.id });
          traverse(child);
        });
      }
    };

    if (root) traverse(root);

    // Atualizar simulação
    simulation.nodes(visibleNodes);
    simulation.force("link", d3.forceLink<NetworkNode, NetworkLink>(visibleLinks)
      .id(d => d.id)
      .distance(150)
      .strength(0.8));

    // Atualizar elementos visuais
    updateD3Elements(g, visibleNodes, visibleLinks);
    simulation.alpha(0.3).restart();
  };

  // Atualizar elementos D3
  const updateD3Elements = (g: any, nodes: NetworkNode[], links: NetworkLink[]) => {
    // Atualizar links
    const linkSelection = g.select(".links").selectAll("line").data(links, (d: any) => `${d.source.id || d.source}-${d.target.id || d.target}`);
    
    linkSelection.exit().remove();
    
    linkSelection.enter()
      .append("line")
      .attr("stroke", "url(#linkGradient)")
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 0.6)
      .style("filter", "drop-shadow(0 0 3px rgba(16, 185, 129, 0.3))");

    // Atualizar nós
    const nodeSelection = g.select(".nodes").selectAll(".node").data(nodes, (d: any) => d.id);
    
    nodeSelection.exit().remove();
    
    const nodeEnter = nodeSelection.enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    setupNodeElements(nodeEnter);
    
    // Merge enter + update selections
    const nodeUpdate = nodeEnter.merge(nodeSelection);
    setupNodeInteractions(nodeUpdate);
  };

  // Configurar elementos dos nós
  const setupNodeElements = (nodeEnter: any) => {
    // Círculo de fundo (glow)
    nodeEnter.append("circle")
      .attr("class", "node-glow")
      .attr("r", (d: NetworkNode) => Math.max(40, Math.min(80, Math.sqrt(d.clientesAtivos + 1) * 5)))
      .attr("fill", (d: NetworkNode) => getGraduationColor(d.graduacao))
      .attr("opacity", 0.2)
      .style("filter", "blur(8px)");

    // Círculo principal
    nodeEnter.append("circle")
      .attr("class", "node-circle")
      .attr("r", (d: NetworkNode) => Math.max(30, Math.min(60, Math.sqrt(d.clientesAtivos + 1) * 3)))
      .attr("fill", (d: NetworkNode) => getGraduationColor(d.graduacao))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.3))");

    // Ícone
    nodeEnter.append("text")
      .attr("class", "node-icon")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", (d: NetworkNode) => `${Math.max(16, Math.min(24, Math.sqrt(d.clientesAtivos + 1) * 2))}px`)
      .style("pointer-events", "none")
      .text((d: NetworkNode) => getGraduationIcon(d.graduacao));

    // Nome
    nodeEnter.append("text")
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("dy", (d: NetworkNode) => Math.max(35, Math.min(70, Math.sqrt(d.clientesAtivos + 1) * 3)) + 20)
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#e5e7eb")
      .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
      .style("pointer-events", "none")
      .text((d: NetworkNode) => d.nome.length > 15 ? `${d.nome.substring(0, 15)}...` : d.nome);

    // Código
    nodeEnter.append("text")
      .attr("class", "node-sublabel")
      .attr("text-anchor", "middle")
      .attr("dy", (d: NetworkNode) => Math.max(35, Math.min(70, Math.sqrt(d.clientesAtivos + 1) * 3)) + 35)
      .style("font-size", "10px")
      .style("fill", "#9ca3af")
      .style("pointer-events", "none")
      .text((d: NetworkNode) => `#${d.codigo}`);

    // Indicador de collapse/expand
    nodeEnter.append("circle")
      .attr("class", "collapse-indicator")
      .attr("cx", (d: NetworkNode) => Math.max(35, Math.min(70, Math.sqrt(d.clientesAtivos + 1) * 3)) + 5)
      .attr("cy", -5)
      .attr("r", 8)
      .attr("fill", "#374151")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2)
      .style("opacity", (d: NetworkNode) => (d.children || d._children) ? 1 : 0)
      .style("cursor", "pointer");

    nodeEnter.append("text")
      .attr("class", "collapse-icon")
      .attr("x", (d: NetworkNode) => Math.max(35, Math.min(70, Math.sqrt(d.clientesAtivos + 1) * 3)) + 5)
      .attr("y", -1)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "#10b981")
      .style("pointer-events", "none")
      .style("opacity", (d: NetworkNode) => (d.children || d._children) ? 1 : 0)
      .text((d: NetworkNode) => d.collapsed ? "+" : "-");
  };

  // Configurar interações dos nós
  const setupNodeInteractions = (nodeSelection: any) => {
    nodeSelection
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on("start", (event: any, d: NetworkNode) => {
          if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event: any, d: NetworkNode) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event: any, d: NetworkNode) => {
          if (!event.active && simulation) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Click no nó
    nodeSelection.on("click", (event: any, d: NetworkNode) => {
      event.stopPropagation();
      setSelectedNode(d);
      setShowAnalysisPanel(true);
    });

    // Click no indicador de collapse
    nodeSelection.select(".collapse-indicator")
      .on("click", (event: any, d: NetworkNode) => {
        event.stopPropagation();
        toggleNode(d);
      });

    // Hover effects
    nodeSelection.on("mouseover", function(event: any, d: NetworkNode) {
      const node = d3.select(this);
      
      // Destacar nó
      node.select(".node-circle")
        .transition()
        .duration(200)
        .attr("r", Math.max(35, Math.min(70, Math.sqrt(d.clientesAtivos + 1) * 3.5)))
        .attr("stroke-width", 5);

      // Mostrar tooltip com métricas
      showTooltip(event, d);
    })
    .on("mouseout", function(event: any, d: NetworkNode) {
      const node = d3.select(this);
      
      node.select(".node-circle")
        .transition()
        .duration(200)
        .attr("r", Math.max(30, Math.min(60, Math.sqrt(d.clientesAtivos + 1) * 3)))
        .attr("stroke-width", 3);

      hideTooltip();
    });
  };

  // Mostrar tooltip
  const showTooltip = (event: any, d: NetworkNode) => {
    const tooltip = d3.select("body").selectAll(".network-tooltip").data([0]);
    
    const tooltipEnter = tooltip.enter()
      .append("div")
      .attr("class", "network-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(24, 24, 27, 0.95)")
      .style("border", "1px solid #374151")
      .style("border-radius", "8px")
      .style("padding", "12px")
      .style("font-size", "12px")
      .style("color", "white")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("backdrop-filter", "blur(8px)")
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.3)")
      .style("opacity", 0);

    const tooltipUpdate = tooltipEnter.merge(tooltip);
    
    tooltipUpdate.html(`
      <div style="font-weight: 600; margin-bottom: 8px; color: #10b981;">${d.nome}</div>
      <div style="margin-bottom: 4px;"><span style="color: #9ca3af;">Código:</span> ${d.codigo}</div>
      <div style="margin-bottom: 4px;"><span style="color: #9ca3af;">Graduação:</span> ${d.graduacao}</div>
      <div style="margin-bottom: 4px;"><span style="color: #9ca3af;">Localização:</span> ${d.cidade}, ${d.uf}</div>
      <div style="margin-bottom: 4px;"><span style="color: #9ca3af;">Tipo Licença:</span> ${d.tipoLicenca || 'N/A'}</div>
      <hr style="border: none; border-top: 1px solid #374151; margin: 8px 0;">
      <div style="margin-bottom: 4px;"><span style="color: #3b82f6;">👥 Clientes Ativos:</span> ${d.clientesAtivos}</div>
      <div style="margin-bottom: 4px;"><span style="color: #8b5cf6;">📱 Clientes Telecom:</span> ${d.clientesTelecom}</div>
      <div style="margin-bottom: 4px;"><span style="color: #10b981;">🌟 Total Clientes:</span> ${d.clientesAtivos + d.clientesTelecom}</div>
      ${d.level > 0 ? `<div style="color: #f59e0b;">📊 Nível: ${d.level}</div>` : ''}
    `)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY - 10}px`)
    .transition()
    .duration(200)
    .style("opacity", 1);
  };

  // Esconder tooltip
  const hideTooltip = () => {
    d3.select("body").selectAll(".network-tooltip")
      .transition()
      .duration(200)
      .style("opacity", 0)
      .remove();
  };

  // Criar visualização com D3.js Force Layout
  const createD3NetworkVisualization = (networkData: any[], rootId: string) => {
    if (!svgRef.current || !networkData || networkData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Criar estrutura de dados hierárquica
    const nodeMap = new Map();
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    // Mapear todos os nós
    networkData.forEach((item) => {
      const node: NetworkNode = {
        id: item.codigo,
        codigo: item.codigo,
        nome: item.nome || "N/A",
        graduacao: item.graduacao || "N/A",
        clientesAtivos: item.clientesAtivos || 0,
        clientesTelecom: item.clientesTelecom || 0,
        cidade: item.cidade || "N/A",
        uf: item.uf || "N/A",
        level: 0,
        patrocinador: item.patrocinador,
        licenciadosAtivos: item.licenciadosAtivos || 0,
        graduacaoExpansao: item.graduacaoExpansao || "N/A",
        tipoLicenca: item.tipoLicenca || "N/A",
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
        children: [],
        collapsed: false,
      };
      nodes.push(node);
      nodeMap.set(item.codigo, node);
    });

    // Criar hierarquia
    nodes.forEach(node => {
      if (node.patrocinador && node.patrocinador !== "0" && nodeMap.has(node.patrocinador)) {
        const parent = nodeMap.get(node.patrocinador);
        if (parent.children) {
          parent.children.push(node);
        }
        links.push({
          source: node.patrocinador,
          target: node.codigo,
        });
      }
    });

    // Definir níveis
    const setLevels = (nodeId: string, level: number) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.level = level;
        if (node.children) {
          node.children.forEach((child: NetworkNode) => {
            setLevels(child.codigo, level + 1);
          });
        }
      }
    };
    setLevels(rootId, 0);

    // Configurar simulação
    const sim = d3.forceSimulation<NetworkNode>(nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(150)
        .strength(0.8))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(80));

    setSimulation(sim);

    // Criar grupo principal
    const g = svg.append("g");

    // Configurar zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Gradientes
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "linkGradient");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#10b981")
      .attr("stop-opacity", 0.8);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.3);

    // Criar grupos para links e nós
    const linkGroup = g.append("g").attr("class", "links");
    const nodeGroup = g.append("g").attr("class", "nodes");

    // Criar links
    const link = linkGroup.selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "url(#linkGradient)")
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 0.6)
      .style("filter", "drop-shadow(0 0 3px rgba(16, 185, 129, 0.3))");

    // Criar nós
    const node = nodeGroup.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    setupNodeElements(node);
    setupNodeInteractions(node);

    // Atualizar posições
    sim.on("tick", () => {
      link
        .attr("x1", d => typeof d.source === 'string' ? 0 : d.source.x!)
        .attr("y1", d => typeof d.source === 'string' ? 0 : d.source.y!)
        .attr("x2", d => typeof d.target === 'string' ? 0 : d.target.x!)
        .attr("y2", d => typeof d.target === 'string' ? 0 : d.target.y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Calcular estatísticas
    const stats = {
      totalNodes: nodes.length,
      totalClientes: nodes.reduce((sum, node) => sum + node.clientesAtivos, 0),
      totalTelecom: nodes.reduce((sum, node) => sum + node.clientesTelecom, 0),
      niveis: Math.max(...nodes.map(node => node.level)) + 1,
    };
    setNetworkStats(stats);

    // Centrar no nó raiz
    const rootNode = nodes.find(n => n.id === rootId);
    if (rootNode) {
      setTimeout(() => {
        const transform = d3.zoomIdentity
          .translate(width / 2 - rootNode.x!, height / 2 - rootNode.y!)
          .scale(0.8);
        svg.transition().duration(1000).call(zoomBehavior.transform, transform);
      }, 1000);
    }
  };

  // Funções auxiliares
  const getGraduationColor = (graduacao: string) => {
    if (graduacao?.includes("PRESIDENTE")) return "#FFD700";
    if (graduacao?.includes("DIRETOR")) return "#C0C0C0";
    if (graduacao?.includes("EXECUTIVO")) return "#CD7F32";
    if (graduacao?.includes("GESTOR")) return "#10B981";
    if (graduacao?.includes("CONSULTOR")) return "#3B82F6";
    return "#6B7280";
  };

  const getGraduationIcon = (graduacao: string) => {
    if (graduacao?.includes("PRESIDENTE")) return "👑";
    if (graduacao?.includes("DIRETOR")) return "⭐";
    if (graduacao?.includes("EXECUTIVO")) return "🏆";
    if (graduacao?.includes("GESTOR")) return "💼";
    return "👤";
  };

  // Resetar visualização
  const resetNetwork = () => {
    setSelectedLicenciado(null);
    setSearchTerm("");
    setShowSuggestions(false);
    setSearchResults([]);
    setSelectedNode(null);
    setShowAnalysisPanel(false);
    setNetworkStats({ totalNodes: 0, totalClientes: 0, totalTelecom: 0, niveis: 0 });
    
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();
    }
    if (simulation) {
      simulation.stop();
      setSimulation(null);
    }
  };

  // Funções de zoom
  const zoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 1.5);
    }
  };

  const zoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 0.67);
    }
  };

  const resetZoom = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
    }
  };

  // Expandir todos os nós
  const expandAllNodes = () => {
    if (!simulation) return;

    const nodes = simulation.nodes();
    let hasChanges = false;

    // Expandir todos os nós colapsados
    const expandNode = (node: NetworkNode) => {
      if (node._children && node.collapsed) {
        node.children = node._children;
        node._children = undefined;
        node.collapsed = false;
        hasChanges = true;
      }
      if (node.children) {
        node.children.forEach(expandNode);
      }
    };

    nodes.forEach(expandNode);

    if (hasChanges) {
      updateVisualization();
    }
  };

  // Centralizar no nó selecionado
  const centerOnSelectedNode = () => {
    if (!selectedNode || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const transform = d3.zoomIdentity
      .translate(width / 2 - selectedNode.x!, height / 2 - selectedNode.y!)
      .scale(1.2);

    svg.transition()
      .duration(750)
      .call(d3.zoom<SVGSVGElement, unknown>().transform, transform);
  };

  // Tela inicial de busca
  if (!selectedLicenciado && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl">
              <NetworkIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Análise Avançada de Rede
              </h1>
              <p className="text-zinc-400 mt-1">
                Explore insights profundos com visualização interativa e analytics em tempo real
              </p>
            </div>
          </div>

          {/* Área de busca centralizada */}
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-4">Escolha um Licenciado</h2>
              <p className="text-zinc-400 max-w-md">
                Digite o código ou nome para visualizar análises avançadas com 3 níveis de descendentes
              </p>
            </div>

            {/* Campo de busca */}
            <div className="w-full max-w-lg">
              <div className="flex space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Digite o código ou nome do licenciado..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (showSuggestions) {
                        setShowSuggestions(false);
                        setSearchResults([]);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && searchTerm.trim().length > 0) {
                        searchLicenciados();
                      }
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 backdrop-blur border border-zinc-700 rounded-xl text-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <button
                  onClick={searchLicenciados}
                  disabled={searchTerm.trim().length < 1 || loading}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-zinc-700 disabled:to-zinc-800 disabled:cursor-not-allowed rounded-xl text-lg font-semibold transition-all flex items-center space-x-2 shadow-lg hover:shadow-emerald-500/25"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span>Buscar</span>
                </button>
              </div>

              {/* Resultados da busca */}
              {showSuggestions && searchResults.length === 1 && (
                <div className="mt-4 p-4 bg-emerald-900/20 backdrop-blur border border-emerald-700 rounded-xl">
                  <p className="text-emerald-400 font-semibold">Licenciado encontrado!</p>
                  <p className="text-white mt-1">
                    {searchResults[0].nome} - Código: {searchResults[0].codigo}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedLicenciado(searchResults[0]);
                      setSearchTerm(`${searchResults[0].codigo} - ${searchResults[0].nome}`);
                      setShowSuggestions(false);
                      loadNetworkData(searchResults[0].codigo);
                    }}
                    className="mt-3 px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-lg transition-all flex items-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Análise Completa</span>
                  </button>
                </div>
              )}

              {showSuggestions && searchResults.length === 0 && (
                <div className="mt-4 p-4 bg-red-900/20 backdrop-blur border border-red-700 rounded-xl text-center">
                  <p className="text-red-400">Licenciado não encontrado</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Verifique o código ou nome digitado
                  </p>
                </div>
              )}

              {showSuggestions && searchResults.length > 1 && (
                <div className="mt-4 p-4 bg-yellow-900/20 backdrop-blur border border-yellow-700 rounded-xl text-center">
                  <p className="text-yellow-400">
                    Encontrados {searchResults.length} licenciados
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Digite o código exato ou nome completo para refinar a busca
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de visualização da rede
  return (
    <div className="h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white relative">
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-700">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span>Carregando análise de rede...</span>
            </div>
          </div>
        </div>
      )}

      {/* Painel superior */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          {/* Info da rede */}
          <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl p-4 flex items-center space-x-4">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <NetworkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {selectedLicenciado?.nome}
              </h2>
              <p className="text-sm text-zinc-400">
                Código: {selectedLicenciado?.codigo} | {selectedLicenciado?.graduacao}
              </p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={zoomIn}
              className="p-2 bg-zinc-800/90 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={zoomOut}
              className="p-2 bg-zinc-800/90 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 bg-zinc-800/90 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={resetNetwork}
              className="p-2 bg-zinc-800/90 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Nova Busca"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas principais */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-blue-400 font-semibold">{networkStats.totalNodes}</p>
              <p className="text-zinc-500 text-xs">Licenciados</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-emerald-400 font-semibold">{networkStats.totalClientes}</p>
              <p className="text-zinc-500 text-xs">Clientes</p>
            </div>
            <div className="text-center">
              <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-purple-400 font-semibold">{networkStats.totalTelecom}</p>
              <p className="text-zinc-500 text-xs">Telecom</p>
            </div>
            <div className="text-center">
              <NetworkIcon className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-yellow-400 font-semibold">{networkStats.niveis}</p>
              <p className="text-zinc-500 text-xs">Níveis</p>
            </div>
          </div>
          {zoom !== 1 && (
            <div className="mt-2 pt-2 border-t border-zinc-700 text-center">
              <p className="text-xs text-zinc-400">Zoom: {zoom.toFixed(1)}x</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel de análise lateral */}
      {showAnalysisPanel && selectedNode && (
        <div className={`fixed top-0 right-0 h-full w-96 bg-zinc-900/95 backdrop-blur border-l border-zinc-700 z-20 transform transition-transform duration-300 ease-in-out ${showAnalysisPanel ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full overflow-y-auto">
            {/* Header do painel */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Análise Detalhada</h3>
              <button
                onClick={() => setShowAnalysisPanel(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Informações básicas */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGraduationColor(selectedNode.graduacao) === '#FFD700' ? 'from-yellow-400 to-yellow-600' : getGraduationColor(selectedNode.graduacao) === '#C0C0C0' ? 'from-gray-300 to-gray-500' : getGraduationColor(selectedNode.graduacao) === '#CD7F32' ? 'from-orange-400 to-orange-600' : getGraduationColor(selectedNode.graduacao) === '#10B981' ? 'from-emerald-400 to-emerald-600' : 'from-blue-400 to-blue-600'} flex items-center justify-center`}>
                  <span className="text-xl">{getGraduationIcon(selectedNode.graduacao)}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{selectedNode.nome}</h4>
                  <p className="text-sm text-zinc-400">#{selectedNode.codigo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-zinc-400 text-xs">Graduação</p>
                  <p className="text-white font-semibold">{selectedNode.graduacao}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-zinc-400 text-xs">Localização</p>
                  <p className="text-white font-semibold">{selectedNode.cidade}, {selectedNode.uf}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-zinc-400 text-xs">Tipo Licença</p>
                  <p className="text-white font-semibold">{selectedNode.tipoLicenca || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Métricas de performance */}
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Métricas de Performance
              </h5>
              
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg p-3 border border-blue-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400 text-sm">👥 Clientes Ativos</span>
                    <span className="text-white font-bold text-lg">{selectedNode.clientesAtivos}</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg p-3 border border-purple-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400 text-sm">📱 Clientes Telecom</span>
                    <span className="text-white font-bold text-lg">{selectedNode.clientesTelecom}</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-lg p-3 border border-emerald-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400 text-sm">🌟 Total Clientes</span>
                    <span className="text-white font-bold text-lg">{selectedNode.clientesAtivos + selectedNode.clientesTelecom}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights e analytics */}
            {(() => {
              const insights = calculateLicenciadoInsights(selectedNode);
              return (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Insights Avançados
                  </h5>
                  
                  {/* Score de performance */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-400 text-sm">Score de Performance</span>
                      <span className={`font-bold ${insights.performanceScore >= 70 ? 'text-emerald-400' : insights.performanceScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {insights.performanceScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${insights.performanceScore >= 70 ? 'bg-emerald-400' : insights.performanceScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${insights.performanceScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Ranking regional */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-sm">Ranking Regional ({selectedNode.uf})</p>
                        <p className="text-white font-bold text-lg">#{insights.rankingRegional}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-400 text-sm">de {insights.totalRegional}</p>
                        <Trophy className="w-6 h-6 text-yellow-400 ml-auto" />
                      </div>
                    </div>
                  </div>

                  {/* Comparação com graduação */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                    <h6 className="text-zinc-300 text-sm mb-3">Comparação - {selectedNode.graduacao}</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Posição na graduação:</span>
                        <span className="text-white font-semibold">#{insights.comparacaoGraduacao.posicao} de {insights.comparacaoGraduacao.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">vs Média clientes:</span>
                        <span className={`font-semibold ${selectedNode.clientesAtivos >= insights.comparacaoGraduacao.mediaClientes ? 'text-emerald-400' : 'text-red-400'}`}>
                          {selectedNode.clientesAtivos >= insights.comparacaoGraduacao.mediaClientes ? '+' : ''}{selectedNode.clientesAtivos - insights.comparacaoGraduacao.mediaClientes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">vs Média telecom:</span>
                        <span className={`font-semibold ${selectedNode.clientesTelecom >= insights.comparacaoGraduacao.mediaTelecom ? 'text-emerald-400' : 'text-red-400'}`}>
                          {selectedNode.clientesTelecom >= insights.comparacaoGraduacao.mediaTelecom ? '+' : ''}{selectedNode.clientesTelecom - insights.comparacaoGraduacao.mediaTelecom}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Análise de rede */}
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <h6 className="text-zinc-300 text-sm mb-3">Análise de Rede</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Descendentes diretos:</span>
                        <span className="text-white font-semibold">{insights.crescimentoRede}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Eficiência (clientes/desc):</span>
                        <span className="text-emerald-400 font-semibold">{insights.eficiencia}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Nível hierárquico:</span>
                        <span className="text-yellow-400 font-semibold">{selectedNode.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Ações rápidas */}
            <div className="mt-6">
              <h5 className="text-sm font-semibold text-zinc-300 mb-3">Ações Rápidas</h5>
              <div className="space-y-2">
                <button 
                  onClick={expandAllNodes}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Expand className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">Expandir toda a rede</span>
                  </div>
                </button>
                <button 
                  onClick={centerOnSelectedNode}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">Centralizar neste nó</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SVG da visualização */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "radial-gradient(circle at center, #1f2937 0%, #111827 100%)" }}
      />
    </div>
  );
}