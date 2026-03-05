// src/services/productService.js
import { apiCall } from './api'

export const getProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (params.category) queryParams.append('category', params.category)
    if (params.search) queryParams.append('search', params.search)
    if (params.limit) queryParams.append('limit', params.limit)
    
    const queryString = queryParams.toString()
    const endpoint = `/products${queryString ? '?' + queryString : ''}`
    
    const data = await apiCall(endpoint)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return []
  }
}

export const getProduct = async (id) => {
  try {
    const data = await apiCall(`/products/${id}`)
    return data
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error)
    throw error
  }
}