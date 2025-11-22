<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

// 监听 storage 事件以同步语言设置
const handleStorageChange = (e) => {
  if (e.key === 'locale') {
    const newLocale = e.newValue
    if (newLocale && locale.value !== newLocale) {
      locale.value = newLocale
    }
  }
}

const expanded = ref([true, true, true, false, false, false, false, false, false])
const toggleCategory = (i) => { expanded.value[i] = !expanded.value[i] }
const theme = ref(typeof localStorage !== 'undefined' ? localStorage.getItem('theme') || 'light' : 'light')
const applyTheme = () => {
  const root = document.documentElement
  if (theme.value === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}
const sidebarTab = ref('components')
const componentViewMode = ref('grid')
const favoritesOpen = ref(true)
const layersOpen = ref({ home: true, header: true, hero: true, dashboard: false })
const toggleLayerOpen = (key) => { layersOpen.value[key] = !layersOpen.value[key] }
// removed actions toggle for bottom actions
const locks = ref({
  home: false,
  header: false,
  navbar: false,
  logo: false,
  hero: false,
  heroTitle: false,
  cta: false,
  dashboard: false,
})
const visible = ref({
  home: true,
  header: true,
  navbar: true,
  logo: true,
  hero: true,
  heroTitle: true,
  cta: true,
  dashboard: true,
})
const toggleLock = (key) => { locks.value[key] = !locks.value[key] }
const toggleVisible = (key) => { visible.value[key] = !visible.value[key] }
const pageNames = ref({ home: 'Home', dashboard: 'Dashboard' })
const exists = ref({ home: true, dashboard: true })
const layerMenuId = ref(null)
const toggleLayerMenu = (key) => { layerMenuId.value = layerMenuId.value === key ? null : key }
const renameLayer = (key) => {
  const next = window.prompt(t('studio.rename'), pageNames.value[key])
  if (next && next.trim()) pageNames.value[key] = next.trim()
  layerMenuId.value = null
}
const deleteLayer = (key) => {
  const ok = window.confirm(t('studio.confirm_delete_page'))
  if (!ok) return
  exists.value[key] = false
  layerMenuId.value = null
}
const shareLayer = async (key) => {
  const link = window.location.origin + '/studio?id=' + encodeURIComponent(key)
  try { await navigator.clipboard.writeText(link); alert(t('studio.link_copied')) } catch { alert(t('studio.share_link') + link) }
  layerMenuId.value = null
}
const closeMenus = () => { layerMenuId.value = null }

const borderRadius = ref(6)
const radiusTrackRef = ref(null)
let radiusMoveHandler = null
let radiusUpHandler = null
const updateRadiusFromEvent = (e) => {
  const el = radiusTrackRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width)
  const percent = rect.width ? x / rect.width : 0
  const value = Math.round(percent * 24)
  borderRadius.value = value
}
const onRadiusPointerDown = (e) => {
  updateRadiusFromEvent(e)
  radiusMoveHandler = (ev) => updateRadiusFromEvent(ev)
  radiusUpHandler = () => {
    window.removeEventListener('pointermove', radiusMoveHandler)
    window.removeEventListener('pointerup', radiusUpHandler)
    radiusMoveHandler = null
    radiusUpHandler = null
  }
  window.addEventListener('pointermove', radiusMoveHandler)
  window.addEventListener('pointerup', radiusUpHandler)
}

const fontWeight = ref('medium')
const sidebarMode = ref('properties')
const sidebarVisible = ref(true)
const openAISidebar = () => { sidebarMode.value = 'ai'; sidebarVisible.value = true }
const toggleAISidebar = () => {
  if (sidebarMode.value === 'ai' && sidebarVisible.value) sidebarVisible.value = false
  else { sidebarMode.value = 'ai'; sidebarVisible.value = true }
}
const showPropertiesSidebar = () => { sidebarMode.value = 'properties'; sidebarVisible.value = true }
const propertyTab = ref('general')

const aiInput = ref('')
const aiMessages = ref([
  { role: 'assistant', text: '你好，我是 AI 助手。请描述你的设计需求。' }
])
const quickPrompts = ref([
  '优化按钮在暗夜模式的对比度',
  '统一输入框明暗模式样式',
  '生成卡片组件结构与样式',
  '提高页面层级与可读性'
])
const sendAIMessage = () => {
  const t = aiInput.value.trim()
  if (!t) return
  aiMessages.value.push({ role: 'user', text: t })
  aiInput.value = ''
}
const applyQuickPrompt = (p) => { aiInput.value = p }
const applyToCanvas = () => {}
const onAITextareaKeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage() } }

// Consolidated onMounted hook
onMounted(() => {
  // Load saved locale from localStorage
  const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null
  if (savedLocale) {
    locale.value = savedLocale
  }

  // Apply theme
  applyTheme()

  // Add click listener for closing menus
  document.addEventListener('click', closeMenus)
  
  // 监听 localStorage 变化
  window.addEventListener('storage', handleStorageChange)
})

onBeforeUnmount(() => { 
  document.removeEventListener('click', closeMenus) 
  // 移除 storage 事件监听器
  window.removeEventListener('storage', handleStorageChange)
})

// 移除多余的代码片段
</script>
<template>
  <div class="workspace-container flex flex-col h-screen overflow-hidden bg-[#F8F9FA] text-primary dark:bg-[#1C1C1E] dark:text-white">
    <header class="bg-white border-b border-gray-200 py-2 px-4 flex justify-between items-center dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
      <div class="flex items-center space-x-4">
        <div class="flex items-center">
          <fa :icon="['fas','cubes']" class="text-brand-green text-xl mr-2" />
          <span class="font-bold text-lg">{{ $t('studio.title') }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button class="px-3 py-1 rounded-md text-sm bg-light-gray hover:bg-gray-200 transition dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#4A4A4C]"><fa :icon="['fas','rotate-left']" class="mr-1" /> {{ $t('studio.undo') }}</button>
          <button class="px-3 py-1 rounded-md text-sm bg-light-gray hover:bg-gray-200 transition dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#4A4A4C]"><fa :icon="['fas','rotate-right']" class="mr-1" /> {{ $t('studio.redo') }}</button>
        </div>
        <div class="flex items-center space-x-2">
          <button class="px-3 py-1 rounded-md text-sm bg-light-gray hover:bg-gray-200 transition dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#4A4A4C]"><fa :icon="['fas','align-left']" class="mr-1" /> {{ $t('studio.align') }}</button>
          <button class="px-3 py-1 rounded-md text-sm bg-light-gray hover:bg-gray-200 transition dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#4A4A4C]"><fa :icon="['fas','th-large']" class="mr-1" /> {{ $t('studio.distribute') }}</button>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <button class="px-3 py-1 rounded-md text-sm bg-light-gray hover:bg-gray-200 transition dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#4A4A4C]"><fa :icon="['fas','history']" class="mr-1" /> {{ $t('studio.version_history') }}</button>
        <button class="px-3 py-1 rounded-md text-sm bg-light-gray hover:bg-gray-200 transition dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#4A4A4C]"><fa :icon="['fas','users']" class="mr-1" /> {{ $t('studio.collaborate') }}</button>
        <button class="px-3 py-1 rounded-md text-sm bg-light-gray hover:bg-gray-200 transition dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#4A4A4C]" @click="toggleAISidebar"><fa :icon="['fas','robot']" class="mr-1" /> AI Design</button>
        <button class="px-3 py-1 rounded-md text-sm bg-brand-green text-white hover:bg-brand-green-dark transition"><fa :icon="['fas','download']" class="mr-1" /> {{ $t('studio.export') }}</button>
      </div>
    </header>
    <div class="flex flex-1 overflow-hidden">
      <div class="sidebar bg-white border-r border-gray-200 w-64 flex flex-col dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
        <div class="flex border-b border-gray-200 dark:border-[#3A3A3C]">
          <button class="flex-1 py-2 text-sm font-medium text-center border-b-2" :class="sidebarTab==='components' ? 'border-brand-green text-brand-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white dark:text-gray-300 dark:hover:text-white'" @click="sidebarTab='components'">{{ $t('studio.components') }}</button>
          <button class="flex-1 py-2 text-sm font-medium text-center" :class="sidebarTab==='layers' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white dark:text-gray-300 dark:hover:text-white'" @click="sidebarTab='layers'">{{ $t('studio.layers') }}</button>
        </div>
        <div class="p-4 border-b border-gray-200 dark:border-[#3A3A3C]" v-if="sidebarTab==='components'">
          <div class="relative mb-3">
            <input type="text" :placeholder="$t('studio.search_components')" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#2C2C2E] dark:text-[#E0E0E0] dark:border-[#3A3A3C] dark:placeholder-[#6B7280]">
            <fa :icon="['fas','search']" class="absolute right-3 top-2.5 text-gray-400 text-sm" />
          </div>
          <div class="flex justify-between items-center">
            <div class="flex space-x-2">
              <button class="p-1.5 rounded-md transition" :class="componentViewMode==='grid' ? 'bg-light-gray dark:bg-[#3A3A3C]' : 'hover:bg-light-gray dark:hover:bg-[#3A3A3C]'" @click="componentViewMode='grid'"><fa :icon="['fas','th-large']" :class="componentViewMode==='grid' ? 'text-brand-green' : 'text-gray-600 dark:text-gray-300'" /></button>
              <button class="p-1.5 rounded-md transition" :class="componentViewMode==='list' ? 'bg-light-gray dark:bg-[#3A3A3C]' : 'hover:bg-light-gray dark:hover:bg-[#3A3A3C]'" @click="componentViewMode='list'"><fa :icon="['fas','list']" :class="componentViewMode==='list' ? 'text-brand-green' : 'text-gray-600 dark:text-gray-300'" /></button>
            </div>
            <button class="text-xs text-brand-green font-medium hover:text-brand-green-dark transition"><fa :icon="['fas','plus']" class="mr-1" /> {{ $t('studio.new_library') }}</button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-2 sidebar-scroll no-scrollbar" v-if="sidebarTab==='components'" @click="showPropertiesSidebar">
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(0)">
              <div class="flex items-center"><fa :icon="['fas', expanded[0] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 mr-2" /><span class="font-medium text-sm">{{ $t('studio.basic_controls') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">9</span>
            </div>
            <div v-show="expanded[0]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','font']" class="text-blue-500 text-xs" /></div><span class="text-sm">{{ $t('studio.text') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','square']" class="text-green-500 text-xs" /></div><span class="text-sm">{{ $t('studio.button') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','i-cursor']" class="text-purple-500 text-xs" /></div><span class="text-sm">{{ $t('studio.input') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','square-check']" class="text-yellow-500 text-xs" /></div><span class="text-sm">{{ $t('studio.checkbox') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center mr-2"><fa :icon="['fas','circle-dot']" class="text-red-500 text-xs" /></div><span class="text-sm">{{ $t('studio.radio_button') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-indigo-100 flex items-center justify-center mr-2"><fa :icon="['fas','toggle-on']" class="text-indigo-500 text-xs" /></div><span class="text-sm">{{ $t('studio.toggle_switch') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-pink-100 flex items-center justify-center mr-2"><fa :icon="['fas','caret-down']" class="text-pink-500 text-xs" /></div><span class="text-sm">{{ $t('studio.select_dropdown') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-teal-100 flex items-center justify-center mr-2"><fa :icon="['fas','tag']" class="text-teal-500 text-xs" /></div><span class="text-sm">{{ $t('studio.tag_badge') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-cyan-100 flex items-center justify-center mr-2"><fa :icon="['fas','comment-dots']" class="text-cyan-500 text-xs" /></div><span class="text-sm">{{ $t('studio.tooltip') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(1)">
              <div class="flex items-center"><fa :icon="['fas', expanded[1] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 mr-2" /><span class="font-medium text-sm">{{ $t('studio.layout_containers') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">7</span>
            </div>
            <div v-show="expanded[1]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','square']" class="text-blue-500 text-xs" /></div><span class="text-sm">{{ $t('studio.card') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','table-columns']" class="text-green-500 text-xs" /></div><span class="text-sm">{{ $t('studio.panel') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','folder']" class="text-purple-500 text-xs" /></div><span class="text-sm">{{ $t('studio.tabs') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','bars']" class="text-yellow-500 text-xs" /></div><span class="text-sm">{{ $t('studio.accordion') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center mr-2"><fa :icon="['fas','th-large']" class="text-red-500 text-xs" /></div><span class="text-sm">{{ $t('studio.grid_layout') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-indigo-100 flex items-center justify-center mr-2"><fa :icon="['fas','layer-group']" class="text-indigo-500 text-xs" /></div><span class="text-sm">{{ $t('studio.stack_layout') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-gray-100 flex items-center justify-center mr-2"><fa :icon="['fas','minus']" class="text-gray-500 text-xs" /></div><span class="text-sm">{{ $t('studio.divider') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(2)">
              <div class="flex items-center"><fa :icon="['fas', expanded[2] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 mr-2" /><span class="font-medium text-sm">{{ $t('studio.navigation_elements') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">5</span>
            </div>
            <div v-show="expanded[2]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','bars']" class="text-blue-500 text-xs" /></div><span class="text-sm">{{ $t('studio.navbar') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items_center justify_center mr-2"><fa :icon="['fas','stream']" class="text-green-500 text-xs" /></div><span class="text-sm">{{ $t('studio.sidebar') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','chevron-right']" class="text-purple-500 text-xs" /></div><span class="text-sm">{{ $t('studio.breadcrumb') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','minus']" class="text-yellow-500 text-xs" /></div><span class="text-sm">{{ $t('studio.footer') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center mr-2"><fa :icon="['fas','mobile-screen-button']" class="text-red-500 text-xs" /></div><span class="text-sm">{{ $t('studio.tab_bar') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(3)">
              <div class="flex items-center"><fa :icon="['fas', expanded[3] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400 mr-2" /><span class="font-medium text-sm dark:text-[#E0E0E0]">{{ $t('studio.forms_data_entry') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">6</span>
            </div>
            <div v-show="expanded[3]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','calendar-days']" class="text-blue-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.date_picker') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','sliders']" class="text-green-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.slider') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','upload']" class="text-purple-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.file_upload') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','triangle-exclamation']" class="text-yellow-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.form_validation') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center mr-2"><fa :icon="['fas','star']" class="text-red-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.rating') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-indigo-100 flex items-center justify-center mr-2"><fa :icon="['fas','palette']" class="text-indigo-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.color_picker') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(4)">
              <div class="flex items-center"><fa :icon="['fas', expanded[4] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400 mr-2" /><span class="font-medium text-sm dark:text-[#E0E0E0]">{{ $t('studio.data_display') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">8</span>
            </div>
            <div v-show="expanded[4]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','table']" class="text-blue-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.data_table') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','list']" class="text-green-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.list') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','tags']" class="text-purple-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.tag_cloud') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','chart-bar']" class="text-yellow-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.stat_card') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center mr-2"><fa :icon="['fas','chart-line']" class="text-red-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.kpi_widget') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-indigo-100 flex items-center justify-center mr-2"><fa :icon="['fas','chart-pie']" class="text-indigo-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.chart_placeholder') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-teal-100 flex items-center justify-center mr-2"><fa :icon="['fas','tasks']" class="text-teal-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.progress_bar') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-pink-100 flex items-center justify-center mr-2"><fa :icon="['fas','stream']" class="text-pink-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.timeline') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(5)">
              <div class="flex items-center"><fa :icon="['fas', expanded[5] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400 mr-2" /><span class="font-medium text-sm dark:text-[#E0E0E0]">{{ $t('studio.media_rich_media') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">4</span>
            </div>
            <div v-show="expanded[5]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','image']" class="text-blue-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.image') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','play-circle']" class="text-green-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.video_player') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','images']" class="text-purple-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.icon') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','user']" class="text-yellow-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.avatar') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(6)">
              <div class="flex items-center"><fa :icon="['fas', expanded[6] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400 mr-2" /><span class="font-medium text-sm dark:text-[#E0E0E0]">{{ $t('studio.interaction_animation') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">5</span>
            </div>
            <div v-show="expanded[6]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','window-restore']" class="text-blue-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.modal') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','indent']" class="text-green-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.drawer') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','bell']" class="text-purple-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.toast_notification') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','circle-info']" class="text-yellow-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.loading_spinner') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center mr-2"><fa :icon="['fas','ghost']" class="text-red-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.skeleton') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(7)">
              <div class="flex items-center"><fa :icon="['fas', expanded[7] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400 mr-2" /><span class="font-medium text-sm dark:text-[#E0E0E0]">{{ $t('studio.advanced_components') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">6</span>
            </div>
            <div v-show="expanded[7]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','table']" class="text-blue-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.advanced_data_table') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','sitemap']" class="text-green-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.editable_tree') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','pen-to-square']" class="text-purple-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.rich_text_editor') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','diagram-project']" class="text-yellow-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.flowchart_node') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center mr-2"><fa :icon="['fas','table-columns']" class="text-red-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.kanban_board') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-indigo-100 flex items-center justify-center mr-2"><fa :icon="['fas','calendar-days']" class="text-indigo-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.calendar') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
          <div class="component-category mb-3">
            <div class="component-category-header flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="toggleCategory(8)">
              <div class="flex items-center"><fa :icon="['fas', expanded[8] ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400 mr-2" /><span class="font-medium text-sm dark:text-[#E0E0E0]">{{ $t('studio.templates_combinations') }}</span></div>
              <span class="text-xs text-gray-500 bg-gray-100 dark:bg-[#3A3A3C] dark:text-gray-300 px-1.5 py-0.5 rounded">5</span>
            </div>
            <div v-show="expanded[8]" class="component-list mt-1 ml-4 space-y-1">
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','arrow-right']" class="text-blue-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.login_template') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','gauge']" class="text-green-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.dashboard_template') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','list']" class="text-purple-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.list_page_template') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','file-lines']" class="text-yellow-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.detail_page_template') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
              <div class="component-card bg-white border border-gray-200 dark:bg-[#1C1C1E] dark:border-[#3A3A3C] rounded-md p-2 flex items-center justify-between"><div class="flex items-center"><div class="w-6 h-6 rounded-sm bg-red-100 flex items-center justify-center mr-2"><fa :icon="['fas','gear']" class="text-red-500 text-xs" /></div><span class="text-sm dark:text-[#E0E0E0]">{{ $t('studio.settings_page_template') }}</span></div><fa :icon="['fas','grip-lines-vertical']" class="text-gray-400 text-xs" /></div>
            </div>
          </div>
        </div>
        <div class="p-3 border-t border-gray-200 dark:border-[#3A3A3C]" v-if="sidebarTab==='components'">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('studio.favorites') }}</span>
            <div class="flex items-center gap-2">
              <button class="p-1 rounded hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="favoritesOpen = !favoritesOpen">
                <fa :icon="['fas','chevron-down']" class="text-xs text-gray-500 transition-transform" :class="favoritesOpen ? 'rotate-0' : '-rotate-90'" />
              </button>
              <fa :icon="['fas','star']" class="text-yellow-500 text-xs" />
            </div>
          </div>
          <div class="space-y-1" v-show="favoritesOpen">
            <div class="flex items-center p-1.5 rounded-md hover:bg-light-gray transition cursor-pointer dark:hover:bg-[#3A3A3C]"><div class="w-5 h-5 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','square']" class="text-green-500 text-xs" /></div><span class="text-xs">{{ $t('studio.primary_button') }}</span></div>
            <div class="flex items-center p-1.5 rounded-md hover:bg-light-gray transition cursor-pointer dark:hover:bg-[#3A3A3C]"><div class="w-5 h-5 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','table']" class="text-blue-500 text-xs" /></div><span class="text-xs">{{ $t('studio.data_table') }}</span></div>
            <div class="flex items-center p-1.5 rounded-md hover:bg-light-gray transition cursor-pointer dark:hover:bg-[#3A3A3C]"><div class="w-5 h-5 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','table-columns']" class="text-purple-500 text-xs" /></div><span class="text-xs">{{ $t('studio.card_layout') }}</span></div>
          </div>
        </div>
        <div v-else class="flex flex-col flex-1">
          <div class="p-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <div class="relative mb-3">
              <input type="text" :placeholder="$t('studio.search_layers')" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#2C2C2E] dark:text-[#E0E0E0] dark:border-[#3A3A3C] dark:placeholder-[#6B7280]">
              <fa :icon="['fas','search']" class="absolute right-3 top-2.5 text-gray-400 text-sm" />
            </div>
            <div class="flex justify-between items-center">
              <div class="flex space-x-2">
                <button class="p-1.5 rounded-md bg-light-gray transition dark:bg-[#3A3A3C] dark:text-[#E0E0E0]"><fa :icon="['fas','eye']" class="text-gray-600 dark:text-gray-300" /></button>
                <button class="p-1.5 rounded-md hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','eye-slash']" class="text-gray-600 dark:text-gray-300" /></button>
                <button class="p-1.5 rounded-md hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','lock']" class="text-gray-600 dark:text-gray-300" /></button>
              </div>
              <button class="text-xs text-brand-green font-medium hover:text-brand-green-dark transition"><fa :icon="['fas','folder']" class="mr-1" /> {{ $t('studio.group') }}</button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-2 sidebar-scroll">
            <div class="rounded-md mb-2" v-if="exists.home">
              <div class="flex items-center justify-between p-2 relative">
                <div class="flex items-center">
                  <button class="p-1 rounded hover:bg-light-gray dark:hover:bg-[#3A3A3C] -ml-1 mr-1" @click="toggleLayerOpen('home')">
                    <fa :icon="['fas', layersOpen.home ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400" />
                  </button>
                  <div class="w-5 h-5 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','gauge']" class="text-blue-500 text-xs" /></div>
                  <span class="text-sm font-medium">{{ pageNames.home }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleVisible('home')"><fa :icon="['fas', visible.home ? 'eye' : 'eye-slash']" class="text-xs" :class="visible.home ? 'text-gray-500' : 'text-gray-400'" /></button>
                  <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleLock('home')"><fa :icon="['fas', locks.home ? 'lock' : 'unlock']" class="text-xs" :class="locks.home ? 'text-gray-500' : 'text-brand-green'" /></button>
                  <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click.stop="toggleLayerMenu('home')"><fa :icon="['fas','ellipsis-h']" class="text-xs text-gray-500 dark:text-gray-400" /></button>
                </div>
                <div v-if="layerMenuId==='home'" class="absolute top-8 right-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]" @click.stop>
                  <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md" @click="renameLayer('home')">{{ $t('studio.rename') }}</button>
                  <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md" @click="deleteLayer('home')">{{ $t('studio.delete') }}</button>
                  <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md" @click="shareLayer('home')">{{ $t('studio.share') }}</button>
                </div>
              </div>
              <div class="ml-6 space-y-1" v-show="layersOpen.home">
                <div class="rounded-md">
                  <div class="flex items-center justify-between p-2">
                    <div class="flex items-center">
                      <button class="p-1 rounded hover:bg-light-gray dark:hover:bg-[#3A3A3C] -ml-1 mr-1" @click="toggleLayerOpen('header')">
                        <fa :icon="['fas', layersOpen.header ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400" />
                      </button>
                      <div class="w-5 h-5 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','layer-group']" class="text-purple-500 text-xs" /></div>
                      <span class="text-sm">{{ $t('studio.header_section') }}</span>
                    </div>
                <div class="flex items-center space-x-1">
                  <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleVisible('header')"><fa :icon="['fas', visible.header ? 'eye' : 'eye-slash']" class="text-xs" :class="visible.header ? 'text-gray-500' : 'text-gray-400'" /></button>
                  <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleLock('header')"><fa :icon="['fas', locks.header ? 'lock' : 'unlock']" class="text-xs" :class="locks.header ? 'text-gray-500' : 'text-brand-green'" /></button>
                </div>
                  </div>
                  <div class="ml-6 space-y-1" v-show="layersOpen.header">
                    <div class="rounded-md">
                      <div class="flex items-center justify-between p-2">
                        <div class="flex items-center">
                          <div class="w-5 h-5 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','bars']" class="text-blue-500 text-xs" /></div>
                          <span class="text-sm">{{ $t('studio.navbar') }}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleVisible('navbar')"><fa :icon="['fas', visible.navbar ? 'eye' : 'eye-slash']" class="text-xs" :class="visible.navbar ? 'text-gray-500' : 'text-gray-400'" /></button>
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleLock('navbar')"><fa :icon="['fas', locks.navbar ? 'lock' : 'unlock']" class="text-xs" :class="locks.navbar ? 'text-gray-500' : 'text-brand-green'" /></button>
                        </div>
                      </div>
                    </div>
                    <div class="rounded-md">
                      <div class="flex items-center justify-between p-2">
                        <div class="flex items-center">
                          <div class="w-5 h-5 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','cubes']" class="text-green-500 text-xs" /></div>
                          <span class="text-sm">{{ $t('studio.logo') }}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleVisible('logo')"><fa :icon="['fas', visible.logo ? 'eye' : 'eye-slash']" class="text-xs" :class="visible.logo ? 'text-gray-500' : 'text-gray-400'" /></button>
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleLock('logo')"><fa :icon="['fas', locks.logo ? 'lock' : 'unlock']" class="text-xs" :class="locks.logo ? 'text-gray-500' : 'text-brand-green'" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="rounded-md">
                  <div class="flex items-center justify-between p-2">
                    <div class="flex items-center">
                      <button class="p-1 rounded hover:bg-light-gray dark:hover:bg-[#3A3A3C] -ml-1 mr-1" @click="toggleLayerOpen('hero')">
                        <fa :icon="['fas', layersOpen.hero ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400" />
                      </button>
                      <div class="w-5 h-5 rounded-sm bg-yellow-100 flex items-center justify-center mr-2"><fa :icon="['fas','star']" class="text-yellow-500 text-xs" /></div>
                      <span class="text-sm">{{ $t('studio.hero_section') }}</span>
                    </div>
                    <div class="flex items-center space-x-1">
                      <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleVisible('hero')"><fa :icon="['fas', visible.hero ? 'eye' : 'eye-slash']" class="text-xs" :class="visible.hero ? 'text-gray-500' : 'text-gray-400'" /></button>
                      <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleLock('hero')"><fa :icon="['fas', locks.hero ? 'lock' : 'unlock']" class="text-xs" :class="locks.hero ? 'text-gray-500' : 'text-brand-green'" /></button>
                    </div>
                  </div>
                  <div class="ml-6 space-y-1" v-show="layersOpen.hero">
                    <div class="rounded-md">
                      <div class="flex items-center justify-between p-2">
                        <div class="flex items-center">
                          <div class="w-5 h-5 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','font']" class="text-blue-500 text-xs" /></div>
                          <span class="text-sm">{{ $t('studio.hero_title') }}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleVisible('heroTitle')"><fa :icon="['fas', visible.heroTitle ? 'eye' : 'eye-slash']" class="text-xs" :class="visible.heroTitle ? 'text-gray-500' : 'text-gray-400'" /></button>
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleLock('heroTitle')"><fa :icon="['fas', locks.heroTitle ? 'lock' : 'unlock']" class="text-xs" :class="locks.heroTitle ? 'text-gray-500' : 'text-brand-green'" /></button>
                        </div>
                      </div>
                    </div>
                    <div class="rounded-md">
                      <div class="flex items-center justify-between p-2">
                        <div class="flex items-center">
                          <div class="w-5 h-5 rounded-sm bg-green-100 flex itemscenter justify-center mr-2"><fa :icon="['fas','square']" class="text-green-500 text-xs" /></div>
                          <span class="text-sm">{{ $t('studio.cta_button') }}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleVisible('cta')"><fa :icon="['fas', visible.cta ? 'eye' : 'eye-slash']" class="text-xs" :class="visible.cta ? 'text-gray-500' : 'text-gray-400'" /></button>
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleLock('cta')"><fa :icon="['fas', locks.cta ? 'lock' : 'unlock']" class="text-xs" :class="locks.cta ? 'text-gray-500' : 'text-brand-green'" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="rounded-md mb-2" v-if="exists.dashboard">
              <div class="flex items-center justify-between p-2 relative">
                <div class="flex items-center">
                  <button class="p-1 rounded hover:bg-light-gray dark:hover:bg-[#3A3A3C] -ml-1 mr-1" @click="toggleLayerOpen('dashboard')">
                    <fa :icon="['fas', layersOpen.dashboard ? 'chevron-down' : 'chevron-right']" class="text-xs text-gray-500 dark:text-gray-400" />
                  </button>
                  <div class="w-5 h-5 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','gauge']" class="text-green-500 text-xs" /></div>
                  <span class="text-sm font-medium">{{ pageNames.dashboard }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleVisible('dashboard')"><fa :icon="['fas', visible.dashboard ? 'eye' : 'eye-slash']" class="text-xs" :class="visible.dashboard ? 'text-gray-500' : 'text-gray-400'" /></button>
                  <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click="toggleLock('dashboard')"><fa :icon="['fas', locks.dashboard ? 'lock' : 'unlock']" class="text-xs" :class="locks.dashboard ? 'text-gray-500' : 'text-brand-green'" /></button>
                  <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click.stop="toggleLayerMenu('dashboard')"><fa :icon="['fas','ellipsis-h']" class="text-xs text-gray-500 dark:text-gray-400" /></button>
                </div>
                <div v-if="layerMenuId==='dashboard'" class="absolute top-8 right-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]" @click.stop>
                  <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md" @click="renameLayer('dashboard')">{{ $t('studio.rename') }}</button>
                  <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md" @click="deleteLayer('dashboard')">{{ $t('studio.delete') }}</button>
                  <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md" @click="shareLayer('dashboard')">{{ $t('studio.share') }}</button>
                </div>
              </div>
              <div class="ml-6 space-y-1" v-show="layersOpen.dashboard">
                <div class="rounded-md">
                  <div class="flex items-center justify-between p-2">
                    <div class="flex items-center">
                      <div class="w-5 h-5 rounded-sm bg-purple-100 flex items-center justify-center mr-2"><fa :icon="['fas','layer-group']" class="text-purple-500 text-xs" /></div>
                      <span class="text-sm">{{ $t('studio.overview_section') }}</span>
                    </div>
                    <div class="flex items-center space-x-1">
                      <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','eye']" class="text-gray-500 text-xs" /></button>
                      <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','lock']" class="text-gray-500 text-xs" /></button>
                    </div>
                  </div>
                  <div class="ml-6 space-y-1">
                    <div class="rounded-md">
                      <div class="flex items-center justify-between p-2">
                        <div class="flex items-center">
                          <div class="w-5 h-5 rounded-sm bg-blue-100 flex items-center justify-center mr-2"><fa :icon="['fas','square']" class="text-blue-500 text-xs" /></div>
                          <span class="text-sm">{{ $t('studio.stats_card') }}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','eye']" class="text-gray-500 text-xs" /></button>
                          <button class="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','lock']" class="text-gray-500 text-xs" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="bg-white border-b border-gray-200 px-4 py-1 flex items-center dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
          <div class="flex space-x-1">
            <div class="px-3 py-1.5 bg-white border border-gray-300 rounded-t-md text-sm font-medium flex items-center dark:bg-[#2C2C2E] dark:border-[#3A3A3C] dark:text-[#E0E0E0]"><span>{{ $t('studio.ui.page_1') }}</span><fa :icon="['fas','xmark']" class="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer dark:hover:text-gray-300" /></div>
            <div class="px-3 py-1.5 bg-light-gray border border-transparent rounded-t-md text-sm text-gray-600 hover:bg-gray-200 cursor-pointer dark:bg-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#4A4A4C]">{{ $t('studio.ui.page_2') }}</div>
            <button class="px-2 py-1.5 text-gray-500 hover:bg-gray-200 rounded-md dark:text-gray-400 dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','plus']" /></button>
          </div>
          <div class="ml-auto flex items-center space-x-2">
            <button class="p-1.5 rounded-md hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','th-large']" class="text-gray-600 dark:text-gray-300" /></button>
            <div class="flex items-center space-x-1">
              <button class="p-1.5 rounded-md hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','search-minus']" class="text-gray-600 dark:text-gray-300" /></button>
              <span class="text-sm text-gray-600 dark:text-gray-300">100%</span>
              <button class="p-1.5 rounded-md hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','search-plus']" class="text-gray-600 dark:text-gray-300" /></button>
            </div>
          </div>
        </div>
        <div class="canvas-area flex-1 bg-white overflow-auto p-8 relative dark:bg-[#1C1C1E] no-scrollbar" @click="showPropertiesSidebar">
          <div class="bg-white border border-gray-300 shadow-sm mx-auto relative" style="width: 1024px; height: 768px;">
            <div class="selected-element absolute top-10 left-10 w-32 h-10 bg-brand-green rounded-md flex items-center justify-center text-white font-medium cursor-move">Primary Button</div>
            <div class="absolute top-10 left-52 w-64 h-10 border border-gray-300 rounded-md flex items-center px-3 text-gray-500 cursor-move">Input field placeholder...</div>
            <div class="absolute top-28 left-10 w-48 h-32 border border-gray-300 rounded-md bg-white p-4 cursor-move"><div class="font-medium mb-2">Card Title</div><div class="text-sm text-gray-600 dark:text-gray-300">This is a sample card component with some placeholder content.</div></div>
          </div>
        </div>
      </div>
      <div v-if="sidebarVisible" class="sidebar bg-white border-l border-gray-200 w-80 flex flex-col overflow-y-hidden no-scrollbar dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
        <template v-if="sidebarMode==='properties'">
        <div class="p-4 border-b border-gray-200 dark:border-[#3A3A3C]">
          <div class="flex justify-between items-center"><h3 class="font-medium">{{ $t('studio.ui.properties') }}</h3><div class="flex space-x-2"><button class="p-1.5 rounded-md hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','history']" class="text-gray-600 dark:text-gray-300" /></button><button class="p-1.5 rounded-md hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]"><fa :icon="['fas','cog']" class="text-gray-600 dark:text-gray-300" /></button></div></div>
          <div class="mt-2"><div class="text-xs text-gray-500 dark:text-gray-400">{{ $t('studio.ui.selected') }}:</div><div class="flex items-center mt-1"><div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center mr-2"><fa :icon="['fas','square']" class="text-green-500 text-xs" /></div><span class="text-sm font-medium dark:text-gray-300">Primary Button</span></div></div>
        </div>
        <div class="flex border-b border-gray-200 px-4 dark:border-[#3A3A3C]">
          <button class="px-3 py-2 text-sm font-medium" :class="propertyTab==='general' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'" @click="propertyTab='general'">{{ $t('studio.ui.general') }}</button>
          <button class="px-3 py-2 text-sm font-medium" :class="propertyTab==='style' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'" @click="propertyTab='style'">{{ $t('studio.ui.style') }}</button>
          <button class="px-3 py-2 text-sm font-medium" :class="propertyTab==='interactions' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'" @click="propertyTab='interactions'">{{ $t('studio.ui.interactions') }}</button>
          <button class="px-3 py-2 text-sm font-medium" :class="propertyTab==='data' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'" @click="propertyTab='data'">{{ $t('studio.ui.data') }}</button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 no-scrollbar">
          <template v-if="propertyTab==='general'">
            <div class="property-panel-section pb-4 mb-4">
              <h4 class="text-sm font-medium mb-3">{{ $t('studio.ui.general') }}</h4>
              <div class="space-y-3">
                <div><label class="block text-xs text-gray-600 dark:text-gray-300 mb-1">{{ $t('studio.ui.name') }}</label><input type="text" value="Primary Button" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></div>
                <div><label class="block text-xs text-gray-600 dark:text-gray-300 mb-1">{{ $t('studio.ui.type') }}</label><div class="px-2 py-1.5 bg-light-gray dark:bg-[#3A3A3C] rounded text-sm dark:text-[#E0E0E0]">Button</div></div>
                <div class="grid grid-cols-2 gap-2">
                  <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.x') }}</label><input type="text" value="40" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></div>
                  <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.y') }}</label><input type="text" value="40" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.width') }}</label><input type="text" value="128" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></div>
                  <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.height') }}</label><input type="text" value="40" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></div>
                </div>
              </div>
            </div>
            <div class="property-panel-section pb-4">
              <h4 class="text-sm font-medium mb-3">{{ $t('studio.ui.text_section') }}</h4>
              <div class="space-y-3">
                <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.content') }}</label><input type="text" value="Primary Button" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></div>
                <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.font_size') }}</label><input type="text" value="14" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#3A3A3C] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></div>
                <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.font_weight') }}</label>
                  <div class="inline-flex w-full rounded-md border border-gray-300 bg-white overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
                    <button class="flex-1 px-2 py-1.5 text-sm" :class="fontWeight==='regular' ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-light-gray dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]'" @click="fontWeight='regular'">{{ $t('studio.ui.regular') }}</button>
                    <button class="flex-1 px-2 py-1.5 text-sm" :class="fontWeight==='medium' ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-light-gray dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]'" @click="fontWeight='medium'">{{ $t('studio.ui.medium') }}</button>
                    <button class="flex-1 px-2 py-1.5 text-sm" :class="fontWeight==='semibold' ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-light-gray dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]'" @click="fontWeight='semibold'">{{ $t('studio.ui.semibold') }}</button>
                    <button class="flex-1 px-2 py-1.5 text-sm" :class="fontWeight==='bold' ? 'bg-brand-green text-white' : 'text-gray-600 hover:bg-light-gray dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]'" @click="fontWeight='bold'">{{ $t('studio.ui.bold') }}</button>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="propertyTab==='style'">
            <div class="property-panel-section pb-4 mb-4">
              <h4 class="text-sm font-medium mb-3">{{ $t('studio.ui.style') }}</h4>
              <div class="space-y-3">
                <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.background') }}</label><div class="flex items-center"><div class="w-6 h-6 rounded border border-gray-300 bg-brand-green mr-2"></div><span class="text-sm">#00C777</span></div></div>
                <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.text_color') }}</label><div class="flex items-center"><div class="w-6 h-6 rounded border border-gray-300 bg-white mr-2"></div><span class="text-sm">#FFFFFF</span></div></div>
                <div><label class="block text-xs text-gray-600 mb-1">{{ $t('studio.ui.border_radius') }}</label>
                  <div class="flex items-center gap-2">
                    <div ref="radiusTrackRef" class="relative flex-1 h-1 bg-gray-300 rounded dark:bg-[#3A3A3C]" @pointerdown="onRadiusPointerDown">
                      <div class="absolute -top-1.5" :style="{ left: (borderRadius/24*100) + '%'}"><div class="w-3 h-3 rounded-full bg-brand-green shadow cursor-pointer"></div></div>
                    </div>
                    <div class="w-10 text-right text-xs text-gray-600 dark:text-[#E0E0E0]">{{ borderRadius }}</div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="propertyTab==='interactions'">
            <div class="property-panel-section pb-4 mb-4">
              <h4 class="text-sm font-medium mb-3">{{ $t('studio.ui.interactions') }}</h4>
              <div class="space-y-3">
                <div class="flex items-center justify-between"><span class="text-sm">{{ $t('studio.ui.hover_state') }}</span><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="accent-brand-green">启用</label></div>
                <div class="flex items-center justify-between"><span class="text-sm">{{ $t('studio.ui.click_action') }}</span><select class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#2C2C2E] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"><option>无</option><option>打开链接</option><option>触发脚本</option></select></div>
                <div class="flex items-center justify-between"><span class="text-sm">{{ $t('studio.ui.disabled') }}</span><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="accent-brand-green">禁用</label></div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="property-panel-section pb-4 mb-4">
              <h4 class="text-sm font-medium mb-3">{{ $t('studio.ui.data') }}</h4>
              <div class="space-y-3">
                <div><label class="block text-xs text-gray-600 mb-1">数据源</label><input type="text" placeholder="如：button.label" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green dark:bg-[#2C2C2E] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></div>
                <div class="flex items-center justify-between"><span class="text-sm">动态文本</span><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="accent-brand-green">启用</label></div>
              </div>
            </div>
          </template>
        </div>
        </template>
        <template v-else>
          <div class="p-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <div class="flex justify-between items-center">
              <div class="flex items-center">
                <fa :icon="['fas','robot']" class="text-brand-green mr-2" />
                <h3 class="font-medium">AI 助手</h3>
                <span class="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-brand-green/10 text-brand-green">Beta</span>
              </div>
              <button class="p-1.5 rounded-md hover:bg-light-gray transition dark:hover:bg-[#3A3A3C]" @click="showPropertiesSidebar">
                <fa :icon="['fas','xmark']" class="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          <div class="flex-1 flex flex-col overflow-hidden">
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
              <div v-for="(m,i) in aiMessages" :key="i" :class="m.role==='user' ? 'flex justify-end' : 'flex'">
                <div :class="m.role==='user' ? 'max-w-[80%] px-3 py-2 rounded-lg bg-brand-green text-white text-sm' : 'max-w-[80%] px-3 py-2 rounded-lg bg-light-gray text-sm dark:bg-[#2C2C2E] dark:text-[#E0E0E0]'">{{ m.text }}</div>
              </div>
            </div>
            <div class="sticky bottom-0 border-t border-gray-200 bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] p-3">
              <div class="bg-light-gray dark:bg-[#1E1E1E] rounded-md border-0 focus-within:ring-1 focus-within:ring-brand-green" style="display: flex; flex-direction: column;">
                <!-- 上部：多行文本输入区域 -->
                <textarea v-model="aiInput" class="w-full px-3 pt-3 pb-2 bg-transparent border-0 text-sm focus:outline-none dark:text-[#E0E0E0] resize-none no-scrollbar" rows="3" placeholder="您正在与 AI Design 聊天"></textarea>
                <!-- 下部：功能按钮行 -->
                <div class="flex items-center justify-between px-2 pb-2" style="display: flex; flex-direction: row; align-items: center;">
                  <div class="flex items-center gap-1">
                    <button class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition" style="flex-shrink: 0;">
                      <span class="text-base">@</span>
                    </button>
                    <button class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition" style="flex-shrink: 0;">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                        <path d="M3 16L8 11L12 15M12 15L15 12L21 18M12 15L15 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <button @click="sendAIMessage" class="p-1.5 rounded-md bg-brand-green text-white hover:bg-brand-green-dark transition flex items-center justify-center" style="flex-shrink: 0;">
                    <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3L8 13M8 3L4 7M8 3L12 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <footer class="bg-white border-t border-gray-200 py-1 px-4 flex justify-between items-center text-sm text-gray-600 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
      <div class="flex items-center space-x-4"><span>{{ $t('studio.ui.canvas_label') }}: 1024×768</span><span>{{ $t('studio.ui.selected') }}: Button (128×40)</span></div>
      <div class="flex items-center space-x-4"><button class="hover:text-gray-900 dark:hover:text-gray-300 transition"><fa :icon="['fas','th-large']" class="mr-1" /> {{ $t('studio.ui.grid') }}</button><button class="hover:text-gray-900 dark:hover:text-gray-300 transition"><fa :icon="['fas','ruler']" class="mr-1" /> {{ $t('studio.ui.guides') }}</button><div class="flex items-center"><fa :icon="['fas','lightbulb']" class="text-brand-green mr-1" /><span>{{ $t('studio.ui.ai_available') }}</span></div></div>
    </footer>
    
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>