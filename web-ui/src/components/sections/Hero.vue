<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section class="container mx-auto px-6 py-24 text-center">
    <h1 class="text-5xl md:text-6xl font-extrabold text-primary leading-tight">
      {{ t('hero.title') }}
    </h1>
    <p class="mt-6 text-lg max-w-3xl mx-auto text-secondary">
      {{ t('hero.desc') }}
    </p>
    <div class="mt-10 flex justify-center items-center space-x-4">
      <a href="#" class="bg-brand-green text-white font-bold px-8 py-4 rounded-lg text-lg">{{ t('hero.get_started') }}</a>
      <a href="#" class="text-secondary font-semibold hover:text-primary transition">
        {{ t('hero.demo') }} <fa :icon="['fas','arrow-right']" class="ml-1" />
      </a>
    </div>
  </section>
</template>