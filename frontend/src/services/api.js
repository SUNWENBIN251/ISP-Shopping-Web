// src/services/api.js
const API_BASE_URL = '/api'

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })
    
    // Handle empty responses
    const text = await response.text()
    const data = text ? JSON.parse(text) : {}
    
    if (!response.ok) {
      throw new Error(data.error || 'API call failed')
    }
    
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}