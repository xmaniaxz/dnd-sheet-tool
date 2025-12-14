"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { account, ID } from "./appwrite";
import { useRouter } from "next/navigation";
import type { Models } from "appwrite";

type AuthUser = Pick<Models.User<Models.Preferences>, "name"> & Record<string, unknown>;

export default function LoginPage() {
  const [loggedInUser, setLoggedInUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await account.createEmailPasswordSession({
        email: email,
        password: password,
      });
      const user = await account.get();
      setLoggedInUser(user);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  const register = async () => {
    await account.create({
      userId: ID.unique(),
      email: email,
      password: password,
      name: email,
    });
    login(email, password);
  };

  const logout = async () => {
    await account.deleteSession({ sessionId: "current" });
    setLoggedInUser(null);
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await account.get();
        setLoggedInUser(user);
      } catch {
        setLoggedInUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      router.push("./dashboard");
    }
  }, [loggedInUser, router]);

  return (
    <div className="relative min-h-screen">
        {/* Background */}
        <div id="background" className="fixed inset-0 -z-10 overflow-hidden">
          <span className="absolute inset-0 bg-black/30" />
          <Image
            className="w-full h-full object-cover blur-sm"
            src="/loginBackground.jpg"
            alt="Background"
            width={1920}
            height={1080}
            priority
          />
        </div>

        {/* Theme toggle */}
        <ThemeToggle options={["light","dark"]} />

        {/* Content */}

        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="card w-full max-w-md rounded-xl p-8 shadow-xl animate-fade-in-up">
            {!loggedInUser ? (
              <div>
                <div className="flex w-full flex-col items-center">
                  <Image
                    src="/Logo.png"
                    alt="Logo"
                    width={250}
                    height={150}
                    className="mb-4 user-select-none pointer-events-none"
                    priority
                  />
                  <h1 className="mb-3 text-2xl font-semibold">
                    D&D 5e management tool
                  </h1>
                  <p className="mb-3 text-sm">Made by Wesley Bosman</p>
                </div>

                {error && (
                  <div className="mb-4 w-full rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                    Logged in successfully.
                  </div>
                )}

                <form className="flex flex-col gap-3">
                  <label className="text-sm" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="input rounded-md px-3 py-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                    disabled={loading}
                  />

                  <label className="text-sm" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="input rounded-md px-3 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />

                  <label className="mt-2 flex items-center gap-2 text-sm select-none">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer" />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="btn-primary mt-4 w-full rounded-md px-3 py-2 font-medium disabled:opacity-60"
                    disabled={loading}
                    onClick={() => login(email, password)}
                  >
                    {loading ? "Logging in…" : "Log In"}
                  </button>
                  <button
                    type="button"
                    className="btn-primary mt-4 w-full rounded-md px-3 py-2 font-medium disabled:opacity-60"
                    disabled={loading}
                    onClick={() => register()}
                  >
                    {loading ? "registering in…" : "Register"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex w-full flex-col items-center gap-4">
                <h1 className="text-2xl font-semibold">Welcome back!</h1>
                <p>Currently logged in as {loggedInUser?.name}</p>
                <span className="flex w-[80%] items-center justify-evenly gap-4">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={logout}
                  >
                    Logout
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      router.push("./dashboard");
                    }}
                  >
                    Continue
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
