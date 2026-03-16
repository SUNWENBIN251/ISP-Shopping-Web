import { getCurrentUser } from './authService'

const STORAGE_KEY = 'mock_album_reviews_v1'

function nowIso() {
  return new Date().toISOString()
}

function nextId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

function readDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { reviews: [] }
    const parsed = JSON.parse(raw)
    return { reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [] }
  } catch {
    return { reviews: [] }
  }
}

function writeDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ reviews: db.reviews || [] }))
}

export function getAlbumReviews(albumId) {
  const db = readDb()
  return db.reviews
    .filter((r) => r.album_id === albumId)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
}

export function hasUserReviewedProduct(productId) {
  const user = getCurrentUser()
  if (!user?.id) return false
  const db = readDb()
  return db.reviews.some((r) => r.user_id === user.id && r.product_id === productId)
}

export function addAlbumReview(payload) {
  const user = getCurrentUser()
  if (!user?.id) return { success: false, message: '请先登录后再评价' }

  const album_id = payload?.album_id
  const product_id = payload?.product_id
  const rating = Number(payload?.rating || 0)
  const comment = String(payload?.comment || '').trim()

  if (!album_id || !product_id) return { success: false, message: '缺少商品信息' }
  if (!(rating >= 1 && rating <= 5)) return { success: false, message: '请先选择评分' }
  if (!comment) return { success: false, message: '请填写评价内容' }

  const db = readDb()
  const already = db.reviews.some((r) => r.user_id === user.id && r.product_id === product_id)
  if (already) return { success: false, message: '你已评价过该商品' }

  const review = {
    review_id: nextId('review'),
    album_id,
    product_id,
    user_id: user.id,
    username: user.username || user.name || '匿名用户',
    rating,
    comment,
    purchased_at: payload?.purchased_at || null,
    sku_condition: payload?.sku_condition || null,
    created_at: nowIso(),
    merchant_reply: payload?.merchant_reply || null // { content, reply_at }
  }

  db.reviews.unshift(review)
  writeDb(db)

  return { success: true, review }
}

function daysAgoIso(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export function seedAlbumReviewsIfNeeded(albumId, products) {
  // 仅“有货”的专辑注入示例；没货（无 SKU）则不注入
  if (!albumId) return
  if (!Array.isArray(products) || products.length === 0) return

  const db = readDb()
  const alreadySeeded = db.reviews.some((r) => r.album_id === albumId)
  if (alreadySeeded) return

  // 基于当前专辑的 SKU 选择一些 product_id 作为示例评论对象
  const sku = products.map((p) => ({
    product_id: p.id,
    condition: p.condition
  }))

  const pick = (idx) => sku[Math.min(idx, sku.length - 1)]
  const p1 = pick(0)
  const p2 = pick(Math.min(1, sku.length - 1))
  const p3 = pick(Math.min(2, sku.length - 1))

  const seed = [
    {
      review_id: nextId('review'),
      album_id: albumId,
      product_id: p1.product_id,
      user_id: 101,
      username: 'user1',
      rating: 5,
      comment: '音质很棒，包装也很用心，成色几乎全新，播放没有杂音。',
      purchased_at: daysAgoIso(12),
      sku_condition: p1.condition,
      created_at: daysAgoIso(11),
      merchant_reply: {
        content: '感谢支持！我们会继续严格挑选成色更好的唱片，祝你听得开心～',
        reply_at: daysAgoIso(10)
      }
    },
    {
      review_id: nextId('review'),
      album_id: albumId,
      product_id: p2.product_id,
      user_id: 102,
      username: 'jane_smith',
      rating: 4,
      comment: '整体不错，封套边角有一点点磨损但可以接受，发货很快。',
      purchased_at: daysAgoIso(20),
      sku_condition: p2.condition,
      created_at: daysAgoIso(19),
      merchant_reply: null
    },
    {
      review_id: nextId('review'),
      album_id: albumId,
      product_id: p3.product_id,
      user_id: 103,
      username: 'john_doe',
      rating: 5,
      comment: '经典专辑！收到就立刻开听，果然还是黑胶有感觉。',
      purchased_at: daysAgoIso(7),
      sku_condition: p3.condition,
      created_at: daysAgoIso(6),
      merchant_reply: {
        content: '喜欢就好～后续有新到货也欢迎常来看看！',
        reply_at: daysAgoIso(5)
      }
    }
  ]

  db.reviews.unshift(...seed)
  writeDb(db)
}

