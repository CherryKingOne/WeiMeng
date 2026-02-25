"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
 const [countdown, setCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // New state for reset form
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'error' || (type === 'success' && !text.includes('登录'))) {
       setTimeout(() => setMessage(null), 3000);
    }
  };

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLengthValid = newPassword.length >= 8;
  const isComplexityValid = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMatchValid = newPassword === confirmPassword && newPassword !== "";

  const handleFinalReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLengthValid || !isComplexityValid || !isMatchValid) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5607/api/v1/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          captcha: code,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', "密码重置成功，即将跳转登录页...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        showMessage('error', data.detail || "密码重置失败，请重试");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      showMessage('error', "网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5607/api/v1/captcha/email/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFlipped(true);
        setCountdown(60);
        setMessage(null); // Clear any previous error
      } else {
        showMessage('error', data.detail || "验证码发送失败，请重试");
      }
    } catch (error) {
      console.error("Send captcha error:", error);
      showMessage('error', "网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFlipped && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isFlipped, countdown]);

  const handleResend = async () => {
    if (countdown > 0 || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5607/api/v1/captcha/email/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setCountdown(60);
        showMessage('success', "验证码已重新发送");
      } else {
        showMessage('error', data.detail || "验证码发送失败，请重试");
      }
    } catch (error) {
      console.error("Resend captcha error:", error);
      showMessage('error', "网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden h-screen w-screen flex">
      {/* Left: Interaction Area (40%) */}
      <div className="w-full lg:w-[40%] h-full bg-white flex flex-col relative z-10">
        {/* Logo */}
        <div className="pt-2 pl-10">
          <Link href="/login">
            <img
              src="/logo/logo-light-transparent.png"
              alt="Logo"
              className="h-40 w-auto max-w-[80%] object-contain object-left"
            />
          </Link>
        </div>

        {/* Content Container with Flip Effect */}
        <div
          className="flex-1 flex items-start justify-center px-10 pt-10"
          style={{ perspective: "1000px" }}
        >
          <div
            className="w-full max-w-[420px] relative h-[400px]"
            style={{
              transition: "transform 0.6s",
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front: Input Form */}
            <div
              className="flex flex-col justify-center h-full bg-white absolute inset-0"
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* Message Toast */}
              {message && !isFlipped && (
                <div className={`absolute top-0 left-0 right-0 -mt-16 p-3 text-sm rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.type === 'success' ? (
                     <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                     <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  )}
                  {message.text}
                </div>
              )}

              {/* Icon */}
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-7 h-7 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-[32px] font-bold text-gray-900 mb-2">
                  忘记密码？
                </h1>
                <p className="text-[#9CA3AF]">
                  别担心，我们会发送验证码到您的邮箱。
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-1">
                  <div className="group relative transition-all duration-200 rounded-xl focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)]">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-black text-white rounded-xl font-medium text-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>发送中...</span>
                    </>
                  ) : (
                    "发送验证码"
                  )}
                </button>
              </form>

              {/* Back Link */}
              <div className="mt-8 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-black flex items-center justify-center gap-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  返回登录
                </Link>
              </div>
            </div>

            {/* Back: Reset Password Form */}
            <div
              className="flex flex-col justify-start h-full bg-white absolute inset-0 px-10 pt-10"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {/* Message Toast */}
              {message && isFlipped && (
                <div className={`absolute top-0 left-0 right-0 -mt-16 p-3 text-sm rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 z-50 ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.type === 'success' ? (
                     <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                     <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  )}
                  {message.text}
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-[32px] font-bold text-gray-900 mb-2">设置新密码</h1>
                <p className="text-[#9CA3AF]">
                  验证码已发送到{" "}
                  <span className="text-black font-medium">{email}</span>{" "}
                  中了
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleFinalReset} className="space-y-4">
                 {/* Verification Code */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">验证码</label>
                  <div className="relative rounded-xl focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)] transition-all duration-200">
                    <input
                      type="text"
                      required
                      placeholder="输入验证码"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-12 bg-[#F9FAFB] rounded-xl px-4 border-2 border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 focus:border-black"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">新密码</label>
                  <div className="relative rounded-xl focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)] transition-all duration-200">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="输入新密码"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-12 bg-[#F9FAFB] rounded-xl px-4 pr-12 border-2 border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">确认新密码</label>
                  <div className={`relative rounded-xl focus-within:shadow-[0_0_0_4px_rgba(243,244,246,1)] transition-all duration-200 ${confirmPassword && !isMatchValid ? 'focus-within:!shadow-[0_0_0_4px_rgba(239,68,68,0.2)]' : ''}`}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="确认新密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full h-12 bg-[#F9FAFB] rounded-xl px-4 pr-12 border-2 outline-none transition-all placeholder-gray-400 text-gray-900 focus:border-black ${confirmPassword ? (isMatchValid ? 'border-green-500' : 'border-red-500') : 'border-transparent'}`}
                    />
                     <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                
                 {/* Validation Checklist */}
                <div className="space-y-2 pt-1">
                    <div className={`flex items-center gap-2 text-xs ${isLengthValid ? 'text-black' : 'text-gray-400'}`}>
                        <div className={`w-3 h-3 border rounded-full flex items-center justify-center transition-all ${isLengthValid ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            <svg className={`w-2 h-2 text-white ${isLengthValid ? '' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span>至少 8 个字符</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${isComplexityValid ? 'text-black' : 'text-gray-400'}`}>
                         <div className={`w-3 h-3 border rounded-full flex items-center justify-center transition-all ${isComplexityValid ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            <svg className={`w-2 h-2 text-white ${isComplexityValid ? '' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span>包含数字或符号</span>
                    </div>
                     <div className={`flex items-center gap-2 text-xs ${isMatchValid ? 'text-black' : 'text-gray-400'}`}>
                         <div className={`w-3 h-3 border rounded-full flex items-center justify-center transition-all ${isMatchValid ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            <svg className={`w-2 h-2 text-white ${isMatchValid ? '' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span>两次输入一致</span>
                    </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-black text-white rounded-xl font-medium text-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 mt-4 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>处理中...</span>
                    </>
                  ) : (
                    "重置密码"
                  )}
                </button>
              </form>
              
               {/* Actions */}
              <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    没收到验证码？{" "}
                    <span
                      onClick={handleResend}
                      className={`transition-colors ${countdown > 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-black cursor-pointer font-medium"
                        }`}
                    >
                      {countdown > 0 ? `重新发送 (${countdown}s)` : "重新发送"}
                    </span>
                  </p>
              </div>

              {/* Back Link */}
              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-black flex items-center justify-center gap-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  返回登录
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 w-full text-center">
          <p className="text-xs text-gray-400">© WeiMeng Inc.</p>
        </div>
      </div>

      {/* Right: Visual Showcase (60%) */}
      <div className="hidden lg:flex w-[60%] h-full bg-[#eef2ff] relative overflow-hidden items-center justify-center">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50"></div>

        {/* Abstract Art */}
        <div className="relative w-96 h-96 animate-float">
          {/* Glass Morphism Card */}
          <div className="absolute inset-0 bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl flex items-center justify-center transform rotate-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-300 to-purple-400 opacity-80 blur-2xl"></div>
          </div>
          <div className="absolute inset-0 bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl flex items-center justify-center transform -rotate-6 scale-90 -z-10"></div>
        </div>

        {/* Quote */}
        <div className="absolute bottom-12 right-12 text-right">
          <p className="font-serif italic text-2xl text-indigo-900 opacity-40">
            &quot;Simplicity is the ultimate sophistication.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
