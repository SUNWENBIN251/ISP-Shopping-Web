// reviewService.js
import { getCurrentUser } from './authService'

export async function getAlbumReviews(albumId) {
  try {
    const response = await fetch(`/api/reviews/album/${albumId}`)
    if (response.ok) {
      return await response.json()
    }
    return []
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return []
  }
}

export async function getAlbumAverageRating(albumId) {
  try {
    const response = await fetch(`/api/reviews/album/${albumId}/average`)
    if (response.ok) {
      return await response.json()
    }
    return { avg_rating: 0, review_count: 0 }
  } catch (error) {
    console.error('Failed to fetch average rating:', error)
    return { avg_rating: 0, review_count: 0 }
  }
}

// Check if user has reviewed THIS SPECIFIC ORDER
export async function hasUserReviewedOrder(orderId) {
  const user = getCurrentUser()
  if (!user?.id) return false
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/reviews/user/order/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      return data.hasReviewed
    }
    return false
  } catch (error) {
    console.error('Failed to check review status:', error)
    return false
  }
}

export async function submitReview(productId, orderId, rating, comment) {
  const user = getCurrentUser()
  if (!user?.id) return { success: false, message: 'Please login first' }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: productId,
        order_id: orderId,
        rating: rating,
        comment: comment
      })
    })
    
    const data = await response.json()
    if (response.ok) {
      return { success: true, message: data.message }
    } else {
      return { success: false, message: data.error || 'Submission failed' }
    }
  } catch (error) {
    console.error('Failed to submit review:', error)
    return { success: false, message: 'Network error' }
  }
}