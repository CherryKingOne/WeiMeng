"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocalePath } from "@/hooks/useLocalePath";
import { localizeRequestError } from "@/utils";

export default function SignupPage() {
  const router = useRouter();
  const { withLocalePath, locale } = useLocalePath();
  const isEn = locale === "en";
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // 验证码倒计时相关
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [shakeTerms, setShakeTerms] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(false);
  const shakeTimeoutRef = useRef<number | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  const text = {
    enterEmailFirst: isEn ? "Please enter your email first" : "请先输入邮箱",
    sendFailed: isEn ? "Failed to send verification code" : "发送失败",
    registerFailed: isEn ? "Registration failed" : "注册失败",
    successTitle: isEn ? "Welcome to WeiMeng" : "欢迎加入 WeiMeng",
    successSubtitle: isEn ? "Preparing your workspace..." : "正在为您准备工作台...",
    pageTitle: isEn ? "Create Account" : "创建账户",
    usernamePlaceholder: isEn ? "Username" : "用户名",
    captchaPlaceholder: isEn ? "Verification code" : "验证码",
    sendingCaptcha: isEn ? "Sending" : "发送中",
    sendCaptcha: isEn ? "Send code" : "发送验证码",
    passwordPlaceholder: isEn ? "Create password" : "创建密码",
    termsOfService: isEn ? "Terms of Service" : "服务条款",
    privacyPolicy: isEn ? "Privacy Policy" : "隐私政策",
    submit: isEn ? "Start Creating" : "开始创作",
    haveAccount: isEn ? "Already have an account?" : "已有账号？",
    loginNow: isEn ? "Log in" : "直接登录",
    quote: isEn ? "Unleash your creativity." : "释放你的创造力。",
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = null;
      }

      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCaptcha = async () => {
    setError("");
    if (!email) {
      setError(text.enterEmailFirst);
      return;
    }

    setIsSending(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://0.0.0.0:5607/api/v1";
      const res = await fetch(`${apiUrl}/captcha/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || text.sendFailed);
      }

      if (!isMountedRef.current) {
        return;
      }
      setCountdown(60);
    } catch (error: unknown) {
      if (!isMountedRef.current) {
        return;
      }
      const rawMessage = error instanceof Error ? error.message : "";
      setError(
        localizeRequestError({
          message: rawMessage,
          routeLocale: locale,
          zhFallback: "验证码服务暂不可用",
          enFallback: "Verification code service is currently unavailable",
        })
      );
    } finally {
      if (isMountedRef.current) {
        setIsSending(false);
      }
    }
  };

  useEffect(() => {
    let s = 0;
    if (password.length > 5) s += 1;
    if (password.length > 8 && /[A-Z]/.test(password)) s += 1;
    if (password.length > 10 && /[0-9]/.test(password)) s += 1;
    setStrength(s);
  }, [password]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 允许 Ctrl+A / Cmd+A 全选
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      (e.target as HTMLInputElement).select();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 检查是否勾选协议
    if (checkboxRef.current && !checkboxRef.current.checked) {
      setShakeTerms(true);
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
      shakeTimeoutRef.current = window.setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }
        setShakeTerms(false);
        shakeTimeoutRef.current = null;
      }, 500);
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://0.0.0.0:5607/api/v1";
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email,
          password,
          captcha
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || text.registerFailed);
      }

      // Success Overlay Animation
      if (!isMountedRef.current) {
        return;
      }
      setShowSuccess(true);

      // Redirect
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = window.setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }
        router.push(withLocalePath("/auth/login"));
      }, 2000);
    } catch (error: unknown) {
      if (!isMountedRef.current) {
        return;
      }
      const rawMessage = error instanceof Error ? error.message : "";
      setError(
        localizeRequestError({
          message: rawMessage,
          routeLocale: locale,
          zhFallback: "注册服务暂不可用",
          enFallback: "Registration service is currently unavailable",
        })
      );
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white overflow-hidden h-screen w-screen flex">
      {/* Success Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center transition-opacity duration-1000 ${showSuccess ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div
          className={`w-16 h-16 bg-black rounded-3xl flex items-center justify-center mb-6 transition-transform duration-500 delay-300 ${showSuccess ? "scale-100" : "scale-0"
            }`}
        >
          <span className="text-white font-bold text-2xl">W</span>
        </div>
        <h2
          className={`text-2xl font-semibold text-black mb-2 transition-opacity duration-500 delay-500 ${showSuccess ? "opacity-100" : "opacity-0"
            }`}
        >
          {text.successTitle}
        </h2>
        <p
          className={`text-gray-500 transition-opacity duration-500 delay-700 ${showSuccess ? "opacity-100" : "opacity-0"
            }`}
        >
          {text.successSubtitle}
        </p>
      </div>

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
            <div className="mb-8">
              <h1 className="text-[32px] font-bold text-gray-900 mb-2">
                {text.pageTitle}
              </h1>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Name */}
              <div className="space-y-1">
                <div className="group relative transition-all duration-200 rounded-xl focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)]">
                  <input
                    type="text"
                    required
                    placeholder={text.usernamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

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

              {/* Captcha */}
              <div className="space-y-1">
                <div className="flex gap-3">
                  <div className="group relative transition-all duration-200 rounded-xl focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)] flex-1">
                    <input
                      type="text"
                      required
                      placeholder={text.captchaPlaceholder}
                      value={captcha}
                      onChange={(e) => setCaptcha(e.target.value)}
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCaptcha}
                    disabled={isSending || countdown > 0}
                    className="h-14 px-6 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-w-[120px] flex items-center justify-center"
                  >
                    {countdown > 0 ? (
                      `${countdown}s`
                    ) : isSending ? (
                      <span className="inline-flex items-end gap-1">
                        <span>{text.sendingCaptcha}</span>
                        <span className="flex h-3 items-end gap-0.5">
                          <span className="w-1 h-1 bg-white rounded-full [animation:signup-wave_0.75s_ease-in-out_infinite]"></span>
                          <span
                            className="w-1 h-1 bg-white rounded-full [animation:signup-wave_0.75s_ease-in-out_infinite]"
                            style={{ animationDelay: "0.12s" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-white rounded-full [animation:signup-wave_0.75s_ease-in-out_infinite]"
                            style={{ animationDelay: "0.24s" }}
                          ></span>
                        </span>
                      </span>
                    ) : (
                      text.sendCaptcha
                    )}
                  </button>
                </div>
              </div>

              {/* Password with Strength Meter */}
              <div className="space-y-1 relative">
                <div className="group relative transition-all duration-200 rounded-xl overflow-hidden focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)]">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={text.passwordPlaceholder}
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
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
                  {/* Strength Bar */}
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-0 bg-transparent transition-[width,background-color] duration-300 ease-out"
                    style={{
                      width:
                        password.length === 0
                          ? "0%"
                          : strength === 1
                            ? "30%"
                            : strength === 2
                              ? "60%"
                              : strength === 3
                                ? "100%"
                                : "0%",
                      backgroundColor:
                        password.length === 0
                          ? "transparent"
                          : strength === 1
                            ? "#EF4444"
                            : strength === 2
                              ? "#F59E0B"
                              : strength === 3
                                ? "#10B981"
                                : "transparent",
                    }}
                  ></div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start pt-2">
                <label className={`flex items-center cursor-pointer group/checkbox ${shakeTerms ? 'animate-shake' : ''}`}>
                  <input type="checkbox" ref={checkboxRef} className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:bg-black peer-checked:border-black transition-all relative flex-shrink-0">
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
                  <span className="ml-3 text-sm text-gray-500 leading-tight">
                    {isEn ? (
                      <>
                        I agree to WeiMeng&apos;s{" "}
                        <a href="#" className="text-black hover:underline">
                          {text.termsOfService}
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-black hover:underline">
                          {text.privacyPolicy}
                        </a>
                      </>
                    ) : (
                      <>
                        我同意 WeiMeng 的{" "}
                        <a href="#" className="text-black hover:underline">
                          {text.termsOfService}
                        </a>{" "}
                        和{" "}
                        <a href="#" className="text-black hover:underline">
                          {text.privacyPolicy}
                        </a>
                      </>
                    )}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-black text-white rounded-xl font-medium text-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="flex h-4 items-end gap-1.5">
                    <div className="w-2 h-2 bg-white rounded-full [animation:signup-submit-wave_0.75s_ease-in-out_infinite]"></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full [animation:signup-submit-wave_0.75s_ease-in-out_infinite]"
                      style={{ animationDelay: "0.12s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full [animation:signup-submit-wave_0.75s_ease-in-out_infinite]"
                      style={{ animationDelay: "0.24s" }}
                    ></div>
                  </div>
                ) : (
                  text.submit
                )}
              </button>
            </form>

            {/* Bottom Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-500">
                {text.haveAccount}{" "}
                <Link
                  href={withLocalePath("/auth/login")}
                  className="text-black font-bold hover:underline"
                >
                  {text.loginNow}
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
      <div className="hidden lg:flex w-[60%] h-full bg-[#1a1a1a] relative overflow-hidden items-center justify-center">
        {/* Darker Theme for variety */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>

        {/* Abstract Art */}
        <div className="relative w-[500px] h-[500px] animate-float">
          {/* Glowing Orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse-slow"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse-slow"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Geometric Shape (CSS Only) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border border-white/20 backdrop-blur-md rounded-2xl transform rotate-45 shadow-2xl flex items-center justify-center">
              <div className="w-48 h-48 border border-white/10 rounded-full bg-white/5"></div>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="absolute bottom-12 right-12 text-right">
          <p className="font-serif italic text-2xl text-white opacity-50">
            {`"${text.quote}"`}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes signup-wave {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.55;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @keyframes signup-submit-wave {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.55;
          }
          30% {
            transform: translateY(-7px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
