/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from "react"
import ReactDOM from "react-dom"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className={`bg-white dark:bg-black rounded-xl shadow-xl p-6 relative w-full max-w-${size === "lg" ? "2xl" : size === "sm" ? "sm" : "xl"}`}
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Tutup"
        >
          ✕
        </button>
        {title && <h2 className="text-lg font-bold mb-4">{title}</h2>}
        <div>{children}</div>
      </div>
    </div>,
    typeof window !== "undefined" ? document.body : (null as any)
  )
}
