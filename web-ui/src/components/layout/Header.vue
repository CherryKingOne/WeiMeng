<script setup>
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const toggleLang = () => {
  const next = locale.value === 'en' ? 'zh' : 'en'
  locale.value = next
  if (typeof localStorage !== 'undefined') localStorage.setItem('locale', next)
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
    <div class="container mx-auto px-6 py-2 flex justify-between items-center">
      <span class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
        <img src="@/assets/logo.png" alt="WeiMeng Logo" class="w-12 h-12 mr-3 rounded-lg" />
        WeiMeng
      </span>
      <nav class="hidden md:flex items-center space-x-8">
        <a href="#features" class="text-secondary hover:text-primary transition">{{ t('header.features') }}</a>
        <a href="#integrations" class="text-secondary hover:text-primary transition">{{ t('header.integrations') }}</a>
        <a href="#governance" class="text-secondary hover:text-primary transition">{{ t('header.governance') }}</a>
        <a href="#" class="text-secondary hover:text-primary transition">{{ t('header.pricing') }}</a>
      </nav>
      <div class="flex items-center space-x-4">
        <button @click="toggleLang" class="text-secondary hover:text-primary transition">
          {{ locale === 'en' ? t('header.lang_zh') : t('header.lang_en') }}
        </button>
        <router-link to="/login" class="text-secondary hover:text-primary transition">{{ t('header.login') }}</router-link>
        <router-link to="/login" class="bg-brand-green text-white font-semibold px-4 py-1.5 rounded-lg">{{ t('header.start') }}</router-link>
      </div>
    </div>
  </header>
</template>