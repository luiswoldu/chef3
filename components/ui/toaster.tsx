"use client"

import { useToast } from "@/hooks/use-toast"
import { Toast, ToastProvider, ToastViewport } from "./toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, ...props }) => (
        <Toast 
          key={id} 
          title={title?.toString() ?? ""} 
          {...props} 
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
