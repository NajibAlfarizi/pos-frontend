"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart, RotateCcw, Tag, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getProfile } from "@/lib/api/authHelper";

// Menu utama yang selalu tampil
const mainMenuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "from-blue-500 to-cyan-500" },
  { name: "Kasir", href: "/kasir", icon: ShoppingCart, color: "from-green-500 to-emerald-500" },
  { name: "Transaksi", href: "/transaksi", icon: Package, color: "from-purple-500 to-violet-500" },
  { name: "More", href: "#", icon: MoreHorizontal, color: "from-gray-500 to-slate-500", isMore: true },
];

// Menu tambahan dalam dropdown (base items)
const baseMoreMenuItems = [
  { name: "Retur", href: "/retur", icon: RotateCcw, color: "from-red-500 to-pink-500" },
  { name: "Sparepart", href: "/sparepart", icon: Tag, color: "from-indigo-500 to-blue-500" },
  { name: "Merek", href: "/merek", icon: Users, color: "from-orange-500 to-amber-500" },
  { name: "Kategori", href: "/kategori-barang", icon: BarChart, color: "from-teal-500 to-green-500" },
];

// Owner only menu items
const ownerMoreMenuItems = [
  { name: "Laporan", href: "/laporan", icon: BarChart, color: "from-rose-500 to-red-500" },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const user = getProfile();
      setUserRole(user?.role || null);
    } catch {
      setUserRole(null);
    }
  }, []);

  // Get more menu items based on user role
  const getMoreMenuItems = () => {
    let moreMenuItems = [...baseMoreMenuItems];
    
    // Add owner-only items if user is owner
    if (userRole === 'owner') {
      moreMenuItems = [...moreMenuItems, ...ownerMoreMenuItems];
    }
    
    return moreMenuItems;
  };

  const moreMenuItems = getMoreMenuItems();

  // Check if any of the more menu items is active
  const isMoreMenuActive = moreMenuItems.some(item => {
    const isDashboard = item.name === "Dashboard" && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"));
    return isDashboard || pathname === item.href || pathname.startsWith(item.href + "/");
  });

  return (
    <>
      {/* Spacer untuk mencegah content tertutup navbar */}
      <div className="md:hidden h-20"></div>
      
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="absolute bottom-20 left-2 right-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">More Menu</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* More Menu Items */}
            <div className="grid grid-cols-2 gap-3 p-4">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isDashboard = item.name === "Dashboard" && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"));
                const active = isDashboard || pathname === item.href || pathname.startsWith(item.href + "/");
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 touch-manipulation",
                      "hover:scale-105 active:scale-95",
                      active 
                        ? `bg-gradient-to-br ${item.color} shadow-lg` 
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-center w-10 h-10 mb-2">
                      <Icon 
                        size={24} 
                        className={cn(
                          "transition-all duration-300",
                          active 
                            ? "text-white drop-shadow-sm" 
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      />
                    </div>
                    <span className={cn(
                      "text-sm font-medium text-center",
                      active 
                        ? "text-white font-semibold" 
                        : "text-gray-700 dark:text-gray-300"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50">
        {/* Background dengan blur effect */}
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50"></div>
        
        {/* Main Navigation Items */}
        <div className="relative flex justify-around items-center h-20 px-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            
            // Handle More button
            if (item.isMore) {
              return (
                <button
                  key={item.name}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={cn(
                    "flex flex-col items-center justify-center relative transition-all duration-300 ease-out",
                    "min-w-[70px] py-2 px-2 rounded-2xl touch-manipulation",
                    "transform-gpu",
                    showMoreMenu || isMoreMenuActive
                      ? "scale-105" 
                      : "scale-100 hover:scale-105 active:scale-95"
                  )}
                >
                  {/* Active indicator background for More button */}
                  {(showMoreMenu || isMoreMenuActive) && (
                    <div className={cn(
                      "absolute inset-0 rounded-2xl opacity-10 animate-pulse",
                      `bg-gradient-to-br ${item.color}`
                    )}></div>
                  )}
                  
                  {/* Icon container */}
                  <div className={cn(
                    "relative flex items-center justify-center w-9 h-9 mb-1.5 transition-all duration-300",
                    "rounded-xl",
                    showMoreMenu || isMoreMenuActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg shadow-black/20` 
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}>
                    <Icon 
                      size={18} 
                      className={cn(
                        "transition-all duration-300",
                        showMoreMenu || isMoreMenuActive
                          ? "text-white drop-shadow-sm" 
                          : "text-gray-600 dark:text-gray-400"
                      )}
                    />
                    
                    {/* Active dot indicator */}
                    {isMoreMenuActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm animate-pulse">
                        <div className={cn(
                          "w-2 h-2 rounded-full m-0.5",
                          `bg-gradient-to-br ${item.color}`
                        )}></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-xs font-medium transition-all duration-300 text-center leading-tight truncate max-w-full",
                    showMoreMenu || isMoreMenuActive
                      ? `bg-gradient-to-r ${item.color} bg-clip-text text-transparent font-semibold` 
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    {item.name}
                  </span>
                </button>
              );
            }
            
            // Handle regular menu items
            const isDashboard = item.name === "Dashboard" && (pathname === "/dashboard" || pathname.startsWith("/dashboard/"));
            const active = isDashboard || pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center relative transition-all duration-300 ease-out",
                  "min-w-[70px] py-2 px-2 rounded-2xl touch-manipulation",
                  "transform-gpu",
                  active 
                    ? "scale-105" 
                    : "scale-100 hover:scale-105 active:scale-95"
                )}
              >
                {/* Active indicator background */}
                {active && (
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-10 animate-pulse",
                    `bg-gradient-to-br ${item.color}`
                  )}></div>
                )}
                
                {/* Icon container dengan gradient untuk active state */}
                <div className={cn(
                  "relative flex items-center justify-center w-9 h-9 mb-1.5 transition-all duration-300",
                  "rounded-xl",
                  active 
                    ? `bg-gradient-to-br ${item.color} shadow-lg shadow-black/20` 
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}>
                  <Icon 
                    size={18} 
                    className={cn(
                      "transition-all duration-300",
                      active 
                        ? "text-white drop-shadow-sm" 
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  />
                  
                  {/* Floating dot indicator */}
                  {active && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm animate-pulse">
                      <div className={cn(
                        "w-2 h-2 rounded-full m-0.5",
                        `bg-gradient-to-br ${item.color}`
                      )}></div>
                    </div>
                  )}
                </div>
                
                {/* Label dengan styling yang lebih baik */}
                <span className={cn(
                  "text-xs font-medium transition-all duration-300 text-center leading-tight truncate max-w-full",
                  active 
                    ? `bg-gradient-to-r ${item.color} bg-clip-text text-transparent font-semibold` 
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  {item.name}
                </span>
                
                {/* Ripple effect untuk interaksi */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200",
                    "bg-gradient-to-br from-gray-400 to-gray-600",
                    "hover:opacity-10 active:opacity-20"
                  )}></div>
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* Home indicator untuk iPhone style */}
        <div className="flex justify-center pb-2">
          <div className="w-32 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
        </div>
      </nav>
    </>
  );
}
