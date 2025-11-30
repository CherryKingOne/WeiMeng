<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Agent 输入
const agentInput = ref('')
const isProcessing = ref(false)
const messages = ref([])
const showSidebar = ref(false) // 控制侧边栏显示

// 选中的 Agent
const selectedAgent = ref('director') // 默认选中 AI 导演

// 角色菜单
const showCharacterMenu = ref(false)
const characterAutoSwitch = ref(false) // 角色自动切换开关

// 模型菜单
const showModelMenu = ref(false)
const selectedModel = ref('gpt-4')
const modelCategory = ref('text') // text, image, video, 3d
const autoSwitch = ref(false) // 自动切换开关
const models = {
  text: [
    { id: 'gpt-4', name: 'GPT-4', description: 'OpenAI 最强大的语言模型', provider: 'OpenAI', speed: '中速' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'OpenAI 快速响应模型', provider: 'OpenAI', speed: '快速' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Anthropic 最强推理模型', provider: 'Anthropic', speed: '中速' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Anthropic 平衡性能模型', provider: 'Anthropic', speed: '快速' }
  ],
  image: [
    { id: 'dall-e-3', name: 'DALL·E 3', description: 'OpenAI 最新图像生成模型', provider: 'OpenAI', speed: '30s' },
    { id: 'midjourney-v6', name: 'Midjourney V6', description: '高质量艺术图像生成', provider: 'Midjourney', speed: '60s' },
    { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', description: '开源图像生成模型', provider: 'Stability AI', speed: '20s' }
  ],
  video: [
    { id: 'runway-gen2', name: 'Runway Gen-2', description: '文本到视频生成', provider: 'Runway', speed: '2min' },
    { id: 'pika-1.0', name: 'Pika 1.0', description: '快速视频生成模型', provider: 'Pika', speed: '1min' }
  ],
  '3d': [
    { id: 'meshy-3', name: 'Meshy 3', description: '文本到3D模型生成', provider: 'Meshy', speed: '3min' },
    { id: 'spline-ai', name: 'Spline AI', description: '快速3D场景生成', provider: 'Spline', speed: '2min' },
    { id: 'luma-genie', name: 'Luma Genie', description: '高质量3D资产生成', provider: 'Luma AI', speed: '5min' }
  ]
}

// Agent 列表
const agents = [
  { id: 'writer', name: '编剧', icon: 'pen-nib', gradient: 'from-pink-500 to-red-500', shadow: 'shadow-pink-500/50' },
  { id: 'vfx', name: '特效师', icon: 'fire', gradient: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/50' },
  { id: 'magic', name: '魔法师', icon: 'wand-magic-sparkles', gradient: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/50' },
  { id: 'director', name: 'AI 导演', icon: 'robot', gradient: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/50', isMain: true },
  { id: 'musician', name: '音乐师', icon: 'music', gradient: 'from-yellow-500 to-orange-500', shadow: 'shadow-yellow-500/50' },
  { id: 'editor', name: '剪辑师', icon: 'video', gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/50' },
  { id: 'designer', name: '设计师', icon: 'palette', gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/50' }
]

// 切换角色菜单
const toggleCharacterMenu = () => {
  showCharacterMenu.value = !showCharacterMenu.value
  console.log('【角色菜单】切换状态:', showCharacterMenu.value)
}

// 选择角色
const selectCharacter = (agent) => {
  console.log('【角色选择】选中角色:', agent.name)
  selectedAgent.value = agent.id
  showCharacterMenu.value = false
}

// 切换模型菜单
const toggleModelMenu = () => {
  showModelMenu.value = !showModelMenu.value
  console.log('【模型菜单】切换状态:', showModelMenu.value)
}

// 选择模型
const selectModel = (model) => {
  console.log('【模型选择】选中模型:', model.name)
  selectedModel.value = model.id
  showModelMenu.value = false
}

// 获取当前选中的模型信息
const currentModel = computed(() => {
  for (const category in models) {
    const found = models[category].find(m => m.id === selectedModel.value)
    if (found) return found
  }
  return models.text[0]
})

// 获取当前分类的模型列表
const currentModels = computed(() => {
  return models[modelCategory.value] || []
})

// 快捷模板
const templates = [
  { icon: 'clapperboard', label: '快速生成视频', prompt: '帮我生成一个关于[主题]的短视频脚本' },
  { icon: 'wand-magic-sparkles', label: 'AI 智能创作', prompt: '使用 AI 自动创作一个完整的短剧故事' },
  { icon: 'music', label: '音乐配乐生成', prompt: '为我的视频生成合适的背景音乐' },
  { icon: 'palette', label: '风格化设计', prompt: '将我的内容转换为[风格]风格' },
  { icon: 'robot', label: '智能剪辑助手', prompt: '帮我智能剪辑和优化视频内容' }
]

// 选择 Agent
const selectAgent = (agentId) => {
  selectedAgent.value = agentId
  console.log('【Agent 切换】选中 Agent:', agentId)
}

// 处理 Agent 输入
const handleSubmit = async () => {
  if (!agentInput.value.trim() || isProcessing.value) return

  const userMessage = agentInput.value.trim()
  messages.value.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  })

  agentInput.value = ''
  isProcessing.value = true

  // 显示侧边栏
  showSidebar.value = true

  // 模拟 AI 响应
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content: '好的，我理解了您的需求。让我为您处理...',
      timestamp: new Date()
    })
    isProcessing.value = false
  }, 1000)
}

// 使用模板
const useTemplate = (template) => {
  agentInput.value = template.prompt
}

// 返回工作区
const goBack = () => {
  router.push('/workspace')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden relative">
    <!-- 背景网格 -->
    <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>

    <!-- 顶部导航 -->
    <header class="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10 backdrop-blur-sm">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="p-2 hover:bg-white/10 rounded-lg transition">
          <fa :icon="['fas', 'arrow-left']" class="text-xl" />
        </button>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <fa :icon="['fas', 'robot']" class="text-xl" />
          </div>
          <div>
            <h1 class="text-xl font-bold">Agent 模式</h1>
            <p class="text-xs text-gray-400">AI 智能创作助手</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full border border-purple-500/30">
          Beta
        </span>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="relative z-10 flex px-8 py-6" :class="showSidebar ? 'justify-start' : 'justify-center items-center'">
      <!-- 左侧内容区 -->
      <div class="transition-all duration-700 ease-in-out" :class="showSidebar ? 'w-2/3 pr-8' : 'w-full flex flex-col items-center justify-center'">
      <!-- 欢迎区域 -->
      <div v-if="messages.length === 0" class="text-center max-w-4xl mx-auto">
        <!-- 标题 -->
        <h2 class="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
          Make Animation<br/>Great Again
        </h2>
        <p class="text-xl text-gray-300 mb-12">
          导演，我们是您的专业 AI 动画代理团队
        </p>

        <!-- AI Agent 角色展示 -->
        <div class="flex items-center justify-center gap-6 mb-16">
          <div
            v-for="agent in agents"
            :key="agent.id"
            @click="selectAgent(agent.id)"
            class="flex flex-col items-center justify-center cursor-pointer"
            style="min-height: 160px;"
          >
            <div
              :class="[
                'bg-gradient-to-br flex items-center justify-center mb-2 relative',
                'transition-all duration-500 ease-out',
                'hover:scale-105',
                `bg-gradient-to-br ${agent.gradient}`,
                agent.shadow,
                // 选中状态的尺寸
                selectedAgent === agent.id
                  ? (agent.isMain ? 'w-36 h-36 rounded-3xl shadow-2xl' : 'w-32 h-32 rounded-3xl shadow-2xl')
                  : 'w-24 h-24 rounded-2xl shadow-lg'
              ]"
            >
              <fa
                :icon="['fas', agent.icon]"
                :class="selectedAgent === agent.id ? 'text-5xl' : 'text-4xl'"
                class="transition-all duration-500 ease-out"
              />
              <!-- 选中指示器 -->
              <transition
                enter-active-class="transition-all duration-300 ease-out"
                leave-active-class="transition-all duration-200 ease-in"
                enter-from-class="opacity-0 scale-0"
                enter-to-class="opacity-100 scale-100"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-0"
              >
                <div
                  v-if="selectedAgent === agent.id"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"
                ></div>
              </transition>
            </div>
            <span
              :class="[
                'text-sm transition-all duration-500 ease-out',
                selectedAgent === agent.id ? 'font-semibold text-white' : 'text-gray-400',
                agent.isMain ? 'font-semibold' : ''
              ]"
            >
              {{ agent.name }}
            </span>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="max-w-3xl mx-auto relative">
          <div class="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div class="flex items-center gap-3 p-4">
              <button class="p-3 hover:bg-white/10 rounded-xl transition">
                <fa :icon="['fas', 'plus']" class="text-xl" />
              </button>
              <input
                v-model="agentInput"
                @keyup.enter="handleSubmit"
                type="text"
                placeholder="描述■图片内容，输入描述，带动导演上工现！"
                class="flex-1 bg-transparent outline-none text-lg placeholder-gray-400"
              />
              <button @click="toggleModelMenu" class="p-3 hover:bg-white/10 rounded-xl transition flex items-center gap-2">
                <fa :icon="['fas', 'cube']" class="text-xl" />
                <span class="text-sm">{{ currentModel.name }}</span>
              </button>
              <button @click="toggleCharacterMenu" class="p-3 hover:bg-white/10 rounded-xl transition">
                <fa :icon="['fas', 'palette']" class="text-xl" />
                <span class="ml-2 text-sm">角色</span>
              </button>
              <button
                @click="handleSubmit"
                :disabled="!agentInput.trim() || isProcessing"
                class="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <fa :icon="['fas', 'paper-plane']" class="text-xl" />
              </button>
            </div>
          </div>

          <!-- 角色菜单背景遮罩 -->
          <div
            v-if="showCharacterMenu"
            @click="showCharacterMenu = false"
            class="fixed inset-0 z-40"
          ></div>

          <!-- 角色菜单弹窗 (在输入框外部) -->
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-150 ease-in"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-2"
          >
            <div
              v-if="showCharacterMenu"
              @click.stop
              class="absolute bottom-full right-0 mb-2 w-80 bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50"
            >
              <!-- 菜单头部 -->
              <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-white">选择角色</h3>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">自动</span>
                  <button
                    @click.stop="characterAutoSwitch = !characterAutoSwitch"
                    :class="[
                      'relative w-9 h-5 rounded-full transition-colors duration-200',
                      characterAutoSwitch ? 'bg-green-500' : 'bg-gray-600'
                    ]"
                  >
                    <span
                      :class="[
                        'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200',
                        characterAutoSwitch ? 'translate-x-4' : 'translate-x-0'
                      ]"
                    ></span>
                  </button>
                </div>
              </div>

              <!-- 角色列表 -->
              <div class="max-h-96 overflow-y-auto">
                <button
                  v-for="agent in agents"
                  :key="agent.id"
                  @click.stop="selectCharacter(agent)"
                  :class="[
                    'w-full px-4 py-3 transition flex items-start gap-3 text-left',
                    selectedAgent === agent.id ? 'bg-white/20' : 'hover:bg-white/10'
                  ]"
                >
                  <!-- 角色图标 -->
                  <div :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    `bg-gradient-to-br ${agent.gradient}`
                  ]">
                    <fa :icon="['fas', agent.icon]" class="text-lg" />
                  </div>

                  <!-- 角色信息 -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-white">{{ agent.name }}</span>
                      <fa
                        v-if="selectedAgent === agent.id"
                        :icon="['fas', 'check-circle']"
                        class="text-green-500 text-sm"
                      />
                    </div>
                    <p class="text-xs text-gray-400">AI 智能助手</p>
                  </div>
                </button>
              </div>
            </div>
          </transition>

          <!-- 模型菜单背景遮罩 -->
          <div
            v-if="showModelMenu"
            @click="showModelMenu = false"
            class="fixed inset-0 z-40"
          ></div>

          <!-- 模型菜单弹窗 (在输入框外部) -->
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-150 ease-in"
            enter-from-class="opacity-0 scale-95 translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-2"
          >
            <div
              v-if="showModelMenu"
              @click.stop
              class="absolute bottom-full right-0 mb-2 w-96 bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50"
            >
              <!-- 菜单头部 -->
              <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 class="text-base font-bold text-white">模型偏好</h3>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-gray-400">自动</span>
                  <button
                    @click.stop="autoSwitch = !autoSwitch"
                    :class="[
                      'relative w-11 h-6 rounded-full transition-colors duration-200',
                      autoSwitch ? 'bg-green-500' : 'bg-gray-600'
                    ]"
                  >
                    <span
                      :class="[
                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
                        autoSwitch ? 'translate-x-5' : 'translate-x-0'
                      ]"
                    ></span>
                  </button>
                </div>
              </div>

              <!-- 分类标签 -->
              <div class="px-5 pt-4 pb-3">
                <div class="flex gap-2 bg-white/5 rounded-xl p-1">
                  <button
                    @click="modelCategory = 'text'"
                    :class="[
                      'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition',
                      modelCategory === 'text'
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    ]"
                  >
                    Text
                  </button>
                  <button
                    @click="modelCategory = 'image'"
                    :class="[
                      'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition',
                      modelCategory === 'image'
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    ]"
                  >
                    Image
                  </button>
                  <button
                    @click="modelCategory = 'video'"
                    :class="[
                      'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition',
                      modelCategory === 'video'
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    ]"
                  >
                    Video
                  </button>
                  <button
                    @click="modelCategory = '3d'"
                    :class="[
                      'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition',
                      modelCategory === '3d'
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    ]"
                  >
                    3D
                  </button>
                </div>
              </div>

              <!-- 模型列表 -->
              <div class="max-h-80 overflow-y-auto px-5 pb-4">
                <div class="space-y-2">
                  <button
                    v-for="model in currentModels"
                    :key="model.id"
                    @click.stop="selectModel(model)"
                    class="w-full p-3 rounded-xl transition flex items-start gap-3 text-left hover:bg-white/5 relative group"
                  >
                    <!-- 模型图标 -->
                    <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <fa :icon="['fas', 'cube']" class="text-gray-300 text-lg" />
                    </div>

                    <!-- 模型信息 -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-0.5">
                        <span class="font-semibold text-white text-sm">{{ model.name }}</span>
                      </div>
                      <p class="text-xs text-gray-400 mb-1.5">{{ model.description }}</p>
                      <div class="inline-flex items-center px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400">
                        {{ model.speed }}
                      </div>
                    </div>

                    <!-- 选中状态 -->
                    <div
                      v-if="selectedModel === model.id"
                      class="flex-shrink-0 w-6 h-6 bg-white/90 rounded-md flex items-center justify-center"
                    >
                      <fa :icon="['fas', 'check']" class="text-gray-900 text-xs" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </transition>

          <!-- 快捷模板 -->
          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              v-for="(template, index) in templates"
              :key="index"
              @click="useTemplate(template)"
              class="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/10 transition flex items-center gap-2 text-sm"
            >
              <fa :icon="['fas', template.icon]" />
              {{ template.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 对话区域 -->
      <div v-else class="w-full max-w-4xl mx-auto space-y-6">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="[
            'flex gap-4',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            v-if="message.role === 'assistant'"
            class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <fa :icon="['fas', 'robot']" />
          </div>
          <div
            :class="[
              'max-w-2xl px-6 py-4 rounded-2xl',
              message.role === 'user'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/5 backdrop-blur-xl border border-white/10'
            ]"
          >
            <p class="text-base leading-relaxed">{{ message.content }}</p>
            <span class="text-xs text-gray-400 mt-2 block">
              {{ message.timestamp.toLocaleTimeString() }}
            </span>
          </div>
          <div
            v-if="message.role === 'user'"
            class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <fa :icon="['fas', 'user']" />
          </div>
        </div>

        <!-- 输入框（对话模式） - 仅在未显示侧边栏时显示 -->
        <div v-if="!showSidebar" class="sticky bottom-8">
          <div class="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div class="flex items-center gap-3 p-4">
              <input
                v-model="agentInput"
                @keyup.enter="handleSubmit"
                type="text"
                placeholder="继续对话..."
                class="flex-1 bg-transparent outline-none text-lg placeholder-gray-400"
              />
              <button
                @click="handleSubmit"
                :disabled="!agentInput.trim() || isProcessing"
                class="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition disabled:opacity-50"
              >
                <fa :icon="isProcessing ? ['fas', 'circle-notch'] : ['fas', 'paper-plane']" :class="{'animate-spin': isProcessing}" />
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- 右侧侧边栏 -->
      <transition
        enter-active-class="transition-all duration-700 ease-in-out"
        leave-active-class="transition-all duration-700 ease-in-out"
        enter-from-class="opacity-0 translate-x-full"
        enter-to-class="opacity-100 translate-x-0"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-full"
      >
        <aside v-if="showSidebar" class="w-1/3 flex flex-col h-[calc(100vh-120px)]">
          <!-- 上部内容区域（可滚动） -->
          <div class="flex-1 bg-white/5 backdrop-blur-xl rounded-t-2xl border border-white/10 border-b-0 p-6 overflow-y-auto">
            <!-- 侧边栏头部 -->
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <fa :icon="['fas', 'robot']" class="text-2xl" />
              </div>
              <div>
                <h3 class="text-lg font-bold">Hi，我是你的AI设计师</h3>
                <p class="text-sm text-gray-400">让我们开始今天的创作吧！</p>
              </div>
            </div>

            <!-- 示例项目卡片 -->
            <div class="space-y-4">
              <div class="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer">
                <div class="flex items-start gap-3">
                  <div class="flex-1">
                    <h4 class="font-semibold mb-1">Wine List</h4>
                    <p class="text-xs text-gray-400">Mimic this effect to generate a poster of ...</p>
                  </div>
                  <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex-shrink-0"></div>
                </div>
              </div>

              <div class="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer">
                <div class="flex items-start gap-3">
                  <div class="flex-1">
                    <h4 class="font-semibold mb-1">Coffee Shop Branding</h4>
                    <p class="text-xs text-gray-400">you are a brand design expert, generate ...</p>
                  </div>
                  <div class="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex-shrink-0"></div>
                </div>
              </div>

              <div class="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer">
                <div class="flex items-start gap-3">
                  <div class="flex-1">
                    <h4 class="font-semibold mb-1">Story Board</h4>
                    <p class="text-xs text-gray-400">I NEED A STORY BOARD FOR THIS SCRI...</p>
                  </div>
                  <div class="w-20 h-20 bg-gradient-to-br from-yellow-500 to-green-500 rounded-lg flex-shrink-0"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部输入框区域（固定） -->
          <div class="bg-white/5 backdrop-blur-xl rounded-b-2xl border border-white/10 border-t-0 p-2">
            <!-- 输入框容器 -->
            <div class="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <textarea
                placeholder="请输入你的设计需求"
                rows="4"
                class="w-full px-4 pt-3 pb-2 bg-transparent outline-none focus:border-purple-500 transition resize-none"
              ></textarea>

              <!-- 底部操作图标栏（在输入框内部） -->
              <div class="flex items-center justify-between px-3 pb-3 pt-2">
                <!-- 左侧图标组 -->
                <div class="flex items-center gap-2">
                  <button class="w-9 h-9 rounded-full border border-white/10 hover:bg-white/5 transition flex items-center justify-center" title="上传附件">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <button class="w-9 h-9 rounded-full border border-white/10 hover:bg-white/5 transition flex items-center justify-center" title="提及">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </button>
                </div>

                <!-- 右侧图标组 -->
                <div class="flex items-center gap-2">
                  <button class="px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition flex items-center justify-center" title="灵感">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>
                  <button class="w-9 h-9 rounded-full border border-white/10 hover:bg-white/5 transition flex items-center justify-center" title="快速生成">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                  <button class="w-9 h-9 rounded-full border border-white/10 hover:bg-white/5 transition flex items-center justify-center" title="全球">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button class="w-9 h-9 rounded-full border border-white/10 hover:bg-white/5 transition flex items-center justify-center bg-blue-500/20 border-blue-500/50" title="模型">
                    <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </button>
                  <button class="w-9 h-9 rounded-full bg-gray-600 hover:bg-gray-500 transition flex items-center justify-center" title="发送">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </transition>
    </main>
  </div>
</template>

<style scoped>
.bg-grid-pattern {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}

@keyframes gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-gradient {
  background-size: 200% auto;
  animation: gradient 3s ease infinite;
}

/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.overflow-y-auto {
  scrollbar-width: thin;  /* Firefox */
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;  /* Firefox */
}
</style>
