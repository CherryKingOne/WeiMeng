"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shakeRemember, setShakeRemember] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 允许 Ctrl+A / Cmd+A 全选
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      (e.target as HTMLInputElement).select();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 检查是否勾选记住我
    if (checkboxRef.current && !checkboxRef.current.checked) {
      setShakeRemember(true);
      setTimeout(() => setShakeRemember(false), 500);
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://0.0.0.0:5607/api/v1";
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 后端通常返回 {"detail": "错误信息"}
        throw new Error(typeof data.detail === 'string' ? data.detail : "登录失败，请检查账号密码");
      }

      // 保存 token
      localStorage.setItem("token", data.access_token);

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "登录服务暂不可用");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden h-screen w-screen flex">
      {/* Left: Interaction Area (40%) */}
      <div className="w-full lg:w-[40%] h-full bg-white flex flex-col relative z-10">
        {/* Logo */}
        <div className="pt-2 pl-10">
          <img
            src="/logo/logo-light-transparent.png"
            alt="Logo"
            className="h-40 w-auto max-w-[80%] object-contain object-left"
          />
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col items-center justify-start px-10 pt-0 -mt-12">
          <div className="w-full max-w-[420px]">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-[32px] font-bold text-gray-900 mb-2">
                欢迎回来
              </h1>
              <p className="text-[#9CA3AF]">请输入您的凭证以访问工作台</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-1">
                <div className="group relative transition-all duration-200 rounded-xl focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)]">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-14 bg-[#F9FAFB] rounded-xl px-4 pl-12 border-2 border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 focus:border-black peer"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-black transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="group relative transition-all duration-200 rounded-xl focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)]">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-14 bg-[#F9FAFB] rounded-xl px-4 pl-12 pr-12 border-2 border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 focus:border-black peer"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-black transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Aux Actions */}
              <div className="flex items-center justify-between">
                <label className={`flex items-center cursor-pointer group/checkbox ${shakeRemember ? 'animate-shake' : ''}`}>
                  <input type="checkbox" ref={checkboxRef} className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:bg-black peer-checked:border-black transition-all relative">
                    <svg
                      className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-has-[:checked]/checkbox:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="ml-2 text-sm text-gray-600 group-hover/checkbox:text-gray-900">
                    记住我
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-black hover:text-gray-600 transition-colors"
                >
                  忘记密码?
                </Link>
              </div>

              {/* Main Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-black text-white rounded-xl font-medium text-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                ) : (
                  "登 录"
                )}
              </button>
            </form>

            {/* Bottom Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-500">
                还没有账号？{" "}
                <Link
                  href="/signup"
                  className="text-black font-bold hover:underline"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 w-full text-center">
          <p className="text-xs text-gray-400">© WeiMeng Inc.</p>
        </div>
      </div>

      {/* Right: Visual Showcase (60%) */}
      <div className="hidden lg:flex w-[60%] h-full bg-[#F3F3F5] relative overflow-hidden items-center justify-center">
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        {/* 3D Abstract Object */}
        <div className="relative w-96 h-96 animate-float">
          {/* Main Sphere/Shape */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gray-200 to-white opacity-80 blur-xl"></div>
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-300 shadow-2xl border-none overflow-hidden backdrop-blur-[10px] bg-white/10 border-white/20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent to-black/5"></div>
            {/* Inner reflections */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/40 blur-2xl rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
          </div>

          {/* Orbiting Elements */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-gray-300/30 rounded-full animate-spin-slow"
            style={{ transform: "rotateX(70deg) translate(-50%, -50%)" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-gray-300/20 rounded-full animate-spin-slow"
            style={{
              animationDuration: "15s",
              transform: "rotateY(45deg) translate(-50%, -50%)",
            }}
          ></div>
        </div>

        {/* Quote */}
        <div className="absolute bottom-12 right-12 text-right">
          <p className="font-serif italic text-2xl text-black opacity-50">
            &quot;Design at the speed of thought.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
