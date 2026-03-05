// src/services/cartService.js
import { apiCall } from './api'
import { isAuthenticated } from './authService'

export const getCart = async () => {
  if (!isAuthenticated()) {
    return []
  }
  
  try {
    const data = await apiCall('/cart')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch cart:', error)
    return []
  }
}

export const addToCart = async (productId, quantity = 1) => {
  if (!isAuthenticated()) {
    window.location.href = '/login'
    return { success: false, error: 'Not authenticated' }
  }
  
  try {
    const response = await apiCall('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ 
        product_id: productId, 
        quantity: quantity 
      })
    })
    
    if (response && response.success) {
      window.dispatchEvent(new Event('cartUpdated'))
      return { success: true }
    }
    return { success: false, error: response?.error || 'Failed to add to cart' }
  } catch (error) {
    console.error('Add to cart error:', error)
    return { success: false, error: error.message }
  }
}

export const updateCartItemQuantity = async (productId, quantity) => {
  if (!isAuthenticated()) return
  
  try {
    await apiCall('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ product_id: productId, quantity })
    })
    window.dispatchEvent(new Event('cartUpdated'))
  } catch (error) {
    console.error('Failed to update cart:', error)
    throw error
  }
}

export const removeFromCart = async (productId) => {
  if (!isAuthenticated()) return
  
  try {
    await apiCall(`/cart/remove/${productId}`, {
      method: 'DELETE'
    })
    window.dispatchEvent(new Event('cartUpdated'))
  } catch (error) {
    console.error('Failed to remove from cart:', error)
    throw error
  }
}

export const getCartSummary = async () => {
  if (!isAuthenticated()) {
    return { count: 0, total: 0 }
  }
  
  try {
    const data = await apiCall('/cart/summary')
    return {
      count: data.count || 0,
      total: data.total || 0
    }
  } catch (error) {
    console.error('Failed to get cart summary:', error)
    return { count: 0, total: 0 }
  }
}