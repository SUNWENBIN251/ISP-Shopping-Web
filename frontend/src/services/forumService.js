// src/services/forumService.js
import { apiCall } from './api'

export const getForumMessages = async (limit = 10) => {
  try {
    const data = await apiCall(`/forum/messages?limit=${limit}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch forum messages:', error)
    return []
  }
}

export const postMessage = async (content) => {
  try {
    const data = await apiCall('/forum/messages', {
      method: 'POST',
      body: JSON.stringify({ content })
    })
    return data
  } catch (error) {
    console.error('Failed to post message:', error)
    throw error
  }
}