<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section class="relative bg-brand-dark text-white overflow-hidden">
    <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
    <div class="absolute inset-0 bg-gradient-to-b from-brand-dark/50 via-brand-dark/80 to-brand-dark"></div>
    
    <div class="container mx-auto px-6 py-32 relative z-10 text-center">
      <div class="inline-block mb-6 px-4 py-1.5 rounded-full bg-brand-green/20 border border-brand-green/30 text-brand-green font-semibold text-sm tracking-wide uppercase">
        {{ t('hero.get_started') }}
      </div>
      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8">
        {{ t('hero.title') }}
      </h1>
      <p class="mt-6 text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
        {{ t('hero.desc') }}
      </p>
      <div class="mt-12 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <a href="#" class="w-full sm:w-auto bg-brand-green hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg shadow-brand-green/25">
          {{ t('hero.get_started') }}
        </a>
        <a href="#" class="w-full sm:w-auto flex items-center justify-center text-white font-semibold hover:text-brand-green transition px-8 py-4">
          <fa :icon="['fas','play-circle']" class="mr-2 text-2xl" />
          {{ t('hero.demo') }}
        </a>
      </div>
    </div>
  </section>
</template>