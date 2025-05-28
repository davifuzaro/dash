import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Download, Filter, Users, TrendingUp, Award, MapPin } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Licenciado, LicenciadoQuery, KPIData } from "@shared/schema";

export default function Licenciados() {
  const { toast } = useToast();
  const [query, setQuery] = useState<LicenciadoQuery>({
    page: 1,
    limit: 20,
    search: "",
    status: undefined,
    uf: undefined,
    graduacao: undefined,
    sortBy: "nome",
    sortOrder: "asc"
  });

  // Debounced search
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: licenciadosData, isLoading } = useQuery({
    queryKey: ["/api/licenciados", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/licenciados?${params}`);
      if (!response.ok) throw new Error('Failed to fetch licenciados');
      return response.json();
    }
  });

  const { data: kpis } = useQuery<KPIData>({
    queryKey: ["/api/analytics/kpis"],
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setQuery(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilter = (key: keyof LicenciadoQuery, value: any) => {
    setQuery(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
      params.append('format', format);

      const response = await fetch(`/api/export/licenciados?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'licenciados.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'licenciados.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Export realizado",
        description: `Dados exportados em formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erro no export",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    }
  };

  const statusColors = {
    ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    inativo: "bg-red-500/10 text-red-400 border-red-500/20",
    pendente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Licenciados</h1>
          <p className="text-zinc-500 mt-1">Gerenciamento completo da rede de licenciados</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => handleExport('csv')}
            className="border-zinc-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Licenciado
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass-card border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Total Licenciados</p>
                    <p className="text-2xl font-bold text-zinc-50">{kpis.totalLicenciados}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Ativos</p>
                    <p className="text-2xl font-bold text-zinc-50">{kpis.licenciadosAtivos}</p>
                    <p className="text-sm text-emerald-400">
                      {((kpis.licenciadosAtivos / kpis.totalLicenciados) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="glass-card border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Clientes Totais</p>
                    <p className="text-2xl font-bold text-zinc-50">{kpis.clientesTotais.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="glass-card border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Telecom</p>
                    <p className="text-2xl font-bold text-zinc-50">{kpis.clientesTelecom.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="glass-card border-zinc-800">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Buscar por nome, código ou cidade..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
              
              <Select value={query.status || "all"} onValueChange={(value) => handleFilter('status', value === "all" ? undefined : value)}>
                <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={query.uf || "all"} onValueChange={(value) => handleFilter('uf', value === "all" ? undefined : value)}>
                <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={query.graduacao || "all"} onValueChange={(value) => handleFilter('graduacao', value === "all" ? undefined : value)}>
                <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Graduação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Diamante">Diamante</SelectItem>
                  <SelectItem value="Ouro">Ouro</SelectItem>
                  <SelectItem value="Prata">Prata</SelectItem>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="glass-card border-zinc-800 overflow-hidden">
            <CardHeader className="border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <CardTitle>
                  Licenciados ({licenciadosData?.total || 0})
                </CardTitle>
                <div className="text-sm text-zinc-500">
                  Página {licenciadosData?.page || 1} de {licenciadosData?.totalPages || 1}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Licenciado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Clientes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Graduação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Localização
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {licenciadosData?.data?.map((licenciado: Licenciado, index: number) => (
                      <motion.tr
                        key={licenciado.id}
                        className="hover:bg-zinc-800/30 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-white">
                                {licenciado.nome.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-zinc-200">{licenciado.nome}</div>
                              <div className="text-sm text-zinc-500">#{licenciado.codigo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusColors[licenciado.status as keyof typeof statusColors]}>
                            {licenciado.status.charAt(0).toUpperCase() + licenciado.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-zinc-300">
                            <div>Ativos: <span className="font-medium">{licenciado.clientesAtivos}</span></div>
                            <div>Telecom: <span className="font-medium">{licenciado.clientesTelecom}</span></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-zinc-300">{licenciado.graduacao}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-zinc-300">
                            <div>{licenciado.cidade}</div>
                            <div className="text-zinc-500">{licenciado.uf}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200">
                              Editar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                              Remover
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pagination */}
      {licenciadosData && licenciadosData.totalPages > 1 && (
        <motion.div
          className="flex items-center justify-center space-x-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Button
            variant="outline"
            disabled={licenciadosData.page <= 1}
            onClick={() => handleFilter('page', licenciadosData.page - 1)}
            className="border-zinc-700"
          >
            Anterior
          </Button>
          
          <span className="text-sm text-zinc-500">
            {licenciadosData.page} de {licenciadosData.totalPages}
          </span>
          
          <Button
            variant="outline"
            disabled={licenciadosData.page >= licenciadosData.totalPages}
            onClick={() => handleFilter('page', licenciadosData.page + 1)}
            className="border-zinc-700"
          >
            Próxima
          </Button>
        </motion.div>
      )}
    </div>
  );
}