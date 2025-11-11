<script setup lang="ts">
import { ref } from 'vue'

type Item = { id: number; name: string; role: string; status: string }
type BadgeColor =
    | 'error'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'neutral'

const isCreateOpen = ref(false)

const items = ref<Item[]>([
  { id: 1, name: 'Demo user', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Test user', role: 'Editor', status: 'Pending' }
])

function getBadgeColor(status: string): BadgeColor {
  switch (status) {
    case 'Active':
      return 'success'
    case 'Pending':
      return 'warning'
    case 'Blocked':
      return 'error'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <div class="mx-auto py-6 space-y-6">
    <!-- Header / Toolbar -->
    <div class="la-card flex items-center justify-between gap-4 px-5 py-4 rounded-lg shadow-sm">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-default">
          Dashboard
        </h1>
        <p class="text-xs la-muted">
          Quick overview of users managed via
          <span class="font-medium text-default">@nuxt/ui</span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UInput
            icon="i-heroicons-magnifying-glass-20-solid"
            placeholder="Search users..."
            class="w-56"
        />
        <UButton
            icon="i-heroicons-funnel-20-solid"
            variant="soft"
            color="neutral"
        >
          Filters
        </UButton>
        <UButton
            color="primary"
            icon="i-heroicons-plus-20-solid"
            @click="isCreateOpen = true"
        >
          New
        </UButton>
      </div>
    </div>

    <!-- Users table -->
    <UCard class="la-card overflow-hidden">
      <table class="w-full text-sm border-collapse">
        <thead>
        <tr class="bg-default">
          <th class="py-3 px-4 font-medium la-muted">Name</th>
          <th class="py-3 px-4 font-medium la-muted">Role</th>
          <th class="py-3 px-4 font-medium la-muted">Status</th>
          <th class="py-3 px-4 text-right font-medium la-muted">Actions</th>
        </tr>
        </thead>
        <tbody class="divide-y la-divider">
        <tr
            v-for="row in items"
            :key="row.id"
            class="hover:bg-default transition-colors"
        >
          <td class="py-3 px-4 font-medium text-default">
            {{ row.name }}
          </td>
          <td class="py-3 px-4 la-muted">
            {{ row.role }}
          </td>
          <td class="py-3 px-4">
            <UBadge
                :color="getBadgeColor(row.status)"
                variant="soft"
                size="xs"
            >
              {{ row.status }}
            </UBadge>
          </td>
          <td class="py-3 px-4 text-right">
            <div class="inline-flex items-center gap-1.5">
              <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
              >
                Edit
              </UButton>
              <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
              >
                Delete
              </UButton>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </UCard>

    <!-- Create user modal -->
    <UModal v-model="isCreateOpen">
      <UCard class="la-card max-w-md mx-auto shadow-xl">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-semibold text-sm text-default">
              Create user
            </h3>
            <UButton
                icon="i-heroicons-x-mark-20-solid"
                size="xs"
                variant="ghost"
                color="neutral"
                @click="isCreateOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4 py-1">
          <UInput label="Name" placeholder="Enter name" />
          <UInput label="Email" placeholder="Enter email" />
          <USelect
              label="Role"
              :options="['Admin', 'Editor', 'Viewer']"
              placeholder="Select role"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-2 pt-1">
            <UButton
                variant="ghost"
                color="neutral"
                @click="isCreateOpen = false"
            >
              Cancel
            </UButton>
            <UButton color="primary">
              Create
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>