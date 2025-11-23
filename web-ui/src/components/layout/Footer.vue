<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <footer class="bg-gray-900 text-gray-300">
    <div class="container mx-auto px-6 py-16">
      <div class="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
        <div class="col-span-2">
          <a href="/" class="inline-flex items-center mb-6">
            <img src="@/assets/logo.png" :alt="t('brand.name') + ' Logo'" class="w-10 h-10 mr-4 rounded-lg" />
            <span class="text-2xl font-bold text-white">{{ t('brand.name') }}</span>
          </a>
          <p class="text-gray-400 mb-6 max-w-xs">{{ t('footer.tagline') }}</p>
          <div class="flex gap-4">
            <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-brand-green rounded-lg flex items-center justify-center transition-colors">
              <fa :icon="['fab','twitter']" class="text-gray-300" />
            </a>
            <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-brand-green rounded-lg flex items-center justify-center transition-colors">
              <fa :icon="['fab','github']" class="text-gray-300" />
            </a>
            <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-brand-green rounded-lg flex items-center justify-center transition-colors">
              <fa :icon="['fab','linkedin']" class="text-gray-300" />
            </a>
          </div>
        </div>
        <div>
          <h5 class="font-bold text-white mb-4">{{ t('footer.product') }}</h5>
          <ul class="space-y-3">
            <li><a href="#features" class="hover:text-brand-green transition-colors">{{ t('footer.features') }}</a></li>
            <li><a href="#integrations" class="hover:text-brand-green transition-colors">{{ t('footer.integrations') }}</a></li>
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.security') }}</a></li>
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.pricing') }}</a></li>
          </ul>
        </div>
        <div>
          <h5 class="font-bold text-white mb-4">{{ t('footer.resources') }}</h5>
          <ul class="space-y-3">
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.docs') }}</a></li>
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.api') }}</a></li>
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.guides') }}</a></li>
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.blog') }}</a></li>
          </ul>
        </div>
        <div>
          <h5 class="font-bold text-white mb-4">{{ t('footer.company') }}</h5>
          <ul class="space-y-3">
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.about') }}</a></li>
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.careers') }}</a></li>
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.contact') }}</a></li>
          </ul>
        </div>
        <div>
          <h5 class="font-bold text-white mb-4">{{ t('footer.legal') }}</h5>
          <ul class="space-y-3">
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.terms') }}</a></li>
            <li><a href="#" class="hover:text-brand-green transition-colors">{{ t('footer.privacy') }}</a></li>
          </ul>
        </div>
      </div>
      <div class="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-sm text-gray-400">&copy; 2024 {{ t('brand.name') }}. {{ t('footer.rights') }}</p>
        <div class="flex gap-6 text-sm">
          <a href="#" class="text-gray-400 hover:text-brand-green transition-colors">{{ t('footer.status') }}</a>
          <a href="#" class="text-gray-400 hover:text-brand-green transition-colors">{{ t('footer.changelog') }}</a>
        </div>
      </div>
    </div>
  </footer>
</template>
