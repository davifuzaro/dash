import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { motion } from "framer-motion";

export function NetworkVisualization() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-zinc-800">
        <CardHeader>
          <CardTitle>Visualização de Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-zinc-800/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Network className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-zinc-400 text-lg">Visualização de Network</p>
              <p className="text-zinc-600 mt-2">
                Esta visualização seria implementada com D3.js ou similar para criar
                um mindmap interativo mostrando as conexões entre entidades.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
                <motion.div
                  className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                >
                  <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                </motion.div>
                <motion.div
                  className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-full" />
                </motion.div>
                <motion.div
                  className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <div className="w-4 h-4 bg-purple-500 rounded-full" />
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
