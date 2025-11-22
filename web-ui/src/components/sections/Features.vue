<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section id="features" class="bg-light-gray py-20">
    <div class="container mx-auto px-6">
      <div class="text-center mb-12">
        <span class="text-brand-green font-semibold">{{ t('features.label') }}</span>
        <h2 class="text-4xl font-bold text-primary mt-2">{{ t('features.title') }}</h2>
        <p class="mt-4 text-secondary max-w-2xl mx-auto">
          {{ t('features.intro') }}
        </p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-green/10 mb-5">
            <fa :icon="['fas','search']" class="text-brand-green text-xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-2">{{ t('features.cards.search_title') }}</h3>
          <p class="text-secondary">{{ t('features.cards.search_desc') }}</p>
        </div>
        <div class="bg-white p-8 rounded-xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-green/10 mb-5">
            <fa :icon="['fas','robot']" class="text-brand-green text-xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-2">{{ t('features.cards.ai_title') }}</h3>
          <p class="text-secondary">{{ t('features.cards.ai_desc') }}</p>
        </div>
        <div class="bg-white p-8 rounded-xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-green/10 mb-5">
            <fa :icon="['fas','layer-group']" class="text-brand-green text-xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-2">{{ t('features.cards.gov_title') }}</h3>
          <p class="text-secondary">{{ t('features.cards.gov_desc') }}</p>
        </div>
        <div class="bg-white p-8 rounded-xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-green/10 mb-5">
            <fa :icon="['fas','users']" class="text-brand-green text-xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-2">{{ t('features.cards.collab_title') }}</h3>
          <p class="text-secondary">{{ t('features.cards.collab_desc') }}</p>
        </div>
        <div class="bg-white p-8 rounded-xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-green/10 mb-5">
            <fa :icon="['fas','history']" class="text-brand-green text-xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-2">{{ t('features.cards.history_title') }}</h3>
          <p class="text-secondary">{{ t('features.cards.history_desc') }}</p>
        </div>
        <div class="bg-white p-8 rounded-xl shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div class="flex items-center justify-center h-12 w-12 rounded-full bg-brand-green/10 mb-5">
            <fa :icon="['fas','code']" class="text-brand-green text-xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-2">{{ t('features.cards.handoff_title') }}</h3>
          <p class="text-secondary">{{ t('features.cards.handoff_desc') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>