<template>
  <div class="forum-page" ref="forumContainer">
    <!-- 秋日背景 -->
    <div class="autumn-background">
      <div class="leaf leaf-1">🍂</div>
      <div class="leaf leaf-2">🍁</div>
      <div class="leaf leaf-3">🍂</div>
      <div class="leaf leaf-4">🍁</div>
      <div class="leaf leaf-5">🍂</div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadMessages" class="btn-primary">
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- 气泡容器 -->
    <div v-else class="bubbles-container" ref="bubblesContainer" :style="{ height: bubblesContainerHeight + 'px' }">
      <div
        v-for="(bubble, index) in bubbles"
        :key="bubble.id"
        class="bubble"
        :class="`bubble-${index}`"
        :style="{
          left: bubble.x + 'px',
          top: bubble.y + 'px',
          width: bubble.size + 'px',
          transform: `translate(-50%, -50%)`
        }"
      >
        <div class="bubble-content">
          <div class="bubble-header">
            <span class="bubble-user">{{ bubble.username || $t('home.anonymous') }}</span>
            <span class="bubble-time">{{ formatTime(bubble.created_at) }}</span>
          </div>
          <div class="bubble-text">{{ bubble.content }}</div>
        </div>
      </div>
    </div>

    <!-- 底部输入框 -->
    <div class="input-panel" ref="inputPanel">
      <div class="input-container">
        <textarea
          v-model="newMessage"
          :placeholder="$t('forum.placeholder')"
          class="message-input"
          :maxlength="144"
          @keydown.enter.exact.prevent="handleSubmit"
        ></textarea>
        <div class="input-footer">
          <span class="char-count">{{ newMessage.length }}/144</span>
          <button
            class="submit-btn"
            @click="handleSubmit"
            :disabled="!newMessage.trim() || newMessage.length > 144 || !isAuthenticated"
          >
            {{ $t('forum.submit') }}
          </button>
        </div>
        <div v-if="!isAuthenticated" class="login-prompt">
          <router-link to="/login">{{ $t('forum.loginToPost') }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getForumMessages, postMessage } from '../services/forumService'
import { isAuthenticated as checkAuth } from '../services/authService'

const { t } = useI18n()

const forumContainer = ref(null)
const bubblesContainer = ref(null)
const inputPanel = ref(null)
const newMessage = ref('')
const bubblesContainerHeight = ref(0)

// State
const isLoading = ref(true)
const error = ref(null)
const bubbles = ref([])
const isAuthenticated = ref(false)

let animationId = null

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return t('home.justNow')
  } else if (diffMins < 60) {
    return t('home.minutesAgo', { count: diffMins })
  } else if (diffHours < 24) {
    return t('home.hoursAgo', { count: diffHours })
  } else {
    return t('home.daysAgo', { count: diffDays })
  }
}

// 从数据库加载消息
const loadMessages = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    console.log('💬 Loading forum messages from database...')
    const messages = await getForumMessages(50) // Get up to 50 messages
    console.log('✅ Forum messages loaded:', messages)
    
    if (messages && messages.length > 0) {
      // Initialize bubble positions after we have data
      setTimeout(() => {
        initBubbles(messages)
      }, 100)
    } else {
      console.log('⚠️ No forum messages found in database')
      bubbles.value = []
    }
  } catch (err) {
    console.error('❌ Failed to load forum messages:', err)
    error.value = t('common.loadError')
  } finally {
    isLoading.value = false
  }
}

// 更新气泡容器高度
const updateBubblesContainerHeight = () => {
  if (!forumContainer.value || !inputPanel.value) return
  
  const forumHeight = forumContainer.value.clientHeight
  const inputPanelHeight = inputPanel.value.offsetHeight
  bubblesContainerHeight.value = forumHeight - inputPanelHeight
}

// 初始化气泡位置
const initBubbles = (messages) => {
  if (!bubblesContainer.value || !messages || messages.length === 0) return
  
  updateBubblesContainerHeight()
  
  const container = bubblesContainer.value
  const containerWidth = container.clientWidth
  const containerHeight = bubblesContainerHeight.value
  
  // Assign random positions and sizes to messages
  bubbles.value = messages.map(msg => ({
    id: msg.id,
    username: msg.username,
    content: msg.content,
    created_at: msg.created_at,
    size: 160 + Math.random() * 60, // 160-220px
    x: Math.random() * (containerWidth - 200) + 100,
    y: Math.random() * (containerHeight - 200) + 100,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6
  }))
}

// 检测两个气泡是否碰撞
const checkCollision = (b1, b2) => {
  const dx = b1.x - b2.x
  const dy = b1.y - b2.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const minDistance = (b1.size + b2.size) / 2
  return distance < minDistance
}

// 处理碰撞
const handleCollision = (b1, b2) => {
  const dx = b2.x - b1.x
  const dy = b2.y - b1.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  if (distance === 0) return
  
  const nx = dx / distance
  const ny = dy / distance
  
  const dvx = b2.vx - b1.vx
  const dvy = b2.vy - b1.vy
  
  const dvn = dvx * nx + dvy * ny
  
  if (dvn > 0) return
  
  const impulse = 2 * dvn
  b1.vx += impulse * nx * 0.5
  b1.vy += impulse * ny * 0.5
  b2.vx -= impulse * nx * 0.5
  b2.vy -= impulse * ny * 0.5
  
  const overlap = (b1.size + b2.size) / 2 - distance
  if (overlap > 0) {
    const separationX = nx * overlap * 0.5
    const separationY = ny * overlap * 0.5
    b1.x -= separationX
    b1.y -= separationY
    b2.x += separationX
    b2.y += separationY
  }
}

// 检测气泡与输入框的碰撞
const checkInputPanelCollision = (bubble) => {
  if (!inputPanel.value || !bubblesContainer.value) return false
  
  const inputRect = inputPanel.value.getBoundingClientRect()
  const containerRect = bubblesContainer.value.getBoundingClientRect()
  
  const inputX = inputRect.left - containerRect.left + inputRect.width / 2
  const inputY = inputRect.top - containerRect.top + inputRect.height / 2
  const inputWidth = inputRect.width
  const inputHeight = inputRect.height
  
  const margin = bubble.size / 2 + 20
  const bubbleLeft = bubble.x - bubble.size / 2
  const bubbleRight = bubble.x + bubble.size / 2
  const bubbleTop = bubble.y - bubble.size * 0.4
  const bubbleBottom = bubble.y + bubble.size * 0.4
  
  const inputLeft = inputX - inputWidth / 2 - margin
  const inputRight = inputX + inputWidth / 2 + margin
  const inputTop = inputY - inputHeight / 2 - margin
  const inputBottom = inputY + inputHeight / 2 + margin
  
  return !(bubbleRight < inputLeft || bubbleLeft > inputRight || bubbleBottom < inputTop || bubbleTop > inputBottom)
}

// 处理气泡与输入框的碰撞
const handleInputPanelCollision = (bubble) => {
  if (!inputPanel.value || !bubblesContainer.value) return
  
  const inputRect = inputPanel.value.getBoundingClientRect()
  const containerRect = bubblesContainer.value.getBoundingClientRect()
  
  const inputX = inputRect.left - containerRect.left + inputRect.width / 2
  const inputY = inputRect.top - containerRect.top + inputRect.height / 2
  const inputWidth = inputRect.width
  const inputHeight = inputRect.height
  
  const margin = bubble.size / 2 + 20
  
  const inputLeft = inputX - inputWidth / 2 - margin
  const inputRight = inputX + inputWidth / 2 + margin
  const inputTop = inputY - inputHeight / 2 - margin
  const inputBottom = inputY + inputHeight / 2 + margin
  
  if (bubble.x >= inputLeft && bubble.x <= inputRight && bubble.y >= inputTop && bubble.y <= inputBottom) {
    const distToLeft = bubble.x - inputLeft
    const distToRight = inputRight - bubble.x
    const distToTop = bubble.y - inputTop
    const distToBottom = inputBottom - bubble.y
    
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)
    
    if (minDist === distToLeft) {
      bubble.x = inputLeft - 1
      bubble.vx = -Math.abs(bubble.vx)
    } else if (minDist === distToRight) {
      bubble.x = inputRight + 1
      bubble.vx = Math.abs(bubble.vx)
    } else if (minDist === distToTop) {
      bubble.y = inputTop - 1
      bubble.vy = -Math.abs(bubble.vy)
    } else {
      bubble.y = inputBottom + 1
      bubble.vy = Math.abs(bubble.vy)
    }
  }
}

// 动画循环
const animate = () => {
  if (!bubblesContainer.value || bubbles.value.length === 0) return
  
  updateBubblesContainerHeight()
  
  const container = bubblesContainer.value
  const containerWidth = container.clientWidth
  const containerHeight = bubblesContainerHeight.value
  
  bubbles.value.forEach(bubble => {
    // 更新位置
    bubble.x += bubble.vx
    bubble.y += bubble.vy
    
    // 边界碰撞
    const halfSize = bubble.size / 2
    if (bubble.x - halfSize < 0 || bubble.x + halfSize > containerWidth) {
      bubble.vx = -bubble.vx
      bubble.x = Math.max(halfSize, Math.min(containerWidth - halfSize, bubble.x))
    }
    
    const halfHeight = bubble.size * 0.4
    if (bubble.y - halfHeight < 0 || bubble.y + halfHeight > containerHeight) {
      bubble.vy = -bubble.vy
      bubble.y = Math.max(halfHeight, Math.min(containerHeight - halfHeight, bubble.y))
    }
    
    // 检测与输入框的碰撞
    if (checkInputPanelCollision(bubble)) {
      handleInputPanelCollision(bubble)
    }
    
    // 添加轻微阻尼
    bubble.vx *= 0.999
    bubble.vy *= 0.999
  })
  
  // 检测所有气泡之间的碰撞
  for (let i = 0; i < bubbles.value.length; i++) {
    for (let j = i + 1; j < bubbles.value.length; j++) {
      if (checkCollision(bubbles.value[i], bubbles.value[j])) {
        handleCollision(bubbles.value[i], bubbles.value[j])
      }
    }
  }
  
  animationId = requestAnimationFrame(animate)
}

// 提交新消息
const handleSubmit = async () => {
  if (!newMessage.value.trim() || newMessage.value.length > 144 || !isAuthenticated.value) return
  
  try {
    const message = await postMessage(newMessage.value.trim())
    console.log('✅ Message posted:', message)
    
    // Add new message to bubbles
    if (bubblesContainer.value) {
      const container = bubblesContainer.value
      const newBubble = {
        id: message.id,
        username: message.username,
        content: message.content,
        created_at: message.created_at,
        size: 160 + Math.random() * 60,
        x: container.clientWidth / 2,
        y: bubblesContainerHeight.value * 0.6,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8
      }
      
      bubbles.value.push(newBubble)
      newMessage.value = ''
    }
  } catch (err) {
    console.error('Failed to post message:', err)
    alert(t('forum.postError'))
  }
}

// Check authentication status
const checkAuthStatus = () => {
  isAuthenticated.value = checkAuth()
}

// 窗口大小改变时重新初始化
const handleResize = () => {
  updateBubblesContainerHeight()
  if (bubbles.value.length > 0) {
    initBubbles(bubbles.value)
  }
}

onMounted(() => {
  checkAuthStatus()
  loadMessages()
  
  // Start animation after data is loaded
  setTimeout(() => {
    animate()
  }, 500)
  
  window.addEventListener('resize', handleResize)
  window.addEventListener('userStateChanged', checkAuthStatus)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('userStateChanged', checkAuthStatus)
})
</script>

<style scoped>
.forum-page {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 120px);
  overflow: hidden;
  background: #FDC1A7;
  display: flex;
  flex-direction: column;
}

/* 秋日背景 */
.autumn-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.leaf {
  position: absolute;
  font-size: 3rem;
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
}

.leaf-1 {
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.leaf-2 {
  top: 20%;
  right: 10%;
  animation-delay: 1s;
}

.leaf-3 {
  bottom: 15%;
  left: 8%;
  animation-delay: 2s;
}

.leaf-4 {
  bottom: 25%;
  right: 5%;
  animation-delay: 3s;
}

.leaf-5 {
  top: 50%;
  left: 50%;
  animation-delay: 1.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* Loading State */
.loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 20;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(220, 38, 38, 0.3);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 20;
  background: var(--color-bg);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--color-primary);
}

.error-message {
  color: var(--color-error);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-lg);
}

.btn-primary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: background-color var(--transition-base);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

/* 气泡容器 */
.bubbles-container {
  position: relative;
  width: 100%;
  flex: 1;
  z-index: 2;
}

.bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 30px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
  overflow: hidden;
  min-height: auto;
  height: auto;
}

.bubble:hover {
  box-shadow: 0 12px 40px rgba(220, 38, 38, 0.2);
  border-color: rgba(220, 38, 38, 0.3);
}

.bubble-content {
  padding: 20px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.bubble-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.85rem;
}

.bubble-user {
  font-weight: bold;
  color: var(--color-primary);
}

.bubble-time {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.bubble-text {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  line-height: 1.5;
  word-wrap: break-word;
  overflow: hidden;
}

/* 底部输入面板 */
.input-panel {
  position: relative;
  width: 100%;
  padding: var(--spacing-xl) var(--spacing-lg);
  z-index: 10;
  flex-shrink: 0;
}

.input-container {
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: var(--spacing-lg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  position: relative;
}

.message-input {
  width: 100%;
  min-height: 80px;
  padding: var(--spacing-md);
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color var(--transition-base);
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.5);
  color: var(--color-text-primary);
}

.message-input::placeholder {
  color: var(--color-text-light);
}

.message-input:focus {
  border-color: rgba(220, 38, 38, 0.3);
  background: rgba(255, 255, 255, 0.8);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-sm);
}

.char-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.char-count:has(+ .submit-btn:disabled) {
  color: var(--color-error);
}

.submit-btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  background: rgba(220, 38, 38, 0.3);
  color: var(--color-primary);
  border: 2px solid rgba(220, 38, 38, 0.3);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-base);
}

.submit-btn:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.4);
  border-color: rgba(220, 38, 38, 0.4);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  margin-top: var(--spacing-sm);
  text-align: center;
  font-size: var(--font-size-sm);
}

.login-prompt a {
  color: var(--color-primary);
  text-decoration: none;
}

.login-prompt a:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 767.98px) {
  .bubble-content {
    padding: 15px;
  }

  .bubble-header {
    font-size: 0.75rem;
  }

  .bubble-text {
    font-size: 0.8rem;
  }

  .input-container {
    max-width: 100%;
  }
}
</style>