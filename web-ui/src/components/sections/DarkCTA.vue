<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section class="bg-dark-cta">
    <div class="container mx-auto px-6 py-20 text-center">
      <h2 class="text-4xl font-bold text-white">{{ t('cta.title') }}</h2>
      <p class="mt-4 text-lg max-w-2xl mx-auto text-gray-400">{{ t('cta.desc') }}</p>
      <div class="mt-8">
        <a href="#" class="bg-brand-green text-white font-bold px-8 py-4 rounded-lg text-lg">{{ t('cta.signup') }}</a>
      </div>
    </div>
  </section>
</template>