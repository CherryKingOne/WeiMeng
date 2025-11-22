<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section id="features" class="py-24 bg-gradient-to-b from-white to-gray-50">
    <div class="container mx-auto px-6">
      <div class="text-center mb-20">
        <span class="inline-block px-4 py-1.5 bg-brand-green/10 text-brand-green font-semibold rounded-full text-sm mb-4">{{ t('features.label') }}</span>
        <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{{ t('features.title') }}</h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">{{ t('features.intro') }}</p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-xl transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <fa :icon="['fas','pen-nib']" class="text-white text-xl" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">{{ t('features.cards.search_title') }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ t('features.cards.search_desc') }}</p>
          </div>
        </div>
        <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-xl transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <fa :icon="['fas','user-astronaut']" class="text-white text-xl" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">{{ t('features.cards.ai_title') }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ t('features.cards.ai_desc') }}</p>
          </div>
        </div>
        <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-xl transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <fa :icon="['fas','microphone-lines']" class="text-white text-xl" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">{{ t('features.cards.gov_title') }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ t('features.cards.gov_desc') }}</p>
          </div>
        </div>
        <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-xl transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <fa :icon="['fas','images']" class="text-white text-xl" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">{{ t('features.cards.collab_title') }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ t('features.cards.collab_desc') }}</p>
          </div>
        </div>
        <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-xl transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <fa :icon="['fas','video']" class="text-white text-xl" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">{{ t('features.cards.history_title') }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ t('features.cards.history_desc') }}</p>
          </div>
        </div>
        <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-xl transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-gradient-to-br from-brand-green to-emerald-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <fa :icon="['fas','wand-magic-sparkles']" class="text-white text-xl" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">{{ t('features.cards.handoff_title') }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ t('features.cards.handoff_desc') }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>