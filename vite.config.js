import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // BASE_PATH lets GitHub Pages build with the repo folder as the base URL
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
