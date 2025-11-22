<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section id="integrations" class="py-20">
    <div class="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
      <div id="governance">
        <span class="text-brand-green font-semibold">{{ t('enterprise.label') }}</span>
        <h2 class="text-4xl font-bold text-primary mt-2">{{ t('enterprise.title') }}</h2>
        <p class="mt-4 text-secondary">{{ t('enterprise.intro') }}</p>
        <ul class="mt-8 space-y-6">
          <li class="flex items-start">
            <fa :icon="['fas','check-circle']" class="text-brand-green mt-1 mr-4" />
            <div>
              <h4 class="font-semibold text-primary">{{ t('enterprise.items.audit_title') }}</h4>
              <p class="text-secondary">{{ t('enterprise.items.audit_desc') }}</p>
            </div>
          </li>
          <li class="flex items-start">
            <fa :icon="['fas','check-circle']" class="text-brand-green mt-1 mr-4" />
            <div>
              <h4 class="font-semibold text-primary">{{ t('enterprise.items.integ_title') }}</h4>
              <p class="text-secondary">{{ t('enterprise.items.integ_desc') }}</p>
            </div>
          </li>
          <li class="flex items-start">
            <fa :icon="['fas','check-circle']" class="text-brand-green mt-1 mr-4" />
            <div>
              <h4 class="font-semibold text-primary">{{ t('enterprise.items.onboard_title') }}</h4>
              <p class="text-secondary">{{ t('enterprise.items.onboard_desc') }}</p>
            </div>
          </li>
        </ul>
      </div>
      <div class="bg-light-gray p-8 rounded-xl">
        <img src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2400&auto=format&fit=crop" :alt="t('enterprise.image_alt')" class="rounded-lg shadow-lg">
        <p class="text-center mt-4 text-sm text-secondary">{{ t('enterprise.admin_panel_caption') }}</p>
      </div>
    </div>
  </section>
</template>