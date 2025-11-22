<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from './components/layout/Header.vue'
import SiteFooter from './components/layout/Footer.vue'

const route = useRoute()
const showHeader = computed(() => route.name === 'home')
const showFooter = computed(() => route.name === 'home')
</script>

<template>
  <SiteHeader v-if="showHeader" />
  <router-view />
  <SiteFooter v-if="showFooter" />
</template>
