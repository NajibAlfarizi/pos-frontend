
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      let accessToken = "";
      let refreshToken = "";
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          accessToken = user.access_token || "";
          refreshToken = user.refresh_token || "";
        } catch {}
      }
      if (accessToken || refreshToken) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [router]);
  return null;
}
