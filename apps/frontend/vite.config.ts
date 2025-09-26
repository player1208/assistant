import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许外部访问
    port: 5173, // 指定端口（可选）
    // 或者明确指定 IP
    // host: '0.0.0.0'
  }
})