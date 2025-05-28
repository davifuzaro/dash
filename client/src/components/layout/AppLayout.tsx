import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />
      <main className="flex-1 ml-16 flex flex-col h-screen">
        <Header />
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
