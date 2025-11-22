<script setup>
import { ref, onMounted, nextTick } from 'vue'
const rightPane = ref('properties')
const messages = ref([
  { role: 'assistant', text: '你好，我是 AI 设计助手。描述你的目标，我来帮你在画布上实现。' }
])
const chatInput = ref('')
const sending = ref(false)
const fileInput = ref(null)
const onPickFile = () => fileInput.value && fileInput.value.click()
const onFileSelected = (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  messages.value.push({ role: 'user', text: `[上传图片] ${f.name}` })
  e.target.value = ''
}
const send = async () => {
  const text = chatInput.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', text })
  chatInput.value = ''
  sending.value = true
  await new Promise(r => setTimeout(r, 500))
  messages.value.push({ role: 'assistant', text: '已收到：' + text })
  sending.value = false
}
const theme = ref(typeof localStorage !== 'undefined' ? localStorage.getItem('theme') || 'light' : 'light')
const applyTheme = () => {
  const root = document.documentElement
  if (theme.value === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}
onMounted(() => { applyTheme(); nextTick(autoResize) })
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', theme.value)
  applyTheme()
}
const activeFilename = ref(false)
const chatInputEl = ref(null)
const autoResize = () => {
  const el = chatInputEl.value
  if (!el) return
  el.style.height = 'auto'
  const lh = parseFloat(getComputedStyle(el).lineHeight) || 24
  const max = lh * 8
  const newH = Math.min(el.scrollHeight, max)
  el.style.height = newH + 'px'
  el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
}
</script>
<template>
  <div class="bg-white text-primary h-screen flex flex-col dark:bg-[#1C1C1E] dark:text-white">
    <header class="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
      <div class="flex items-center space-x-4 w-1/4">
        <router-link to="/workspace" class="text-brand-green text-xl hover:opacity-80 transition">
          <fa :icon="['fas','cubes']" />
        </router-link>
        <button class="text-primary dark:text-gray-300 hover:bg-light-gray dark:hover:bg-[#3A3A3C] p-2 rounded-md transition">
          <fa :icon="['fas','bars']" />
        </button>
        <div class="flex items-center text-sm truncate">
          <span class="text-secondary hidden xl:inline">我的项目 / 电商App ></span>
          <span @click="activeFilename = !activeFilename" class="font-semibold ml-1 cursor-pointer px-2 py-1 rounded" :class="activeFilename ? 'bg-white text-black dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-[#3A3A3C]'">首页设计</span>
          <fa :icon="['fas','cloud']" class="text-brand-green ml-2 text-xs" />
        </div>
      </div>
      <div class="flex items-center justify-center space-x-1 bg-light-gray p-1 rounded-lg dark:bg-[#1C1C1E] dark:border dark:border-[#3A3A3C]">
        <button class="p-2 rounded transition w-9 h-9 flex items-center justify-center bg-white hover:bg-gray-100 text-brand-green dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C]">
          <fa :icon="['fas','mouse-pointer']" class="text-xs" />
        </button>
        <button class="p-2 rounded transition w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3A3A3C] text-primary dark:text-gray-300">
          <fa :icon="['fas','font']" class="text-xs" />
        </button>
        <button class="p-2 rounded transition w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3A3A3C] text-primary dark:text-gray-300">
          <fa :icon="['fas','square']" class="text-xs" />
          <fa :icon="['fas','chevron-down']" class="text-[8px] ml-1 text-gray-400 dark:text-gray-500" />
        </button>
        <button class="p-2 rounded transition w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3A3A3C] text-primary dark:text-gray-300">
          <fa :icon="['fas','crop']" class="text-xs" />
        </button>
        <button class="p-2 rounded transition w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3A3A3C] text-primary dark:text-gray-300">
          <fa :icon="['fas','pen-nib']" class="text-xs" />
        </button>
      </div>
      <div class="flex items-center justify-end space-x-3 w-1/4">
        <button class="text-xs font-medium text-secondary hover:text-brand-green mr-2">EN / 中</button>
        
        <button class="text-secondary hover:text-brand-green" @click="toggleTheme">
          <fa :icon="['fas', theme==='dark' ? 'sun' : 'moon']" />
        </button>
        <div class="h-6 w-px bg-gray-200 mx-2"></div>
        <button class="text-secondary hover:text-brand-green transition"><fa :icon="['fas','play']" /></button>
        <button class="bg-black text-white px-4 py-1.5 rounded-md text-sm hover:bg-brand-green transition">Share</button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
        <div class="flex border-b border-gray-200 dark:border-[#3A3A3C]">
          <button @click="leftTab='pages'" class="flex-1 py-3 text-xs font-semibold" :class="leftTab==='pages' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'">页面</button>
          <button @click="leftTab='layers'" class="flex-1 py-3 text-xs font-semibold" :class="leftTab==='layers' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'">图层</button>
          <button @click="leftTab='assets'" class="flex-1 py-3 text-xs font-semibold" :class="leftTab==='assets' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'">资产</button>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1" v-if="leftTab==='pages'">
          <div class="flex items-center px-2 py-2 bg-light-gray rounded text-sm font-medium text-primary cursor-pointer dark:bg-[#1C1C1E] dark:text-white dark:border dark:border-[#3A3A3C]">
            <fa :icon="['fas','file']" class="text-secondary mr-2 dark:text-gray-500" /> 首页
          </div>
          <div class="flex items-center px-2 py-2 hover:bg-gray-50 rounded text-sm text-secondary cursor-pointer dark:text-gray-400 dark:hover:bg-[#3A3A3C]">
            <fa :icon="['fas','file']" class="text-gray-400 mr-2 dark:text-gray-500" /> 商品详情页
          </div>
          <div class="flex items-center px-2 py-2 hover:bg-gray-50 rounded text-sm text-secondary cursor-pointer dark:text-gray-400 dark:hover:bg-[#3A3A3C]">
            <fa :icon="['fas','file']" class="text-gray-400 mr-2 dark:text-gray-500" /> 结账页
          </div>
        </div>
        <div class="p-3 border-t border-gray-200 dark:border-[#3A3A3C]" v-if="leftTab==='pages'">
          <button class="w-full flex items-center justify-center py-2 text-sm text-secondary hover:bg-light-gray rounded border border-dashed border-gray-200 transition dark:text-gray-400 dark:hover:bg-[#1C1C1E] dark:border-[#3A3A3C]">
            <fa :icon="['fas','plus']" class="mr-2" /> 新建页面
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2" v-else-if="leftTab==='assets'">
          <div class="text-xs text-secondary mb-2 dark:text-gray-400">组件库</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('button', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">按钮</div>
              <div class="bg-brand-green text-white text-xs font-semibold px-3 py-2 rounded">主按钮</div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('card', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">卡片</div>
              <div class="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded p-2">
                <div class="h-16 bg-light-gray dark:bg-[#1C1C1E] rounded"></div>
                <div class="mt-2 h-3 bg-light-gray dark:bg-[#1C1C1E] rounded w-2/3"></div>
              </div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('input', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">输入框</div>
              <div class="border border-gray-300 dark:border-[#3A3A3C] rounded px-3 py-2 text-xs text-secondary dark:text-gray-400">占位符</div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('avatar', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">头像</div>
              <div class="w-10 h-10 rounded-full bg-light-gray dark:bg-[#3A3A3C]"></div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('rect', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">矩形</div>
              <div class="w-16 h-10 bg-white dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#3A3A3C] rounded"></div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('circle', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">圆形</div>
              <div class="w-10 h-10 bg-white dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#3A3A3C] rounded-full"></div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('text', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">文本</div>
              <div class="text-xs text-secondary dark:text-gray-400">Aa 文本示例</div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('image', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">图片</div>
              <div class="w-16 h-10 bg-light-gray dark:bg-[#1C1C1E] rounded"></div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('checkbox', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">复选框</div>
              <div class="flex items-center space-x-2 text-xs text-secondary dark:text-gray-400"><div class="w-3.5 h-3.5 border border-gray-400 rounded-sm"></div><span>选项</span></div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('dropdown', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">下拉菜单</div>
              <div class="w-24 h-8 border border-gray-300 dark:border-[#3A3A3C] rounded px-2 flex items-center justify-between text-xs text-secondary dark:text-gray-400"><span>选项</span><fa :icon="['fas','chevron-down']" /></div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('navbar', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">导航栏</div>
              <div class="w-32 h-6 bg-gray-800 rounded flex items-center justify-between px-2"><div class="flex space-x-1"><div class="w-2 h-2 bg-gray-400 rounded-full"></div><div class="w-2 h-2 bg-gray-400 rounded-full"></div><div class="w-2 h-2 bg-gray-400 rounded-full"></div></div><span class="text-white text-[10px]">导航</span></div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('tabs', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">标签页</div>
              <div class="flex text-[10px]"><div class="flex-1 bg-brand-green text-white text-center rounded-t py-1">标签1</div><div class="flex-1 bg-gray-200 text-center rounded-t py-1">标签2</div></div>
            </div>
            <div class="bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C] border border-gray-200 rounded p-3 cursor-grab" draggable="true" @dragstart="onAssetDragStart('grid', $event)">
              <div class="text-xs text-secondary mb-2 dark:text-gray-400">栅格</div>
              <div class="w-16 h-16 grid grid-cols-2 gap-1"><div class="bg-light-gray dark:bg-[#3A3A3C] rounded"></div><div class="bg-light-gray dark:bg-[#3A3A3C] rounded"></div><div class="bg-light-gray dark:bg-[#3A3A3C] rounded"></div><div class="bg-light-gray dark:bg-[#3A3A3C] rounded"></div></div>
            </div>
          </div>
        </div>
      </aside>

      <main class="flex-1 relative flex flex-col overflow-hidden" :style="theme==='dark' ? 'background-color:#151516;background-image:radial-gradient(#333333 1.5px, transparent 1.5px);background-size:24px 24px;' : 'background-color:#F9FAFB;background-image:radial-gradient(#D1D5DB 1.5px, transparent 1.5px);background-size:24px 24px;'" @dragover.prevent @drop="onCanvasDrop">
        <div class="absolute top-4 left-4 text-xs text-gray-400 font-mono">Artboard: Desktop 1440px</div>
        <div class="absolute top-4 right-4 bg-white shadow-sm border border-gray-200 rounded-md flex items-center px-2 py-1 space-x-2 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
          <button class="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas','minus']" /></button>
          <span class="text-xs font-medium min-w-[30px] text-center">100%</span>
          <button class="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas','plus']" /></button>
        </div>
        <div class="absolute inset-0" style="pointer-events:none">
          <div v-for="c in placed" :key="c.id" :style="{left: c.x+'px', top: c.y+'px'}" class="absolute">
            <div v-if="c.type==='button'" class="bg-brand-green text-white text-xs font-semibold px-3 py-2 rounded">按钮</div>
            <div v-else-if="c.type==='card'" class="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded p-3 w-40">
              <div class="h-16 bg-light-gray dark:bg-[#1C1C1E] rounded"></div>
              <div class="mt-2 h-3 bg-light-gray dark:bg-[#1C1C1E] rounded w-3/4"></div>
            </div>
            <div v-else-if="c.type==='input'" class="border border-gray-300 dark:border-[#3A3A3C] rounded px-3 py-2 text-xs bg-white dark:bg-[#1C1C1E] w-40 text-secondary dark:text-gray-400">占位符</div>
            <div v-else-if="c.type==='avatar'" class="w-10 h-10 rounded-full bg-light-gray dark:bg-[#3A3A3C]"></div>
            <div v-else-if="c.type==='rect'" class="w-24 h-16 bg-white dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#3A3A3C] rounded"></div>
            <div v-else-if="c.type==='circle'" class="w-12 h-12 bg-white dark:bg-[#2C2C2E] border border-gray-300 dark:border-[#3A3A3C] rounded-full"></div>
            <div v-else-if="c.type==='text'" class="text-xs text-primary dark:text-white">示例文本</div>
            <div v-else-if="c.type==='image'" class="w-32 h-20 bg-light-gray dark:bg-[#1C1C1E] rounded"></div>
            <div v-else-if="c.type==='checkbox'" class="flex items-center space-x-2 text-xs text-secondary dark:text-gray-400"><div class="w-3.5 h-3.5 border border-gray-400 rounded-sm"></div><span>选项</span></div>
            <div v-else-if="c.type==='dropdown'" class="w-28 h-8 border border-gray-300 dark:border-[#3A3A3C] rounded px-2 flex items-center justify-between text-xs bg-white dark:bg-[#1C1C1E] text-secondary dark:text-gray-400"><span>选项</span><fa :icon="['fas','chevron-down']" /></div>
            <div v-else-if="c.type==='navbar'" class="w-48 h-8 bg-gray-800 rounded flex items-center justify-between px-2"><div class="flex space-x-1"><div class="w-3 h-3 bg-gray-400 rounded-full"></div><div class="w-3 h-3 bg-gray-400 rounded-full"></div><div class="w-3 h-3 bg-gray-400 rounded-full"></div></div><span class="text-white text-xs">导航</span></div>
            <div v-else-if="c.type==='tabs'" class="flex w-40 text-xs"><div class="flex-1 bg-brand-green text-white text-center rounded-t py-1">标签1</div><div class="flex-1 bg-gray-200 text-center rounded-t py-1">标签2</div></div>
            <div v-else-if="c.type==='grid'" class="w-24 h-24 grid grid-cols-2 gap-1"><div class="bg-light-gray dark:bg-[#3A3A3C] rounded"></div><div class="bg-light-gray dark:bg-[#3A3A3C] rounded"></div><div class="bg-light-gray dark:bg-[#3A3A3C] rounded"></div><div class="bg-light-gray dark:bg-[#3A3A3C] rounded"></div></div>
          </div>
        </div>
      </main>

      <aside class="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
        <div v-if="rightPane==='properties'">
        <div class="flex border-b border-gray-200 dark:border-[#3A3A3C]">
          <button class="flex-1 py-3 text-xs font-semibold text-primary border-b-2 border-primary dark:text-white dark:border-[#3A3A3C]">设计</button>
          <button class="flex-1 py-3 text-xs font-semibold text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">交互</button>
          <button class="flex-1 py-3 text-xs font-semibold text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">评论</button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div class="flex justify-between mb-2 text-secondary dark:text-gray-400">
              <button class="hover:text-black dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas','align-left']" /></button>
              <button class="hover:text-black dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas','align-center']" /></button>
              <button class="hover:text-black dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas','align-right']" /></button>
              <span class="border-r border-gray-200 mx-1 dark:border-[#3A3A3C]"></span>
              <button class="hover:text-black dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas','align-justify']" /></button>
              <button class="hover:text-black dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas','grip-lines']" /></button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center bg-white border border-gray-200 rounded px-2 hover:border-brand-green group dark:bg-[#1C1C1E] dark:border-[#3A3A3C]">
              <span class="text-xs text-gray-400 mr-2 group-hover:text-brand-green dark:text-white">X</span>
              <input type="text" value="0" class="w-full py-1.5 text-sm outline-none text-right dark:bg-transparent dark:text-white">
            </div>
            <div class="flex items-center bg-white border border-gray-200 rounded px-2 hover:border-brand-green group dark:bg-[#1C1C1E] dark:border-[#3A3A3C]">
              <span class="text-xs text-gray-400 mr-2 group-hover:text-brand-green dark:text-white">Y</span>
              <input type="text" value="0" class="w-full py-1.5 text-sm outline-none text-right dark:bg-transparent dark:text-white">
            </div>
            <div class="flex items-center bg-white border border-gray-200 rounded px-2 hover:border-brand-green group dark:bg-[#1C1C1E] dark:border-[#3A3A3C]">
              <span class="text-xs text-gray-400 mr-2 group-hover:text-brand-green dark:text-white">W</span>
              <input type="text" value="1440" class="w-full py-1.5 text-sm outline-none text-right dark:bg-transparent dark:text-white">
            </div>
            <div class="flex items-center bg-white border border-gray-200 rounded px-2 hover:border-brand-green group dark:bg-[#1C1C1E] dark:border-[#3A3A3C]">
              <span class="text-xs text-gray-400 mr-2 group-hover:text-brand-green dark:text-white">H</span>
              <input type="text" value="900" class="w-full py-1.5 text-sm outline-none text-right dark:bg-transparent dark:text-white">
            </div>
          </div>
          <div class="border-t border-gray-200 pt-4 dark:border-[#3A3A3C]">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-bold text-primary dark:text-white">填充</span>
              <button class="text-brand-green text-xs p-1 rounded"><fa :icon="['fas','wand-magic-sparkles']" /></button>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-white border border-gray-300 rounded shadow-sm dark:bg-[#1C1C1E] dark:border-[#3A3A3C]"></div>
              <input type="text" value="#FFFFFF" class="flex-1 border border-gray-200 rounded px-2 py-1 text-sm text-primary uppercase dark:bg-[#1C1C1E] dark:border-[#3A3A3C] dark:text-white">
              <span class="text-xs text-gray-400 dark:text-gray-500">100%</span>
            </div>
          </div>
          <div class="border-t border-gray-200 pt-4 dark:border-[#3A3A3C]">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-bold text-primary dark:text-white">交互动作</span>
              <button class="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas','plus']" /></button>
            </div>
            <div class="bg-light-gray rounded p-3 border border-dashed border-gray-200 text-center cursor-pointer hover:border-brand-green transition dark:bg-[#1C1C1E] dark:border-[#3A3A3C]">
              <fa :icon="['fas','bolt']" class="text-gray-400 mb-1 dark:text-gray-500" />
              <p class="text-xs text-secondary dark:text-gray-500">选中元素添加交互，或向 AI 提问。</p>
            </div>
          </div>
        </div>
        </div>
        <div v-else class="flex flex-col h-full">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-[#3A3A3C]">
            <span class="text-sm font-semibold dark:text-white">AI 对话助手</span>
            <button class="text-secondary hover:text-primary text-sm dark:text-gray-400 dark:hover:text-white" @click="rightPane='properties'">返回属性</button>
          </div>
          <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
            <div v-for="(m,i) in messages" :key="i" class="flex" :class="m.role==='user' ? 'justify-end' : 'justify-start'">
              <div class="max-w-[80%] px-3 py-2 rounded-lg whitespace-pre-wrap break-all" :class="m.role==='user' ? 'bg-brand-green text-white' : 'bg-light-gray text-primary dark:bg-[#1C1C1E] dark:text-[#E0E0E0]'">
                {{ m.text }}
              </div>
            </div>
          </div>
          <div class="border-t border-gray-200 p-3 dark:border-[#3A3A3C]">
            <div class="flex items-center gap-2">
              <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="onFileSelected" />
              <div class="relative flex-1">
                <fa :icon="['fas','images']" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 cursor-pointer" @click="onPickFile" />
                <textarea ref="chatInputEl" v-model="chatInput" rows="2" @input="autoResize" class="w-full border border-gray-300 rounded-lg pl-9 pr-12 px-3 py-2 focus:outline-none focus:ring-2 ring-brand-green dark:bg-[#1C1C1E] dark:border-[#3A3A3C] dark:text-white dark:placeholder-gray-500 whitespace-pre-wrap break-words leading-6 max-h-[12rem] overflow-y-auto resize-none no-scrollbar" placeholder="描述你的设计意图…"></textarea>
                <button :disabled="sending || !chatInput.trim()" @click="send" aria-label="发送" class="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-green text-white px-3 py-2 rounded-lg hover:bg-brand-green-dark disabled:opacity-50">
                  <fa :icon="['fas','paper-plane']" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
const leftTab = ref('pages')
const placed = ref([])
const onAssetDragStart = (type, e) => {
  e.dataTransfer.setData('text/plain', type)
}
const onCanvasDrop = (e) => {
  const type = e.dataTransfer.getData('text/plain')
  if (!type) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  placed.value.push({ id: Date.now()+Math.random(), type, x, y })
}
