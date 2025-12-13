"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect to avoid server-side redirect loops
    router.replace("/login");
  }, [router]);

  return null;
}
