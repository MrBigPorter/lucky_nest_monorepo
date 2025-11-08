<script setup lang="ts">
const menu = [
  {label: 'Dashboard', to: '/', icon: '📊'},
  {label: 'Users', to: '/users', icon: '👥'},
  {label: 'Orders', to: '/orders', icon: '📦'},
  {label: 'Settings', to: '/settings', icon: '⚙️'}
]

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const toggleTheme = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen flex la-page text-default transition-colors duration-200">
    <!-- Sidebar -->
    <aside
        class="w-72 la-card flex flex-col gap-4 shadow-sm"
    >
      <!-- Logo -->
      <div class="px-6 pt-6 pb-3 flex items-center gap-3">
        <div
            class="w-10 h-10 rounded-lg bg-indigo-600
                 flex items-center justify-center
                 text-white text-lg font-semibold shadow"
        >
          LA
        </div>
        <div>
          <div class="font-bold text-lg text-default">Lucky Admin</div>
          <div class="text-xs la-muted">Simple Nuxt / Vue starter</div>
        </div>
      </div>

      <!-- Search -->
      <div class="px-4">
        <input
            type="search"
            placeholder="Search..."
            class="w-full text-sm px-3 py-2 rounded-lg
                 border border-[var(--la-border-subtle)]
                 bg-[var(--la-surface-bg)]
                 text-default placeholder:la-muted
                 focus:outline-none focus:ring-2 focus:ring-indigo-400
                 transition"
        />
      </div>

      <!-- Nav -->
      <nav class="px-2 space-y-1">
        <ULink
            v-for="item in menu"
            :key="item.to"
            :to="item.to"
            active-class="bg-indigo-50 text-indigo-600"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                 la-muted  hover:text-indigo-800 hover:bg-indigo-50
                 transition-colors"
        >
          <span class="w-6 text-center text-lg">{{ item.icon }}</span>
          <span class="flex-1">{{ item.label }}</span>
          <span class="text-xs la-muted">›</span>
        </ULink>
      </nav>

      <!-- Status -->
      <div class="mt-auto px-4 pb-5">
        <div class="text-xs la-muted uppercase font-semibold">Status</div>
        <div class="mt-2 flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"/>
          <span class="text-sm la-muted">All systems operational</span>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col">
      <!-- Topbar -->
      <header
          class="h-16 flex items-center justify-between px-6
               la-card
               border-0 border-b border-[var(--la-border-subtle)]
               shadow-sm"
      >
        <div class="text-sm la-muted">
          Welcome to your dashboard. Manage your users and orders here.
        </div>

        <div class="flex items-center gap-3">
          <UButton variant="ghost" size="xs" class="hidden sm:inline-flex">
            Feedback
          </UButton>

          <!-- Theme toggle -->
          <button
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
                   border border-[var(--la-border-subtle)]
                   text-xs la-muted hover:text-default
                   transition-colors"
              @click="toggleTheme"
          >
            <span v-if="!isDark">🌙 Dark</span>
            <span v-else>☀️ Light</span>
          </button>

          <UAvatar size="sm" name="Admin"/>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 px-6 py-6 la-page">
        <div class="mx-auto">
          <div class="la-card px-6 py-6 space-y-6 shadow-sm rounded-lg">
            <slot/>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
aside ::-webkit-scrollbar {
  width: 8px;
}

aside ::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.06);
  border-radius: 9999px;
}
</style>