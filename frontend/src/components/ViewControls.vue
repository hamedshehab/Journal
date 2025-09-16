<template>
  <div class="flex items-center gap-2 px-5 py-4">
    <Filter
      v-model="list"
      :doctype="doctype"
      :default_filters="filters"
      @update="updateFilter"
    />
  </div>
</template>

<script setup>
import Filter from '@/components/Filter.vue'
import { createResource } from 'frappe-ui'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  doctype: {
    type: String,
    required: true,
  },
  filters: {
    type: Object,
    default: () => ({}),
  },
})

const list = defineModel()
const route = useRoute()
const defaultParams = ref(null)

function getParams() {
  return {
    doctype: props.doctype,
    filters: props.filters,
  }
}

// Initialize list resource
list.value = createResource({
  url: 'crm.api.doc.get_data',
  params: getParams(),
  cache: [props.doctype],
})

// Update filters
function updateFilter(newFilters) {
  if (!defaultParams.value) defaultParams.value = getParams()
  list.value.params = { ...defaultParams.value, filters: newFilters }
  list.value.reload()
}
</script>
