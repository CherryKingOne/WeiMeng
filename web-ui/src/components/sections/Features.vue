<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section id="features" class="bg-light-gray py-24">
    <div class="container mx-auto px-6">
      <div class="text-center mb-16">
        <span class="text-brand-green font-bold tracking-wider uppercase text-sm">{{ t('features.label') }}</span>
        <h2 class="text-4xl md:text-5xl font-extrabold text-primary mt-3">{{ t('features.title') }}</h2>
        <p class="mt-6 text-xl text-secondary max-w-3xl mx-auto">
          {{ t('features.intro') }}
        </p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Script -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl group">
          <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-50 group-hover:bg-brand-green/10 transition-colors mb-6">
            <fa :icon="['fas','pen-nib']" class="text-brand-green text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-3">{{ t('features.cards.search_title') }}</h3>
          <p class="text-secondary leading-relaxed">{{ t('features.cards.search_desc') }}</p>
        </div>
        <!-- Character -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl group">
          <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-purple-50 group-hover:bg-brand-green/10 transition-colors mb-6">
            <fa :icon="['fas','user-astronaut']" class="text-brand-green text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-3">{{ t('features.cards.ai_title') }}</h3>
          <p class="text-secondary leading-relaxed">{{ t('features.cards.ai_desc') }}</p>
        </div>
        <!-- TTS -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl group">
          <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-pink-50 group-hover:bg-brand-green/10 transition-colors mb-6">
            <fa :icon="['fas','microphone-lines']" class="text-brand-green text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-3">{{ t('features.cards.gov_title') }}</h3>
          <p class="text-secondary leading-relaxed">{{ t('features.cards.gov_desc') }}</p>
        </div>
        <!-- Storyboard -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl group">
          <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-indigo-50 group-hover:bg-brand-green/10 transition-colors mb-6">
            <fa :icon="['fas','images']" class="text-brand-green text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-3">{{ t('features.cards.collab_title') }}</h3>
          <p class="text-secondary leading-relaxed">{{ t('features.cards.collab_desc') }}</p>
        </div>
        <!-- Video Generation -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl group">
          <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-orange-50 group-hover:bg-brand-green/10 transition-colors mb-6">
            <fa :icon="['fas','video']" class="text-brand-green text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-3">{{ t('features.cards.history_title') }}</h3>
          <p class="text-secondary leading-relaxed">{{ t('features.cards.history_desc') }}</p>
        </div>
        <!-- Editing -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition hover:-translate-y-1 hover:shadow-xl group">
          <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-green-50 group-hover:bg-brand-green/10 transition-colors mb-6">
            <fa :icon="['fas','wand-magic-sparkles']" class="text-brand-green text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-primary mb-3">{{ t('features.cards.handoff_title') }}</h3>
          <p class="text-secondary leading-relaxed">{{ t('features.cards.handoff_desc') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>