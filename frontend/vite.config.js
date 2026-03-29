import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  envPrefix: ['VITE_', 'PUBLISHABLE_'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'three-drei': ['@react-three/drei'],
          'three-fiber': ['@react-three/fiber'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          konva: ['konva', 'react-konva'],
          stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],
        }
      }
    }
  }
})
