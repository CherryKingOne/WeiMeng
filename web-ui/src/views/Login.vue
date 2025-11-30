<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const tab = ref('login')
const indicatorWidth = ref(0)
const indicatorX = ref(0)
const loginTabEl = ref(null)
const signupTabEl = ref(null)
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginInvalid = ref(false)
const rememberPassword = ref(false)
const showLoginPassword = ref(false)
const showSignupPassword = ref(false)
const agreementShake = ref(false)
const signupEmail = ref('')
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7767'
const signupCode = ref('')
const signupPassword = ref('')
const registering = ref(false)
const signupError = ref('')
const toastOpen = ref(false)
const toastText = ref('')
const toastType = ref('success')
let toastTimer = null
const openToast = (text, type = 'success') => {
  toastText.value = text
  toastType.value = type
  toastOpen.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastOpen.value = false }, 2000)
}

const tr = (key, fallback) => {
  const s = t(key)
  return s && s !== key ? s : fallback
}
const createAccountText = computed(() => tr('auth.create_account', 'Create Account'))
const haveAccountText = computed(() => tr('auth.have_account', 'Already have an account?'))
const loginNowText = computed(() => tr('auth.login_now', 'Log in now'))

const updateIndicator = () => {
  const el = tab.value === 'login' ? loginTabEl.value : signupTabEl.value
  if (!el) return
  indicatorWidth.value = el.offsetWidth
  indicatorX.value = el.offsetLeft
}

onMounted(() => {
  const q = route.query.tab
  if (q === 'signup') tab.value = 'signup'
  updateIndicator()
  window.addEventListener('resize', updateIndicator)
})

watch(tab, () => updateIndicator())

const switchTab = (name) => {
  tab.value = name
  router.replace({ query: { tab: name } })
}

const togglePassword = (id) => {
  if (id === 'login-password') {
    showLoginPassword.value = !showLoginPassword.value
  } else if (id === 'signup-password') {
    showSignupPassword.value = !showSignupPassword.value
  }
}

const onLoginSubmit = async () => {
  loginError.value = ''
  loginInvalid.value = false
  if (!rememberPassword.value) {
    agreementShake.value = true
    setTimeout(() => { agreementShake.value = false }, 400)
    return
  }
  const email = loginEmail.value.trim()
  const password = loginPassword.value
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.trim().length > 0
  if (!valid) {
    loginError.value = t('auth.invalid')
    loginInvalid.value = true
    return
  }
  try {
    console.log('[登录] 开始登录:', { email, passwordLength: password.length })
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    console.log('[登录] 响应状态:', res.status)

    if (!res.ok) {
      let msg = t('auth.invalid')
      try {
        const data = await res.json()
        console.error('[登录] 错误响应:', data)
        msg = data?.detail || data?.message || msg
      } catch (e) {
        console.error('[登录] 解析错误响应失败:', e)
      }
      loginError.value = msg
      loginInvalid.value = true
      openToast(msg, 'error')
      return
    }
    const data = await res.json()
    console.log('[登录] 登录成功:', { hasToken: !!data?.access_token, userId: data?.user_id })

    try {
      localStorage.setItem('loggedIn', 'true')
      localStorage.setItem('userEmail', email)
      if (data?.access_token) localStorage.setItem('accessToken', data.access_token)
      if (data?.user_id) localStorage.setItem('userId', data.user_id)
    } catch (e) {
      console.error('[登录] 保存到 localStorage 失败:', e)
    }
    openToast(t('auth.login_success'), 'success')
    router.push('/workspace')
  } catch (e) {
    console.error('[登录] 异常:', e)
    loginError.value = t('auth.invalid')
    loginInvalid.value = true
    openToast(t('auth.invalid'), 'error')
  }
}

const onSignupSubmit = async () => {
  signupError.value = ''
  if (!terms.value || registering.value) return

  const email = signupEmail.value.trim()
  const codeStr = signupCode.value.trim()
  const password = signupPassword.value

  // 验证邮箱格式
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailValid) {
    signupError.value = t('auth.email_invalid')
    openToast(t('auth.email_invalid'), 'error')
    return
  }

  // 验证验证码格式
  const codeValid = /^\d{6}$/.test(codeStr)
  if (!codeValid) {
    signupError.value = t('auth.code_invalid')
    openToast(t('auth.code_invalid'), 'error')
    return
  }

  // 验证密码长度
  const passValid = password && password.length >= 8
  if (!passValid) {
    signupError.value = t('auth.password_rule')
    openToast(t('auth.password_rule'), 'error')
    return
  }

  registering.value = true

  try {
    const requestBody = { email, password, code: codeStr }
    console.log('[注册] 开始注册:', { email, codeLength: codeStr.length, passwordLength: password.length })
    console.log('[注册] 请求体:', JSON.stringify(requestBody, null, 2))

    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('[注册] 响应状态:', res.status)

    if (!res.ok) {
      let msg = t('auth.signup_failed')
      try {
        const data = await res.json()
        console.error('[注册] 错误响应:', data)
        msg = data?.detail || data?.message || msg

        // 处理常见的错误情况
        if (res.status === 400) {
          if (data?.detail?.includes('code') || data?.detail?.includes('验证码')) {
            msg = '验证码错误或已过期'
          } else if (data?.detail?.includes('email') || data?.detail?.includes('邮箱')) {
            msg = '邮箱格式不正确或已被注册'
          } else if (data?.detail?.includes('password') || data?.detail?.includes('密码')) {
            msg = '密码格式不符合要求'
          }
        }
      } catch (e) {
        console.error('[注册] 解析错误响应失败:', e)
      }
      signupError.value = msg
      openToast(msg, 'error')
      return
    }

    const data = await res.json().catch(() => null)
    console.log('[注册] 注册成功:', data)

    openToast(t('auth.signup_success'), 'success')

    // 切换到登录标签并预填邮箱
    switchTab('login')
    loginEmail.value = email

    // 清空注册表单
    signupEmail.value = ''
    signupCode.value = ''
    signupPassword.value = ''

  } catch (e) {
    console.error('[注册] 异常:', e)
    signupError.value = t('auth.signup_failed')
    openToast(t('auth.signup_failed'), 'error')
  } finally {
    registering.value = false
  }
}

const terms = ref(false)
const sending = ref(false)
const resendSeconds = ref(0)
const sendCode = async () => {
  if (sending.value || resendSeconds.value > 0) return
  const email = signupEmail.value.trim()
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!valid) {
    openToast(t('auth.email_invalid'), 'error')
    return
  }
  sending.value = true

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

  try {
    console.log('[发送验证码] 开始发送到:', email)
    const res = await fetch(`${API_BASE}/api/v1/auth/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    console.log('[发送验证码] 响应状态:', res.status)

    if (!res.ok) {
      let errorMsg = t('auth.send_code_failed')
      try {
        const errorData = await res.json()
        errorMsg = errorData?.detail || errorData?.message || errorMsg
      } catch {}
      throw new Error(errorMsg)
    }

    // 成功发送
    openToast(t('auth.code_sent') || '验证码已发送', 'success')
    resendSeconds.value = 60
    const timer = setInterval(() => {
      resendSeconds.value--
      if (resendSeconds.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (e) {
    clearTimeout(timeoutId)
    console.error('[发送验证码] 错误:', e)

    let errorMessage = t('auth.send_code_failed')
    if (e.name === 'AbortError') {
      errorMessage = '请求超时,请检查网络连接'
    } else if (e.message) {
      errorMessage = e.message
    }

    openToast(errorMessage, 'error')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-5">
    <div class="lg:col-span-2 bg-gradient-to-br from-brand-dark via-brand-green to-brand-blue relative flex flex-col justify-center items-center p-12 text-white text-center order-last lg:order-first h-[300px] lg:h-screen overflow-hidden">
      <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2400&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-brand-dark/80 to-transparent"></div>
      <div class="relative z-10">
        <router-link to="/" class="text-3xl font-bold text-white flex items-center justify-center mb-8 hover:scale-105 transition-transform">
          <img src="@/assets/logo.png" :alt="t('brand.name') + ' Logo'" class="h-16 mr-4" />
          {{ t('brand.name') }}
        </router-link>
        <h2 class="mt-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-accent drop-shadow-lg">{{ t('brand.name') }}</h2>
        <p class="mt-4 text-gray-100 max-w-sm mx-auto text-lg font-light tracking-wide">{{ t('hero.desc') }}</p>
      </div>
    </div>

    <div class="lg:col-span-3 bg-white relative flex flex-col justify-center items-center p-6 sm:p-12">
      <div v-if="toastOpen" class="absolute top-4 right-6 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl shadow-lg"
           :class="toastType==='success' ? 'bg-brand-green text-white' : 'bg-red-500 text-white'">
        <fa :icon="['fas', toastType==='success' ? 'check' : 'xmark']" class="text-white" />
        <span class="text-sm font-semibold">{{ toastText }}</span>
      </div>
      <div class="w-full max-w-md">
        <router-link to="/" class="text-2xl font-bold text-primary flex items-center mb-8 lg:hidden">
          <img src="@/assets/logo.png" :alt="t('brand.name') + ' Logo'" class="h-10 mr-4" />
          {{ t('brand.name') }}
        </router-link>

        <div class="relative flex border-b mb-8">
          <button ref="loginTabEl" @click="switchTab('login')" class="flex-1 pb-3 text-2xl font-bold transition-colors" :class="tab==='login' ? 'text-brand-green' : 'text-secondary'">{{ t('auth.login') }}</button>
          <button ref="signupTabEl" @click="switchTab('signup')" class="flex-1 pb-3 text-2xl font-bold transition-colors" :class="tab==='signup' ? 'text-brand-green' : 'text-secondary'">{{ t('auth.signup') }}</button>
          <div class="absolute bottom-[-2px] left-0 h-[3px] bg-brand-green" :style="{ width: indicatorWidth+'px', transform: `translateX(${indicatorX}px)` }"></div>
        </div>

        <form v-if="tab==='login'" class="space-y-6" @submit.prevent="onLoginSubmit">
          <div>
            <label for="login-email" class="font-medium text-primary block mb-2">{{ t('auth.email_label') }}</label>
            <div class="relative">
              <fa :icon="['fas','envelope']" class="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="email"
                id="login-email"
                v-model="loginEmail"
                :placeholder="t('auth.email_placeholder')"
                autocomplete="email"
                autocapitalize="off"
                spellcheck="false"
                autofocus
                class="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-brand-green focus:border-transparent"
                :class="loginInvalid ? 'border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500' : ''"
              >
              <button
                v-if="loginEmail"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                @click="loginEmail=''; loginInvalid=false; loginError=''"
                aria-label="清空邮箱"
              >
                <fa :icon="['fas','xmark']" />
              </button>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label for="login-password" class="font-medium text-primary">{{ t('auth.password') }}</label>
              <a href="#" class="text-sm text-brand-green hover:underline">{{ t('auth.forgot') }}</a>
            </div>
            <div class="relative">
              <fa :icon="['fas','lock']" class="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
              <input :type="showLoginPassword ? 'text' : 'password'" id="login-password" v-model="loginPassword" :placeholder="t('auth.password_placeholder')" class="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-brand-green focus:border-transparent" :class="loginInvalid ? 'border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500' : ''">
              <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary" @click="togglePassword('login-password')">
                <fa :icon="['fas', showLoginPassword ? 'eye-slash' : 'eye']" />
              </button>
        </div>
      </div>
      <p v-if="loginError" class="text-red-500 text-sm text-center">{{ loginError }}</p>
      <div class="flex items-center my-2" :class="agreementShake ? 'shake' : ''">
        <input type="checkbox" id="remember-password" v-model="rememberPassword" class="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green">
        <label for="remember-password" class="ml-2 text-sm text-secondary">{{ t('auth.agree') }} <a href="#" class="text-brand-green hover:underline">{{ t('footer.terms') }}</a> {{ t('auth.and') }} <a href="#" class="text-brand-green hover:underline">{{ t('footer.privacy') }}</a></label>
      </div>
      <button type="submit" class="w-full bg-brand-green text-white font-bold py-4 rounded-lg hover:bg-brand-green-dark">{{ t('auth.login_btn') }}</button>
          
          <p class="text-center text-sm text-secondary">
            {{ t('auth.no_account') }} <button type="button" class="font-semibold text-brand-green hover:underline" @click="switchTab('signup')">{{ t('auth.signup_now') }}</button>
          </p>
        </form>

        <form v-else class="space-y-6" @submit.prevent="onSignupSubmit">
          <div>
            <label for="signup-email" class="font-medium text-primary block mb-2">{{ t('auth.email_label') }}</label>
            <div class="relative">
              <fa :icon="['fas','envelope']" class="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
              <input v-model="signupEmail" type="email" id="signup-email" :placeholder="t('auth.email_placeholder')" class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-brand-green focus:border-transparent">
            </div>
          </div>
          <div>
            <label for="verification-code" class="font-medium text-primary block mb-2">{{ t('auth.code') }}</label>
            <div class="flex space-x-3">
              <input v-model="signupCode" type="text" id="verification-code" :placeholder="t('auth.code_placeholder')" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-brand-green focus:border-transparent">
              <button type="button" class="flex-shrink-0 bg-light-gray text-brand-green font-semibold px-4 py-3 rounded-lg hover:bg-gray-200 transition" :disabled="sending || resendSeconds>0" @click="sendCode">{{ sending ? t('auth.sending') : (resendSeconds>0 ? `${resendSeconds}`+t('auth.seconds') : t('auth.get_code')) }}</button>
            </div>
          </div>
          <div>
            <label for="signup-password" class="font-medium text-primary block mb-2">{{ t('auth.create_password') }}</label>
            <div class="relative">
              <fa :icon="['fas','lock']" class="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
              <input v-model="signupPassword" :type="showSignupPassword ? 'text' : 'password'" id="signup-password" :placeholder="t('auth.password_rule')" class="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-brand-green focus:border-transparent">
              <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary" @click="togglePassword('signup-password')"><fa :icon="['fas', showSignupPassword ? 'eye-slash' : 'eye']" /></button>
            </div>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="terms" v-model="terms" class="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green">
            <label for="terms" class="ml-2 text-sm text-secondary">{{ t('auth.agree') }} <a href="#" class="text-brand-green hover:underline">{{ t('footer.terms') }}</a> {{ t('auth.and') }} <a href="#" class="text-brand-green hover:underline">{{ t('footer.privacy') }}</a></label>
          </div>
          <p v-if="signupError" class="text-red-500 text-sm text-center">{{ signupError }}</p>
          <button type="submit" class="w-full bg-brand-green text-white font-bold py-4 rounded-lg hover:bg-brand-green-dark" :class="(!terms || registering) ? 'opacity-50 cursor-not-allowed' : ''" :disabled="!terms || registering">{{ createAccountText }}</button>
          <p class="text-center text-sm text-secondary">
            {{ haveAccountText }} <button type="button" class="font-semibold text-brand-green hover:underline" @click="switchTab('login')">{{ loginNowText }}</button>
          </p>
        </form>
  </div>
</div>
</div>
</template>

<style scoped>
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-6px); }
  100% { transform: translateX(0); }
}
.shake { animation: shake 0.3s ease; }
</style>
