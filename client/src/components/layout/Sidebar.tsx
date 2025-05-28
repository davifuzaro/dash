import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Network, 
  BarChart3, 
  Users, 
  Settings, 
  Zap,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "licenciados", label: "Licenciados", icon: Users, path: "/licenciados" },
  { id: "network", label: "Network", icon: Network, path: "/network" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { id: "people", label: "People", icon: Users, path: "/people" },
  { id: "ai", label: "IA Assistant", icon: Bot, path: "/ai" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar({ expanded, onExpandedChange }: SidebarProps) {
  const [location] = useLocation();

  return (
    <motion.aside
      className="group fixed left-0 top-0 z-40 h-screen bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800 transition-all duration-200 ease-in-out"
      initial={{ width: 64 }}
      animate={{ width: expanded ? 256 : 64 }}
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-zinc-800 px-3">
          <div className="flex items-center space-x-3 w-full">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <motion.span
              className="font-semibold text-lg text-white overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{ 
                opacity: expanded ? 1 : 0,
                width: expanded ? "auto" : 0
              }}
              transition={{ duration: 0.2 }}
            >
              Analytics
            </motion.span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 mt-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (location === "/" && item.path === "/dashboard");
            
            return (
              <Link key={item.id} href={item.path}>
                <motion.div
                  className={cn(
                    "sidebar-item flex items-center rounded-xl cursor-pointer transition-all duration-200",
                    expanded ? "px-3 py-3" : "px-0 py-3 justify-center",
                    isActive
                      ? "text-emerald-400 bg-emerald-500/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                  whileHover={{ x: expanded ? 2 : 0 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", !expanded && "mx-auto")} />
                  <motion.span
                    className="ml-3 overflow-hidden whitespace-nowrap"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ 
                      opacity: expanded ? 1 : 0,
                      width: expanded ? "auto" : 0
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-zinc-800 p-2">
          <motion.div
            className={cn(
              "flex items-center hover:bg-zinc-800/50 rounded-xl cursor-pointer transition-all duration-200",
              expanded ? "px-3 py-3" : "px-0 py-3 justify-center"
            )}
            whileHover={{ x: expanded ? 2 : 0 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">JD</span>
            </div>
            <motion.div
              className="ml-3 overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{ 
                opacity: expanded ? 1 : 0,
                width: expanded ? "auto" : 0
              }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm font-medium text-white whitespace-nowrap">João Silva</p>
              <p className="text-xs text-zinc-400 whitespace-nowrap">joao@empresa.com</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}
