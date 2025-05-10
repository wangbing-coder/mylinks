<template>
  <div class="min-h-screen bg-white dark:bg-black flex flex-col">
    <header class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold text-black dark:text-white">datetime.app</h1>
    </header>
    
    <main class="container mx-auto px-4 flex-grow flex flex-col items-center justify-center">
      <div class="text-center">
        <div class="mb-8">
          <h2 class="text-xl md:text-2xl font-medium text-black dark:text-white mb-2">当前时间</h2>
          <div class="time-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-black dark:text-white font-mono">
            {{ formattedTime }}
          </div>
          <div class="text-xl md:text-2xl font-medium text-black dark:text-white mt-2">
            {{ formattedDate }}
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-3xl mx-auto">
          <div class="border border-gray-200 dark:border-gray-800 p-4">
            <h3 class="text-lg font-medium text-black dark:text-white mb-2">时区信息</h3>
            <p class="text-black dark:text-white">{{ timezoneInfo }}</p>
          </div>
          
          <div class="border border-gray-200 dark:border-gray-800 p-4">
            <h3 class="text-lg font-medium text-black dark:text-white mb-2">Unix 时间戳</h3>
            <p class="text-black dark:text-white font-mono">{{ timestamp }}</p>
          </div>
          
          <div class="border border-gray-200 dark:border-gray-800 p-4">
            <h3 class="text-lg font-medium text-black dark:text-white mb-2">UTC 时间</h3>
            <p class="text-black dark:text-white font-mono">{{ utcTime }}</p>
          </div>
          
          <div class="border border-gray-200 dark:border-gray-800 p-4">
            <h3 class="text-lg font-medium text-black dark:text-white mb-2">ISO 格式</h3>
            <p class="text-black dark:text-white font-mono">{{ isoTime }}</p>
          </div>
        </div>
      </div>
    </main>
    
    <footer class="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
      <p>© {{ new Date().getFullYear() }} datetime.app - 精确的世界时间</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useHead } from '@vueuse/head'

// SEO 元数据
useHead({
  title: 'datetime.app - 精确的世界时间',
  meta: [
    { name: 'description', content: '获取精确的世界时间、日期和时区信息。datetime.app 提供准确的时间显示，包括多种格式和时区转换。' },
    { name: 'keywords', content: '时间, 日期, 世界时间, 时区, 时间转换, 精确时间' },
    { property: 'og:title', content: 'datetime.app - 精确的世界时间' },
    { property: 'og:description', content: '获取精确的世界时间、日期和时区信息。' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://datetime.app' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'datetime.app - 精确的世界时间' },
    { name: 'twitter:description', content: '获取精确的世界时间、日期和时区信息。' },
  ],
  link: [
    { rel: 'canonical', href: 'https://datetime.app' }
  ]
})

// 响应式数据
const now = ref(new Date())
const formattedTime = ref('')
const formattedDate = ref('')
const timezoneInfo = ref('')
const timestamp = ref(0)
const utcTime = ref('')
const isoTime = ref('')
let timer = null

// 格式化时间函数
const formatTime = () => {
  now.value = new Date()
  
  // 格式化时间 (HH:MM:SS)
  const hours = now.value.getHours().toString().padStart(2, '0')
  const minutes = now.value.getMinutes().toString().padStart(2, '0')
  const seconds = now.value.getSeconds().toString().padStart(2, '0')
  formattedTime.value = `${hours}:${minutes}:${seconds}`
  
  // 格式化日期
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  formattedDate.value = now.value.toLocaleDateString('zh-CN', options)
  
  // 时区信息
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const offset = -(now.value.getTimezoneOffset() / 60)
  const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`
  timezoneInfo.value = `${timezone} (GMT${offsetStr})`
  
  // Unix 时间戳
  timestamp.value = Math.floor(now.value.getTime() / 1000)
  
  // UTC 时间
  utcTime.value = now.value.toUTCString()
  
  // ISO 格式
  isoTime.value = now.value.toISOString()
}

// 生命周期钩子
onMounted(() => {
  formatTime()
  // 每秒更新一次时间
  timer = setInterval(formatTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style>
.time-display {
  line-height: 1;
  letter-spacing: -0.02em;
}

/* 确保数字字体清晰可读 */
@font-face {
  font-family: 'Inter';
  src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
}

html {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
