/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
    <div className={cn("flex flex-col gap-6", className)} {...rest}>
      <Card className="overflow-hidden p-0 bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/20 shadow-2xl rounded-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-4xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your POS account
                </p>
              </div>
              <div className="grid gap-3">  
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : "Login"}
              </Button>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/Data_security_01.jpg"
              width={400}
              height={400}
              alt="Login Illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
  <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 mt-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}