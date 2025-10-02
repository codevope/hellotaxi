"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirige a la página principal del driver
    router.replace("/driver");
  }, [router]);

  return null;
}