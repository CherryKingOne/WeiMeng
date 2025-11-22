<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section id="integrations" class="py-24 bg-white">
    <div class="container mx-auto px-6">
      <div class="grid lg:grid-cols-2 gap-16 items-center">
        <div class="order-2 lg:order-1">
          <span class="inline-block px-4 py-1.5 bg-brand-green/10 text-brand-green font-semibold rounded-full text-sm mb-4">{{ t('enterprise.label') }}</span>
          <h2 class="text-4xl font-bold text-gray-900 mb-6">{{ t('enterprise.title') }}</h2>
          <p class="text-xl text-gray-600 mb-10">{{ t('enterprise.intro') }}</p>
          <div class="space-y-6">
            <div class="flex items-start gap-4 p-5 rounded-xl bg-gray-50 hover:bg-brand-green/5 transition-colors">
              <div class="flex-shrink-0 w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center">
                <fa :icon="['fas','shield-halved']" class="text-white" />
              </div>
              <div>
                <h4 class="font-bold text-gray-900 mb-2">{{ t('enterprise.items.audit_title') }}</h4>
                <p class="text-gray-600">{{ t('enterprise.items.audit_desc') }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4 p-5 rounded-xl bg-gray-50 hover:bg-brand-green/5 transition-colors">
              <div class="flex-shrink-0 w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center">
                <fa :icon="['fas','puzzle-piece']" class="text-white" />
              </div>
              <div>
                <h4 class="font-bold text-gray-900 mb-2">{{ t('enterprise.items.integ_title') }}</h4>
                <p class="text-gray-600">{{ t('enterprise.items.integ_desc') }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4 p-5 rounded-xl bg-gray-50 hover:bg-brand-green/5 transition-colors">
              <div class="flex-shrink-0 w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center">
                <fa :icon="['fas','rocket']" class="text-white" />
              </div>
              <div>
                <h4 class="font-bold text-gray-900 mb-2">{{ t('enterprise.items.onboard_title') }}</h4>
                <p class="text-gray-600">{{ t('enterprise.items.onboard_desc') }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="order-1 lg:order-2">
          <div class="relative rounded-2xl overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2400&auto=format&fit=crop" :alt="t('enterprise.image_alt')" class="w-full">
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          <p class="text-center mt-6 text-sm text-gray-500">{{ t('enterprise.admin_panel_caption') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>