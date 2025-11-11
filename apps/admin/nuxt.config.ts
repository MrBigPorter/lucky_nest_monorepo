// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
    compatibilityDate: '2025-11-08',
    runtimeConfig:{
        apiBase: process.env.NUXT_API_BASE || 'http://localhost:3000',
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
        },
    },
    devtools: { enabled: true },

    modules: ['@nuxt/ui'],

    css: ['~/assets/css/main.css'],

    postcss: {
        plugins: {
            '@tailwindcss/postcss': {}
        }
    },

    colorMode: {
        preference: 'light',   // 默认 light
        fallback: 'light',     // SSR / 无存储时也是 light
        classSuffix: '',       // 用 .dark，不要加 -dark 后缀
        storageKey: 'lucky-color-mode'
    }
})