"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, User } from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/kasir/dashboard", icon: Home },
  { name: "Transaksi", href: "/kasir/transaksi", icon: ShoppingCart },
  { name: "Inventaris", href: "/kasir/inventaris", icon: Package },
  { name: "Profil", href: "/kasir/profil", icon: User },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black text-white border-t border-gray-800 flex justify-around items-center h-16 shadow-lg z-50">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center text-xs transition-colors 
            ${active ? "text-yellow-400" : "text-gray-400 hover:text-white"}`}
          >
            <Icon size={22} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
