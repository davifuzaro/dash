import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Building,
  Palette,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  Save,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Globe,
  Mail,
  Key,
  Link,
  Zap,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Calendar,
  FileText,
  HardDrive,
  RefreshCw,
  Loader2,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Settings {
  // Company
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  timezone: string;
  language: string;

  // Appearance
  theme: "light" | "dark" | "system";
  primaryColor: string;
  animations: boolean;
  sounds: boolean;
  compactMode: boolean;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationFrequency: string;

  // Security
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: string;
  ipWhitelist: string[];

  // Integrations
  googleSheetsId: string;
  googleSheetsSync: boolean;
  syncFrequency: string;
  webhookUrl: string;
  apiKey: string;
}

interface SyncLog {
  id: number;
  source: string;
  status: "success" | "error" | "pending";
  recordsProcessed: number;
  errorMessage?: string;
  createdAt: string;
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
  });

  // Fetch sync logs
  const { data: syncLogs } = useQuery({
    queryKey: ["/api/sync/logs"],
    queryFn: async () => {
      const response = await fetch("/api/sync/logs");
      if (!response.ok) throw new Error("Failed to fetch sync logs");
      return response.json();
    },
  });

  // Form state
  const [formData, setFormData] = useState<Partial<Settings>>({
    companyName: settings?.companyName || "iGreen Energy",
    companyEmail: settings?.companyEmail || "contato@igreen.com.br",
    companyPhone: settings?.companyPhone || "",
    companyAddress: settings?.companyAddress || "",
    timezone: settings?.timezone || "America/Sao_Paulo",
    language: settings?.language || "pt-BR",
    theme: settings?.theme || "dark",
    primaryColor: settings?.primaryColor || "#10b981",
    animations: settings?.animations ?? true,
    sounds: settings?.sounds ?? false,
    compactMode: settings?.compactMode ?? false,
    emailNotifications: settings?.emailNotifications ?? true,
    pushNotifications: settings?.pushNotifications ?? true,
    smsNotifications: settings?.smsNotifications ?? false,
    notificationFrequency: settings?.notificationFrequency || "realtime",
    twoFactorAuth: settings?.twoFactorAuth ?? false,
    sessionTimeout: settings?.sessionTimeout || 30,
    passwordPolicy: settings?.passwordPolicy || "medium",
    googleSheetsId:
      settings?.googleSheetsId ||
      "1tZow6Qud-IYaOHFMDlkzc8GcvRhCr6pJbWm4m3_XF4A",
    googleSheetsSync: settings?.googleSheetsSync ?? true,
    syncFrequency: settings?.syncFrequency || "5min",
    webhookUrl: settings?.webhookUrl || "",
    apiKey: settings?.apiKey || "",
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configurações salvas",
        description: "As alterações foram aplicadas com sucesso.",
      });
      setIsSaving(false);
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description:
          "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Sync data mutation
  const syncDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/sync/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: formData.googleSheetsId,
          range: "A1:AQ",
        }),
      });
      if (!response.ok) throw new Error("Failed to sync");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync/logs"] });
      toast({
        title: "Sincronização iniciada",
        description: "Os dados estão sendo sincronizados com o Google Sheets.",
      });
      setIsSyncing(false);
    },
    onError: () => {
      toast({
        title: "Erro na sincronização",
        description:
          "Não foi possível sincronizar os dados. Verifique as configurações.",
        variant: "destructive",
      });
      setIsSyncing(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    updateSettingsMutation.mutate(formData);
  };

  const handleSync = () => {
    setIsSyncing(true);
    syncDataMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  const getLastSyncStatus = () => {
    const lastSync = syncLogs?.[0];
    if (!lastSync) return null;

    return {
      status: lastSync.status,
      time: format(new Date(lastSync.createdAt), "dd/MM/yyyy HH:mm", {
        locale: ptBR,
      }),
      records: lastSync.recordsProcessed,
    };
  };

  const lastSync = getLastSyncStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-zinc-400 mt-1">
            Gerencie as configurações e preferências do sistema
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="border-zinc-700"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar Dados
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </motion.div>

      {/* Sync Status Alert */}
      {lastSync && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            className={`border ${
              lastSync.status === "success"
                ? "border-emerald-500/20 bg-emerald-500/5"
                : lastSync.status === "error"
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-yellow-500/20 bg-yellow-500/5"
            }`}
          >
            <Activity className="h-4 w-4" />
            <AlertTitle>Última Sincronização</AlertTitle>
            <AlertDescription>
              {lastSync.status === "success" ? (
                <span className="text-emerald-400">
                  Sincronizado com sucesso em {lastSync.time} -{" "}
                  {lastSync.records} registros processados
                </span>
              ) : lastSync.status === "error" ? (
                <span className="text-red-400">
                  Erro na sincronização em {lastSync.time}
                </span>
              ) : (
                <span className="text-yellow-400">
                  Sincronização em andamento...
                </span>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-zinc-800/50 border border-zinc-700 p-1">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-zinc-700"
          >
            <Building className="w-4 h-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-zinc-700"
          >
            <Palette className="w-4 h-4 mr-2" />
            Aparência
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-zinc-700"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-zinc-700"
          >
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="data-[state=active]:bg-zinc-700"
          >
            <Link className="w-4 h-4 mr-2" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-zinc-700">
            <Database className="w-4 h-4 mr-2" />
            Dados
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Configure as informações básicas da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">E-mail Corporativo</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, companyEmail: e.target.value })
                    }
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    value={formData.companyPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, companyPhone: e.target.value })
                    }
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timezone: value })
                    }
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">
                        São Paulo (GMT-3)
                      </SelectItem>
                      <SelectItem value="America/Manaus">
                        Manaus (GMT-4)
                      </SelectItem>
                      <SelectItem value="America/Fortaleza">
                        Fortaleza (GMT-3)
                      </SelectItem>
                      <SelectItem value="America/Noronha">
                        Fernando de Noronha (GMT-2)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Endereço</Label>
                <Textarea
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, companyAddress: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma do Sistema</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <CardTitle>Tema e Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Tema do Sistema</Label>
                <div className="grid grid-cols-3 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, theme: "light" })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.theme === "light"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Claro</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, theme: "dark" })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.theme === "dark"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Escuro</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setFormData({ ...formData, theme: "system" })
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.theme === "system"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    <Monitor className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Sistema</span>
                  </motion.button>
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="animations">Animações</Label>
                    <p className="text-sm text-zinc-500">
                      Ativar animações e transições suaves
                    </p>
                  </div>
                  <Switch
                    id="animations"
                    checked={formData.animations}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, animations: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sounds">Sons do Sistema</Label>
                    <p className="text-sm text-zinc-500">
                      Reproduzir sons para notificações e ações
                    </p>
                  </div>
                  <Switch
                    id="sounds"
                    checked={formData.sounds}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, sounds: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compactMode">Modo Compacto</Label>
                    <p className="text-sm text-zinc-500">
                      Reduzir espaçamentos para mostrar mais conteúdo
                    </p>
                  </div>
                  <Switch
                    id="compactMode"
                    checked={formData.compactMode}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, compactMode: checked })
                    }
                  />
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-2">
                <Label>Cor Principal</Label>
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-zinc-700"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <Input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    className="w-32"
                  />
                  <span className="text-sm text-zinc-500">
                    {formData.primaryColor}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como e quando você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-zinc-400" />
                    <div>
                      <Label htmlFor="emailNotifications">
                        Notificações por E-mail
                      </Label>
                      <p className="text-sm text-zinc-500">
                        Receber atualizações importantes por e-mail
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-zinc-400" />
                    <div>
                      <Label htmlFor="pushNotifications">
                        Notificações Push
                      </Label>
                      <p className="text-sm text-zinc-500">
                        Notificações no navegador e dispositivos móveis
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={formData.pushNotifications}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, pushNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-zinc-400" />
                    <div>
                      <Label htmlFor="smsNotifications">Notificações SMS</Label>
                      <p className="text-sm text-zinc-500">
                        Alertas críticos via SMS (custos adicionais)
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={formData.smsNotifications}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, smsNotifications: checked })
                    }
                  />
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-2">
                <Label htmlFor="notificationFrequency">
                  Frequência das Notificações
                </Label>
                <Select
                  value={formData.notificationFrequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, notificationFrequency: value })
                  }
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Tempo Real</SelectItem>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert className="border-blue-500/20 bg-blue-500/5">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Você sempre receberá notificações críticas de segurança,
                  independentemente das configurações.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Proteja sua conta e dados com recursos de segurança avançados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-zinc-400" />
                    <div>
                      <Label htmlFor="twoFactorAuth">
                        Autenticação de Dois Fatores
                      </Label>
                      <p className="text-sm text-zinc-500">
                        Adicione uma camada extra de segurança à sua conta
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={formData.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, twoFactorAuth: checked })
                    }
                  />
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Tempo de Sessão (minutos)
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={formData.sessionTimeout}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sessionTimeout: parseInt(e.target.value),
                        })
                      }
                      className="bg-zinc-800 border-zinc-700 w-32"
                      min={5}
                      max={120}
                    />
                    <span className="text-sm text-zinc-500">
                      Desconectar automaticamente após {formData.sessionTimeout}{" "}
                      minutos de inatividade
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordPolicy">Política de Senha</Label>
                  <Select
                    value={formData.passwordPolicy}
                    onValueChange={(value) =>
                      setFormData({ ...formData, passwordPolicy: value })
                    }
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        Básica (8+ caracteres)
                      </SelectItem>
                      <SelectItem value="medium">
                        Média (12+ caracteres, maiúsculas e números)
                      </SelectItem>
                      <SelectItem value="high">
                        Alta (16+ caracteres, todos os tipos)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert className="border-yellow-500/20 bg-yellow-500/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Alterações nas configurações de segurança podem exigir que
                  todos os usuários façam login novamente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <CardTitle>Google Sheets</CardTitle>
              <CardDescription>
                Configure a integração com o Google Sheets para sincronização de
                dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleSheetsId">ID da Planilha</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="googleSheetsId"
                    value={formData.googleSheetsId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        googleSheetsId: e.target.value,
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(formData.googleSheetsId || "")
                    }
                    className="border-zinc-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      window.open(
                        `https://docs.google.com/spreadsheets/d/${formData.googleSheetsId}`,
                        "_blank",
                      )
                    }
                    className="border-zinc-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="googleSheetsSync">
                    Sincronização Automática
                  </Label>
                  <p className="text-sm text-zinc-500">
                    Sincronizar dados automaticamente com o Google Sheets
                  </p>
                </div>
                <Switch
                  id="googleSheetsSync"
                  checked={formData.googleSheetsSync}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, googleSheetsSync: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="syncFrequency">
                  Frequência de Sincronização
                </Label>
                <Select
                  value={formData.syncFrequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, syncFrequency: value })
                  }
                  disabled={!formData.googleSheetsSync}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">A cada 5 minutos</SelectItem>
                    <SelectItem value="15min">A cada 15 minutos</SelectItem>
                    <SelectItem value="30min">A cada 30 minutos</SelectItem>
                    <SelectItem value="1hour">A cada hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Status da Conexão</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Conectado
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Última Sincronização</span>
                  <span className="text-zinc-300">
                    {lastSync?.time || "Nunca"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Registros Processados</span>
                  <span className="text-zinc-300">
                    {lastSync?.records?.toLocaleString() || "0"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <CardTitle>API e Webhooks</CardTitle>
              <CardDescription>
                Configure integrações com sistemas externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Chave API</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey || "sk_live_..."}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    className="bg-zinc-800 border-zinc-700 flex-1 font-mono"
                    disabled
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700"
                  >
                    Gerar Nova
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  Use esta chave para autenticar requisições à API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, webhookUrl: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="https://seu-dominio.com/webhook"
                />
                <p className="text-xs text-zinc-500">
                  Receba notificações em tempo real sobre eventos do sistema
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <CardTitle>Backup e Exportação</CardTitle>
              <CardDescription>
                Gerencie backups e exporte seus dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Download className="w-8 h-8 text-blue-400" />
                      <Badge className="bg-blue-500/10 text-blue-400">
                        Disponível
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-2">Exportar Dados</h4>
                    <p className="text-sm text-zinc-400 mb-4">
                      Baixe todos os seus dados em formato CSV ou JSON
                    </p>
                    <Button className="w-full" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Tudo
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <HardDrive className="w-8 h-8 text-purple-400" />
                      <Badge className="bg-purple-500/10 text-purple-400">
                        Automático
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-2">Backup Automático</h4>
                    <p className="text-sm text-zinc-400 mb-4">
                      Backups diários às 3:00 AM (horário de Brasília)
                    </p>
                    <Button className="w-full" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Ver Histórico
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Alert className="border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Backup Automático Ativo</AlertTitle>
                <AlertDescription>
                  Seus dados são salvos automaticamente a cada 24 horas. Último
                  backup: hoje às 03:00.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="glass-card border-zinc-800">
            <CardHeader>
              <CardTitle>Histórico de Sincronização</CardTitle>
              <CardDescription>
                Acompanhe o histórico de sincronizações com o Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncLogs?.slice(0, 5).map((log: SyncLog) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {log.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : log.status === "error" ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {log.status === "success"
                            ? "Sincronizado com sucesso"
                            : log.status === "error"
                              ? "Erro na sincronização"
                              : "Sincronização em andamento"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-300">
                        {log.recordsProcessed} registros
                      </p>
                      {log.errorMessage && (
                        <p className="text-xs text-red-400">
                          {log.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
