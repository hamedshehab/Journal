<template>
  <div class="p-4">
    <ViewControls
      ref="viewControls"
      doctype="Employee"
      @updateRows="updateRows"
      @applyFilter="applyFilter"
    />
    <div class="mt-4">
      <h3>Rows:</h3>
      <pre>{{ rows }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ViewControls from '@/components/ViewControls.vue'

const viewControls = ref(null)
const rows = ref([])

function updateRows(newRows) {
  rows.value = newRows
}

function applyFilter(filters) {
  console.log('Filters applied:', filters)
}
</script>
