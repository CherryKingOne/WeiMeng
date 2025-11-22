<script setup>
import { ref, onMounted, watch } from 'vue'
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

const onLoginSubmit = () => {
  loginError.value = ''
  loginInvalid.value = false
  if (!rememberPassword.value) {
    agreementShake.value = true
    setTimeout(() => {
      agreementShake.value = false
    }, 400)
    return
  }
  const email = loginEmail.value.trim()
  const password = loginPassword.value
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.trim().length > 0
  if (valid) {
    try {
      localStorage.setItem('loggedIn', 'true')
      localStorage.setItem('userEmail', email)
    } catch {}
    router.push('/workspace')
  } else {
    loginError.value = t('auth.invalid')
    loginInvalid.value = true
  }
}

const terms = ref(false)
const sending = ref(false)
const resendSeconds = ref(0)
const sendCode = async () => {
  if (sending.value) return
  sending.value = true
  await new Promise(r => setTimeout(r, 1000))
  resendSeconds.value = 60
  const timer = setInterval(() => {
    resendSeconds.value--
    if (resendSeconds.value <= 0) {
      clearInterval(timer)
      sending.value = false
    }
  }, 1000)
}
</script>

<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-5">
    <div class="lg:col-span-2 bg-dark-cta relative flex flex-col justify-center items-center p-12 text-white text-center order-last lg:order-first min-h-[300px] lg:min-h-screen">
      <div class="absolute inset-0 bg-cover bg-center opacity-20" style="background-image: url('https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?q=80&w=2400&auto=format&fit=crop');"></div>
      <div class="relative z-10">
        <router-link to="/" class="text-3xl font-bold text-white flex items-center justify-center mb-8">
          <i class="fas fa-cubes text-brand-green mr-3"></i>
          OneFour
        </router-link>
        <h1 class="text-4xl font-bold leading-tight">{{ t('hero.title') }}</h1>
        <p class="mt-4 text-gray-300 max-w-sm mx-auto">{{ t('hero.desc') }}</p>
      </div>
    </div>

    <div class="lg:col-span-3 bg-white flex flex-col justify-center items-center p-6 sm:p-12">
      <div class="w-full max-w-md">
        <router-link to="/" class="text-2xl font-bold text-primary flex items-center mb-8 lg:hidden">
          <i class="fas fa-cubes text-brand-green mr-2"></i>
          OneFour
        </router-link>

        <div class="relative flex border-b mb-8">
          <button ref="loginTabEl" @click="switchTab('login')" class="flex-1 pb-3 text-2xl font-bold transition-colors" :class="tab==='login' ? 'text-brand-green' : 'text-secondary'">{{ t('auth.login') }}</button>
          <button ref="signupTabEl" @click="switchTab('signup')" class="flex-1 pb-3 text-2xl font-bold transition-colors" :class="tab==='signup' ? 'text-brand-green' : 'text-secondary'">{{ t('auth.signup') }}</button>
          <div class="absolute bottom-[-2px] left-0 h-[3px] bg-brand-green" :style="{ width: indicatorWidth+'px', transform: `translateX(${indicatorX}px)` }"></div>
        </div>

        <div>
          <p class="text-center text-sm text-secondary mb-4">{{ t('auth.social') }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="#" class="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google" class="w-5 h-5 mr-3">
              <span class="font-semibold text-primary text-sm">Google</span>
            </a>
            <a href="#" class="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <i class="fab fa-github text-xl mr-3"></i>
              <span class="font-semibold text-primary text-sm">GitHub</span>
            </a>
          </div>
        </div>

        <div class="flex items-center my-8">
          <hr class="flex-grow border-gray-200">
          <span class="mx-4 text-sm text-secondary">{{ t('auth.email') }}</span>
          <hr class="flex-grow border-gray-200">
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

        <form v-else class="space-y-6">
          <div>
            <label for="signup-email" class="font-medium text-primary block mb-2">{{ t('auth.email_label') }}</label>
            <div class="relative">
              <fa :icon="['fas','envelope']" class="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
              <input type="email" id="signup-email" :placeholder="t('auth.email_placeholder')" class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-brand-green focus:border-transparent">
            </div>
          </div>
          <div>
            <label for="verification-code" class="font-medium text-primary block mb-2">{{ t('auth.code') }}</label>
            <div class="flex space-x-3">
              <input type="text" id="verification-code" :placeholder="t('auth.code_placeholder')" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-brand-green focus:border-transparent">
              <button type="button" class="flex-shrink-0 bg-light-gray text-brand-green font-semibold px-4 py-3 rounded-lg hover:bg-gray-200 transition" :disabled="sending || resendSeconds>0" @click="sendCode">{{ sending ? t('auth.sending') : (resendSeconds>0 ? `${resendSeconds}`+t('auth.seconds') : t('auth.get_code')) }}</button>
            </div>
          </div>
          <div>
            <label for="signup-password" class="font-medium text-primary block mb-2">{{ t('auth.create_password') }}</label>
            <div class="relative">
              <fa :icon="['fas','lock']" class="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
              <input :type="showSignupPassword ? 'text' : 'password'" id="signup-password" :placeholder="t('auth.password_rule')" class="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-brand-green focus:border-transparent">
              <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary" @click="togglePassword('signup-password')"><fa :icon="['fas', showSignupPassword ? 'eye-slash' : 'eye']" /></button>
            </div>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="terms" v-model="terms" class="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green">
            <label for="terms" class="ml-2 text-sm text-secondary">{{ t('auth.agree') }} <a href="#" class="text-brand-green hover:underline">{{ t('footer.terms') }}</a> {{ t('auth.and') }} <a href="#" class="text-brand-green hover:underline">{{ t('footer.privacy') }}</a></label>
          </div>
          <button type="submit" class="w-full bg-brand-green text-white font-bold py-4 rounded-lg hover:bg-brand-green-dark" :class="!terms ? 'opacity-50 cursor-not-allowed' : ''" :disabled="!terms">{{ t('auth.create_account') }}</button>
          <p class="text-center text-sm text-secondary">
            {{ t('auth.have_account') }} <button type="button" class="font-semibold text-brand-green hover:underline" @click="switchTab('login')">{{ t('auth.login_now') }}</button>
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
