<template>
  <div class="relative" ref="dropdownRef">
    <!-- Trigger Button -->
    <button
      @click="toggleDropdown"
      class="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-10 pr-10 text-sm font-medium focus:ring-2 focus:ring-brand-green text-left dark:bg-[#1E1E1E] dark:text-[#E0E0E0]"
    >
      <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
        <img :src="getProviderIcon(modelValue)" class="w-5 h-5 object-contain" />
      </div>
      <span class="block truncate">{{ displayText }}</span>
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <fa :icon="['fas','chevron-down']" class="text-xs" />
      </div>
    </button>

    <!-- Dropdown Menu - Teleported to body to avoid overflow issues -->
    <teleport to="body">
      <div
        v-if="isOpen"
        :style="dropdownStyle"
        class="fixed bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-200 dark:border-[#3A3A3C] z-[9999] max-h-96 overflow-hidden"
      >
        <!-- Search Input -->
        <div class="p-3 border-b border-gray-100 dark:border-[#3A3A3C]">
          <div class="relative">
            <fa :icon="['fas','magnifying-glass']" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索模型"
              class="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              @click.stop
            />
          </div>
        </div>

        <!-- Model List -->
        <div class="max-h-64 overflow-y-auto">
          <div v-if="filteredModels.length === 0" class="p-4 text-center text-sm text-gray-400">
            暂无可用模型
          </div>
          <div v-else class="p-2">
            <template v-for="(group, providerName) in groupedModels" :key="providerName">
              <div class="text-xs font-bold text-gray-500 dark:text-gray-400 px-2 py-1">
                {{ providerName }}
              </div>
              <button
                v-for="model in group"
                :key="model.config_id"
                @click="selectModel(model)"
                class="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors text-left"
                :class="{ 'bg-gray-50 dark:bg-[#3A3A3C]': model.model_name === modelValue }"
              >
                <div
                  class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                  :class="getModelIconClass(model.model_name)"
                >
                  <fa :icon="['fas','robot']" class="text-xs" :class="getModelIconColor(model.model_name)" />
                </div>
                <span class="text-sm text-gray-700 dark:text-gray-200 flex-1">{{ model.model_name }}</span>
                <fa
                  v-if="model.model_name === modelValue"
                  :icon="['fas','check']"
                  class="text-brand-green text-sm"
                />
              </button>
            </template>
          </div>
        </div>

        <!-- Model Settings Link -->
        <div class="p-3 border-t border-gray-100 dark:border-[#3A3A3C]">
          <button
            @click="openModelSettings"
            class="text-xs text-brand-green hover:text-brand-green/80 flex items-center gap-1 transition-colors"
          >
            模型设置
            <fa :icon="['fas','arrow-right']" class="text-[10px]" />
          </button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  models: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '请选择模型'
  },
  getProviderIcon: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'openSettings'])

const isOpen = ref(false)
const searchQuery = ref('')
const dropdownRef = ref(null)
const dropdownStyle = ref({})

const displayText = computed(() => {
  return props.modelValue || props.placeholder
})

// Calculate dropdown position
const updateDropdownPosition = () => {
  if (!dropdownRef.value) return

  const rect = dropdownRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    minWidth: '320px'  // Fixed minimum width for dropdown, not following button width
  }
}

// Watch isOpen to update position when dropdown opens
watch(isOpen, async (newVal) => {
  if (newVal) {
    await nextTick()
    updateDropdownPosition()
  }
})

const filteredModels = computed(() => {
  if (!searchQuery.value) return props.models
  const query = searchQuery.value.toLowerCase()
  return props.models.filter(model =>
    model.model_name.toLowerCase().includes(query)
  )
})

const groupedModels = computed(() => {
  const groups = {}
  filteredModels.value.forEach(model => {
    const provider = getProviderName(model.model_name)
    if (!groups[provider]) {
      groups[provider] = []
    }
    groups[provider].push(model)
  })
  return groups
})

const getProviderName = (modelName) => {
  const name = modelName.toLowerCase()
  if (name.includes('gpt') || name.includes('openai')) return 'OpenAI'
  if (name.includes('claude') || name.includes('anthropic')) return 'Anthropic'
  if (name.includes('qwen') || name.includes('tongyi')) return '通义千问'
  if (name.includes('glm') || name.includes('zhipu')) return '智谱 AI'
  if (name.includes('deepseek')) return 'DeepSeek'
  if (name.includes('gemini') || name.includes('google')) return 'Google'
  return '其他'
}

const getModelIconClass = (modelName) => {
  const name = modelName.toLowerCase()
  if (name.includes('gpt-4')) return 'bg-purple-100 dark:bg-purple-900/30'
  if (name.includes('gpt')) return 'bg-blue-100 dark:bg-blue-900/30'
  if (name.includes('claude')) return 'bg-orange-100 dark:bg-orange-900/30'
  if (name.includes('qwen')) return 'bg-red-100 dark:bg-red-900/30'
  if (name.includes('glm')) return 'bg-indigo-100 dark:bg-indigo-900/30'
  if (name.includes('deepseek')) return 'bg-cyan-100 dark:bg-cyan-900/30'
  return 'bg-green-100 dark:bg-green-900/30'
}

const getModelIconColor = (modelName) => {
  const name = modelName.toLowerCase()
  if (name.includes('gpt-4')) return 'text-purple-500'
  if (name.includes('gpt')) return 'text-blue-500'
  if (name.includes('claude')) return 'text-orange-500'
  if (name.includes('qwen')) return 'text-red-500'
  if (name.includes('glm')) return 'text-indigo-500'
  if (name.includes('deepseek')) return 'text-cyan-500'
  return 'text-green-500'
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
  }
}

const selectModel = (model) => {
  emit('update:modelValue', model.model_name)
  isOpen.value = false
}

const openModelSettings = () => {
  emit('openSettings')
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

// Update position on scroll or resize
const handleScroll = () => {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

const handleResize = () => {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleResize)
})
</script>
