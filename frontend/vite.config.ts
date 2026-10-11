import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Libera acesso para qualquer celular ou dispositivo na rede local Wi-Fi
    port: 5173
  }
})
