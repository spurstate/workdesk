import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main/index.ts',
        'src/main/ipc-handlers.ts',     // thin IPC wiring only
        'src/renderer/main.tsx',
        'src/**/*.d.ts',
        'src/test/**',
        'src/shared/ipc-channels.ts',
        'src/shared/types.ts',
        'src/preload/index.ts',
        'src/renderer/types/**',         // TS type stubs only
        'src/renderer/components/Setup/ContextWizard.tsx', // 492-line wizard; integration-tested via App
      ],
    },
    // Expose VITE_ env vars to subscription-key-service tests
    define: {
      'import.meta.env.VITE_SUBSCRIPTION_KEY_WEBHOOK_URL': JSON.stringify('http://test-webhook.local'),
      'import.meta.env.VITE_SUBSCRIPTION_KEY_WEBHOOK_TOKEN': JSON.stringify('test-token'),
    },
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer'),
    },
  },
})
