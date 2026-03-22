<template>
  <div class="review-page">
    <div class="container">
      <div class="page-header">
        <button class="back-btn" @click="$router.back()">← 返回</button>
        <h1>{{ albumTitle }}</h1>
        <p>{{ albumArtist }}</p>
      </div>

      <!-- Review Summary -->
      <div class="summary-card" v-if="reviews.length">
        <div class="avg-score">{{ avgRating.toFixed(1) }}</div>
        <div class="stars">
          <span v-for="i in 5" :key="i" class="star" :class="{ active: i <= Math.round(avgRating) }">★</span>
        </div>
        <div class="count">{{ reviews.length }} 条评价</div>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list">
        <div v-if="reviews.length === 0" class="no-reviews">
          <p>暂无评价，快去购买后留下你的评价吧！</p>
        </div>

        <div v-else class="review-card" v-for="review in reviews" :key="review.review_id">
          <div class="review-header">
            <div class="user-info">
              <div class="avatar">{{ (review.username || 'U').charAt(0).toUpperCase() }}</div>
              <div class="user-details">
                <span class="username">{{ review.username }}</span>
                <span class="date">{{ formatDate(review.created_at) }}</span>
              </div>
            </div>
            <div class="rating">
              <span v-for="i in 5" :key="i" class="star" :class="{ active: i <= review.rating }">★</span>
            </div>
          </div>
          <div class="product-badge" v-if="review.sku_condition">
            版本: {{ review.sku_condition }}
          </div>
          <div class="review-comment">{{ review.comment }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAlbumWithProducts } from '../services/albumService'
import { getAlbumReviews, getAlbumAverageRating } from '../services/reviewService'

const route = useRoute()
const router = useRouter()

const albumId = ref(null)
const albumTitle = ref('')
const albumArtist = ref('')
const reviews = ref([])
const avgRating = ref(0)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const loadData = async () => {
  try {
    albumId.value = parseInt(route.params.id)
    const album = await getAlbumWithProducts(albumId.value)
    albumTitle.value = album.title
    albumArtist.value = album.artist
    
    const ratingData = await getAlbumAverageRating(albumId.value)
    avgRating.value = ratingData.avg_rating
    
    const fetchedReviews = await getAlbumReviews(albumId.value)
    reviews.value = fetchedReviews
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.review-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-header {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  border: 2px solid var(--color-primary);
  text-align: center;
  position: relative;
}

.back-btn {
  position: absolute;
  top: var(--spacing-lg);
  left: var(--spacing-lg);
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
}

.page-header h1 {
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.page-header p {
  color: var(--color-text-secondary);
  margin: 0;
}

.summary-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.avg-score {
  font-size: 3rem;
  font-weight: bold;
  color: var(--color-primary);
}

.star {
  font-size: 1.5rem;
  color: #d1d5db;
}

.star.active {
  color: #f59e0b;
}

.count {
  color: var(--color-text-secondary);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.no-reviews {
  text-align: center;
  padding: var(--spacing-xxl);
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  color: var(--color-text-secondary);
}

.review-card {
  background: var(--color-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: var(--font-size-lg);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
  color: var(--color-text-primary);
}

.date {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.rating .star {
  font-size: var(--font-size-base);
}

.product-badge {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: var(--color-bg-light);
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-sm);
}

.review-comment {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin-top: var(--spacing-sm);
}

@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>