"use client"

import * as React from "react"

export interface Notification {
  id: string
  message: string
  duration?: number
}

interface NotificationState {
  notifications: Notification[]
}

type NotificationAction = 
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'REMOVE_NOTIFICATION'; id: string }

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.notification]
      }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id)
      }
    default:
      return state
  }
}

const listeners: Array<(state: NotificationState) => void> = []
let memoryState: NotificationState = { notifications: [] }

function dispatch(action: NotificationAction) {
  memoryState = notificationReducer(memoryState, action)
  listeners.forEach(listener => listener(memoryState))
}

let count = 0
function generateId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

export function showNotification(message: string, duration: number = 3000) {
  const id = generateId()
  
  dispatch({
    type: 'ADD_NOTIFICATION',
    notification: { id, message, duration }
  })

  // Auto-remove after duration
  setTimeout(() => {
    dispatch({
      type: 'REMOVE_NOTIFICATION',
      id
    })
  }, duration)

  return id
}

export function hideNotification(id: string) {
  dispatch({
    type: 'REMOVE_NOTIFICATION',
    id
  })
}

export function useNotifications() {
  const [state, setState] = React.useState<NotificationState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    notifications: state.notifications,
    showNotification,
    hideNotification
  }
} 