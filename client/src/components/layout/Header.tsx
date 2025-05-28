import { useLocation } from "wouter";
import { ChevronRight, Moon, Sun, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/ThemeProvider";
import { motion } from "framer-motion";

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/network": "Network",
  "/analytics": "Analytics",
  "/people": "People",
  "/settings": "Settings",
  "/": "Dashboard",
};

export function Header() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const currentPage = pageNames[location] || "Dashboard";

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          <span className="text-zinc-500">Workspace</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
          <motion.span
            key={currentPage}
            className="text-zinc-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {currentPage}
          </motion.span>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-zinc-800"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: theme === "dark" ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-zinc-400" />
              ) : (
                <Sun className="w-5 h-5 text-zinc-400" />
              )}
            </motion.div>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-zinc-800 relative"
          >
            <Bell className="w-5 h-5 text-zinc-400" />
            <motion.span
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
