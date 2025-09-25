/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useEffect } from "react";
import { Eye, EyeOff, Smartphone, Lock, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/authHelper";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";

export function LoginForm(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(email, password);
      if (res.access_token) {
        // Simpan user, access_token, refresh_token dalam satu object agar dashboard bisa membaca token
        localStorage.setItem("user", JSON.stringify({
          ...res.user,
          access_token: res.access_token,
          refresh_token: res.refresh_token
        }));
        toast.success(`Hallo, selamat datang ${res.user.name}, have a nice day`);
        router.push("/dashboard");
      } else {
        setError("Login gagal. Cek email/password.");
        toast.error("email dan password salah");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Login gagal.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("fixed inset-0 flex items-center justify-center px-3 py-4 sm:p-4 overflow-hidden", className)} {...rest}>
      {/* Background animated elements - responsive sizes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-5 left-3 sm:top-10 sm:left-10 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-10 right-3 sm:top-20 sm:right-10 w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-5 sm:bottom-20 sm:left-20 w-12 h-12 sm:w-18 sm:h-18 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className={cn(
        "overflow-hidden p-0 backdrop-blur-xl border shadow-2xl w-full transition-all duration-700 ease-out",
        "bg-white/20 dark:bg-black/20 border-white/30 dark:border-white/10",
        // Mobile first approach
        "rounded-2xl sm:rounded-3xl",
        "max-w-sm sm:max-w-md md:max-w-3xl",
        "h-auto md:h-[520px]",
        mounted ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95"
      )}>
        <CardContent className="grid p-0 md:grid-cols-2">{/* Mobile: single column, Desktop: two columns */}
          {/* Main Form - Mobile first design */}
          <div className="relative overflow-hidden md:col-span-1">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20"></div>
            
            <form 
              className="relative z-10 p-4 sm:p-6 md:p-8 h-full flex flex-col justify-center min-h-[500px] md:min-h-0" 
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-4 sm:gap-5">
                {/* Header with animation - responsive sizing */}
                <div className={cn(
                  "flex flex-col items-center text-center space-y-2 sm:space-y-3 transition-all duration-700 ease-out delay-200",
                  mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}>
                  {/* Logo with animation - responsive sizes */}
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg transform hover:scale-110 transition-transform duration-300">
                      <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      ChiCha Mobile
                    </h1>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                      Welcome Back!
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm max-w-xs px-2">
                      Masuk ke sistem manajemen sparepart
                    </p>
                  </div>
                </div>

                {/* Email field with animation - mobile optimized */}
                <div className={cn(
                  "grid gap-2 transition-all duration-700 ease-out delay-300",
                  mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}>  
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                    <Mail className="w-3 h-3" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@example.com"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput("")}
                      disabled={loading}
                      className={cn(
                        "pl-3 pr-3 py-3 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-all duration-300",
                        "bg-white/50 dark:bg-black/30 backdrop-blur-sm",
                        "touch-manipulation", // Better touch support
                        "min-h-[44px]", // Minimum touch target size
                        focusedInput === "email" 
                          ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    />
                  </div>
                </div>

                {/* Password field with animation - mobile optimized */}
                <div className={cn(
                  "grid gap-2 transition-all duration-700 ease-out delay-400",
                  mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}>
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                    <Lock className="w-3 h-3" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput("")}
                      disabled={loading}
                      className={cn(
                        "pl-3 pr-12 py-3 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-all duration-300",
                        "bg-white/50 dark:bg-black/30 backdrop-blur-sm",
                        "touch-manipulation", // Better touch support
                        "min-h-[44px]", // Minimum touch target size
                        focusedInput === "password" 
                          ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-all duration-200",
                        "text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                        "touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center" // Better touch target
                      )}
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error message - mobile optimized */}
                {error && (
                  <div className="text-red-500 text-xs sm:text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 animate-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                {/* Submit button with animation - mobile optimized */}
                <div className={cn(
                  "transition-all duration-700 ease-out delay-500",
                  mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className={cn(
                      "w-full py-3.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg transition-all duration-300",
                      "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700",
                      "shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]",
                      "touch-manipulation min-h-[44px]", // Better touch support
                      loading ? "animate-pulse cursor-not-allowed" : ""
                    )}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm">Sedang Masuk...</span>
                      </div>
                    ) : (
                      <span className="text-sm sm:text-base">Masuk ke Dashboard</span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Right side - Image with overlay (hidden on mobile) */}
          <div className="bg-muted relative hidden md:block overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20 z-10"></div>
            
            {/* Animated decorations - responsive sizes */}
            <div className="absolute top-4 right-4 w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full backdrop-blur-sm border border-white/30 flex items-center justify-center z-20 animate-bounce">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white animate-pulse" />
            </div>
            
            <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-white/20 z-20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Smartphone className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-xs">Sistem Modern</p>
                  <p className="text-white/70 text-xs">Sparepart Management</p>
                </div>
              </div>
            </div>

            <Image
              src="/Data_security_01.jpg"
              width={600}
              height={600}
              alt="Login Illustration"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out",
                "dark:brightness-[0.4] dark:contrast-125",
                mounted ? "scale-100 opacity-100" : "scale-110 opacity-0"
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Footer with animation - mobile optimized positioning */}
      <div className={cn(
        "absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground transition-all duration-700 ease-out delay-600 px-2",
        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}>
        <p className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 border border-white/20 dark:border-white/10 whitespace-nowrap text-xs sm:text-sm">
          🔐 Sparepart Management System
        </p>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}