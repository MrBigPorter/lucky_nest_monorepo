
import type { Config } from 'tailwindcss'

export default {
    content: [
        './app.vue',
        './error.vue',
        './app/**/*.{vue,js,ts}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
} satisfies Config