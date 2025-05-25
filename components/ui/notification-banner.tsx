"use client"

import React from 'react'
import { useNotifications, type Notification } from '@/hooks/use-notification'

interface NotificationBannerProps {
  notification: Notification
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification }) => {
  return (
    <div className="bg-white rounded-full px-6 py-3 shadow-xl border border-gray-100 animate-in slide-in-from-top-4 duration-300 ease-out">
      <p className="text-base text-black font-medium whitespace-nowrap">
        {notification.message}
      </p>
    </div>
  )
}

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications()

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="fixed left-1/2 transform -translate-x-1/2 z-50"
          style={{
            top: `${16 + index * 60}px` // Stack notifications with 60px spacing
          }}
        >
          <NotificationBanner notification={notification} />
        </div>
      ))}
    </>
  )
}

export default NotificationContainer 