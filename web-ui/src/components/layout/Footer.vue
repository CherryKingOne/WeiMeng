<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <footer class="bg-light-gray">
    <div class="container mx-auto px-6 py-12">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
        <div class="col-span-2 md:col-span-1">
          <a href="#" class="text-xl font-bold text-primary flex items-center">
            <i class="fas fa-cubes text-brand-green mr-2"></i>
            OneFour
          </a>
          <p class="mt-2 text-sm text-secondary">&copy; 2024 OneFour, Inc.<br>Design Faster. Together.</p>
        </div>
        <div>
          <h5 class="font-semibold text-primary">{{ t('footer.product') }}</h5>
          <ul class="mt-4 space-y-2 text-secondary">
            <li><a href="#" class="hover:text-primary">{{ t('footer.features') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.integrations') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.security') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.pricing') }}</a></li>
          </ul>
        </div>
        <div>
          <h5 class="font-semibold text-primary">{{ t('footer.resources') }}</h5>
          <ul class="mt-4 space-y-2 text-secondary">
            <li><a href="#" class="hover:text-primary">{{ t('footer.docs') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.api') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.guides') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.blog') }}</a></li>
          </ul>
        </div>
        <div>
          <h5 class="font-semibold text-primary">{{ t('footer.company') }}</h5>
          <ul class="mt-4 space-y-2 text-secondary">
            <li><a href="#" class="hover:text-primary">{{ t('footer.about') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.careers') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.contact') }}</a></li>
          </ul>
        </div>
        <div>
          <h5 class="font-semibold text-primary">{{ t('footer.legal') }}</h5>
          <ul class="mt-4 space-y-2 text-secondary">
            <li><a href="#" class="hover:text-primary">{{ t('footer.terms') }}</a></li>
            <li><a href="#" class="hover:text-primary">{{ t('footer.privacy') }}</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>