<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = route.query.id

const activeTab = ref('script')
const tabs = [
  { id: 'script', label: '剧本创作', icon: 'book' },
  { id: 'characters', label: '角色一致性', icon: 'users' },
  { id: 'storyboard', label: '分镜生成', icon: 'clapperboard' },
  { id: 'video', label: '视频生成', icon: 'video' }
]

const scriptContent = ref('')
const characters = ref([
  { id: 1, name: '顾北辰', role: '男主角', desc: '霸道总裁，冷酷深情', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 2, name: '苏晚晚', role: '女主角', desc: '坚韧乐观，设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' }
])

const storyboards = ref([
  { id: 1, desc: '顾北辰坐在办公室，眉头紧锁', img: 'https://placehold.co/300x200/333/FFF?text=Scene+1' },
  { id: 2, desc: '苏晚晚推门而入，神色慌张', img: 'https://placehold.co/300x200/444/FFF?text=Scene+2' },
  { id: 3, desc: '两人对视，气氛凝固', img: 'https://placehold.co/300x200/555/FFF?text=Scene+3' }
])

const theme = ref('light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

onMounted(() => {
  // Initialize theme based on system or storage if needed
})
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50 dark:bg-[#1C1C1E] text-primary dark:text-white overflow-hidden">
    <!-- Header -->
    <header class="h-14 bg-white dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-[#3A3A3C] flex items-center justify-between px-4 shrink-0">
      <div class="flex items-center gap-4">
        <router-link to="/workspace" class="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white transition">
          <fa :icon="['fas', 'arrow-left']" />
        </router-link>
        <div class="flex flex-col">
          <h1 class="text-sm font-bold flex items-center gap-2">
            霸道总裁爱上我
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">剧本创作中</span>
          </h1>
          <span class="text-xs text-secondary dark:text-gray-500">上次保存: 10分钟前</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-brand-green to-emerald-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm">
          <fa :icon="['fas', 'wand-magic-sparkles']" />
          AI Copilot
        </button>
        <div class="h-6 w-px bg-gray-200 dark:bg-[#3A3A3C]"></div>
        <button class="p-2 text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white transition" @click="toggleTheme">
          <fa :icon="['fas', theme === 'dark' ? 'sun' : 'moon']" />
        </button>
        <button class="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm font-medium hover:opacity-80 transition">
          导出
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white dark:bg-[#2C2C2E] border-r border-gray-200 dark:border-[#3A3A3C] flex flex-col shrink-0">
        <nav class="p-2 space-y-1">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="activeTab === tab.id 
              ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20' 
              : 'text-secondary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#3A3A3C]'"
          >
            <fa :icon="['fas', tab.icon]" class="w-4" />
            {{ tab.label }}
          </button>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1C1C1E] p-6">
        <!-- Script View -->
        <div v-if="activeTab === 'script'" class="max-w-4xl mx-auto bg-white dark:bg-[#2C2C2E] rounded-xl shadow-sm border border-gray-200 dark:border-[#3A3A3C] min-h-[800px] p-8">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-lg font-bold">第一集：初遇</h2>
            <button class="text-sm text-brand-green hover:underline">
              <fa :icon="['fas', 'magic']" class="mr-1" /> AI 续写
            </button>
          </div>
          <textarea 
            v-model="scriptContent"
            class="w-full h-full min-h-[600px] resize-none outline-none bg-transparent text-lg leading-relaxed text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
            placeholder="在此处开始创作剧本...&#10;例如：&#10;[场景] 豪华办公室，白天&#10;[人物] 顾北辰，苏晚晚&#10;顾北辰：（冷冷地）这份设计稿重做。"
          ></textarea>
        </div>

        <!-- Characters View -->
        <div v-else-if="activeTab === 'characters'" class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold">角色管理</h2>
            <button class="px-4 py-2 bg-brand-green text-white rounded-lg text-sm hover:bg-brand-green-dark transition">
              <fa :icon="['fas', 'plus']" class="mr-2" /> 新建角色
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="char in characters" :key="char.id" class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden hover:shadow-md transition">
              <div class="aspect-square bg-gray-100 dark:bg-[#3A3A3C] relative group">
                <img :src="char.avatar" class="w-full h-full object-cover" :alt="char.name">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button class="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition"><fa :icon="['fas', 'pen']" /></button>
                  <button class="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition"><fa :icon="['fas', 'trash']" /></button>
                </div>
              </div>
              <div class="p-4">
                <h3 class="font-bold text-lg">{{ char.name }}</h3>
                <p class="text-sm text-brand-green font-medium mb-2">{{ char.role }}</p>
                <p class="text-sm text-secondary dark:text-gray-400 line-clamp-2">{{ char.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Storyboard View -->
        <div v-else-if="activeTab === 'storyboard'" class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold">分镜预览</h2>
            <div class="flex gap-2">
              <button class="px-4 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition">
                重新生成
              </button>
              <button class="px-4 py-2 bg-brand-green text-white rounded-lg text-sm hover:bg-brand-green-dark transition">
                导出分镜表
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="shot in storyboards" :key="shot.id" class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-4">
              <div class="aspect-video bg-gray-100 dark:bg-[#3A3A3C] rounded-lg mb-4 overflow-hidden">
                <img :src="shot.img" class="w-full h-full object-cover" alt="Storyboard">
              </div>
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-[#3A3A3C] rounded text-xs font-bold flex items-center justify-center text-secondary">
                  {{ shot.id }}
                </span>
                <p class="text-sm text-primary dark:text-gray-200">{{ shot.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Video View -->
        <div v-else-if="activeTab === 'video'" class="h-full flex flex-col items-center justify-center text-center">
          <div class="w-24 h-24 bg-gray-100 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mb-6">
            <fa :icon="['fas', 'film']" class="text-4xl text-gray-300 dark:text-gray-600" />
          </div>
          <h3 class="text-xl font-bold mb-2">视频生成中</h3>
          <p class="text-secondary dark:text-gray-400 max-w-md mb-8">
            AI 正在根据分镜脚本生成视频片段，预计需要 5-10 分钟，请稍候...
          </p>
          <div class="w-64 h-2 bg-gray-200 dark:bg-[#3A3A3C] rounded-full overflow-hidden">
            <div class="h-full bg-brand-green w-1/3 animate-pulse"></div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for script editor */
textarea::-webkit-scrollbar {
  width: 8px;
}
textarea::-webkit-scrollbar-track {
  background: transparent;
}
textarea::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}
textarea::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}
</style>
