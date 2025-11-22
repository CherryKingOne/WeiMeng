<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section class="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
    <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptMC00YzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
    <div class="container mx-auto px-6 relative">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ t('cta.title') }}</h2>
        <p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">{{ t('cta.desc') }}</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/login" class="inline-flex items-center justify-center px-8 py-4 bg-brand-green hover:bg-brand-green/90 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-brand-green/25 hover:shadow-xl hover:shadow-brand-green/40">
            {{ t('cta.signup') }}
            <fa :icon="['fas','arrow-right']" class="ml-2" />
          </a>
          <a href="#features" class="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg transition-all backdrop-blur-sm border border-white/20">
            {{ t('cta.learn_more') }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>