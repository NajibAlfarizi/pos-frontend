"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart } from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kasir", href: "/kasir", icon: ShoppingCart },
  { name: "Transaksi", href: "/transaksi", icon: Package },
  { name: "Sparepart", href: "/sparepart", icon: Package },
  { name: "Merek", href: "/merek", icon: Users },
  { name: "Kategori Barang", href: "/kategori-barang", icon: BarChart },
  { name: "Laporan", href: "/laporan", icon: BarChart }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex md:flex-col w-64 h-screen pt-14 md:pt-16 text-black shadow-2xl bg-white dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/20"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 40,
      }}
    >
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Active jika pathname persis sama, diawali href + "/", atau dashboard (untuk /dashboard juga)
          const isDashboard = item.name === "Dashboard" && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"));
          const active = isDashboard || pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all duration-150 
                ${active ? "bg-blue-500/80 backdrop-blur-lg text-white shadow-lg" : "hover:bg-white/40 hover:backdrop-blur-lg hover:text-black/80 dark:hover:bg-black/40 dark:hover:text-white/80"}`}
              style={{
                boxShadow: active ? "0 4px 24px 0 rgba(255, 193, 7, 0.15)" : undefined,
                border: active ? "2px solid" : "2px solid transparent",
                backdropFilter: "blur(12px)",
              }}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
