<template>
<NestedPopover>
    <template #target>
      <div class="flex items-center">
        <Button
          :label="('Filter')"
          :class="filters?.size ? 'rounded-r-none' : ''"
        >
          <template #prefix><FilterIcon class="h-4" /></template>
          <template v-if="filters?.size" #suffix>
            <div
              class="flex h-5 w-5 items-center justify-center rounded-[5px] bg-surface-white pt-px text-xs font-medium text-ink-gray-8 shadow-sm"
            >
              {{ filters.size }}
            </div>
          </template>
        </Button>
        <Tooltip v-if="filters?.size" :text="('Clear all Filter')">
          <div>
            <Button
              class="rounded-l-none border-l"
              icon="x"
              @click.stop="clearfilter(false)"
            />
          </div>
        </Tooltip>
      </div>
    </template>
    <template #body="{ close }">
      <div
        class="my-2 min-w-40 rounded-lg bg-surface-modal shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div class="min-w-72 p-2 sm:min-w-[400px]">
          <div
            v-if="filters?.size"
            v-for="(f, i) in filters"
            :key="i"
            id="filter-list"
            class="mb-4 sm:mb-3"
          >
            <div v-if="isMobileView" class="flex flex-col gap-2">
              <div class="-mb-2 flex w-full items-center justify-between">
                <div class="text-base text-ink-gray-5">
                  {{ i == 0 ?  ('Where') :  ('And') }}
                </div>
                <Button
                  class="flex"
                  variant="ghost"
                  icon="x"
                  @click="removeFilter(i)"
                />
              </div>
              <div id="fieldname" class="w-full">
                <Autocomplete
                  :value="f.field.fieldname"
                  :options="filterableFields.data"
                  @change="(e) => updateFilter(e, i)"
                  :placeholder=" ('First Name')"
                />
              </div>
              <div id="operator">
                <FormControl
                  type="select"
                  v-model="f.operator"
                  @change="(e) => updateOperator(e, f)"
                  :options="getOperators(f.field.fieldtype, f.field.fieldname)"
                  :placeholder=" ('Equals')"
                />
              </div>
              <div id="value" class="w-full">
                <component
                  :is="getValueControl(f)"
                  v-model="f.value"
                  @change.stop="(v) => updateValue(v, f)"
                  :placeholder=" ('John Doe')"
                />
              </div>
            </div>
            <div v-else class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div class="w-13 pl-2 text-end text-base text-ink-gray-5">
                  {{ i == 0 ?  ('Where') :  ('And') }}
                </div>
                <div id="fieldname" class="!min-w-[140px]">
                  <Autocomplete
                    :value="f.field.fieldname"
                    :options="filterableFields.data"
                    @change="(e) => updateFilter(e, i)"
                    :placeholder=" ('First Name')"
                  />
                </div>
                <div id="operator">
                  <FormControl
                    type="select"
                    v-model="f.operator"
                    @change="(e) => updateOperator(e, f)"
                    :options="
                      getOperators(f.field.fieldtype, f.field.fieldname)
                    "
                    :placeholder=" ('Equals')"
                  />
                </div>
                <div id="value" class="!min-w-[140px]">
                  <component
                    :is="getValueControl(f)"
                    v-model="f.value"
                    @change="(v) => updateValue(v, f)"
                    :placeholder=" ('John Doe')"
                  />
                </div>
              </div>
              <Button
                class="flex"
                variant="ghost"
                icon="x"
                @click="removeFilter(i)"
              />
            </div>
          </div>
          <div
            v-else
            class="mb-3 flex h-7 items-center px-3 text-sm text-ink-gray-5"
          >
            {{  ('Empty - Choose a field to filter by') }}
          </div>
          <div class="flex items-center justify-between gap-2">
            <Autocomplete
              value=""
              :options="filterableFields.data"
              @change="(e) => setfilter(e)"
              :placeholder=" ('First name')"
            >
              <template #target="{ togglePopover }">
                <Button
                  class="!text-ink-gray-5"
                  variant="ghost"
                  @click="togglePopover()"
                  :label=" ('Add Filter')"
                >
                  <template #prefix>
                    <FeatherIcon name="plus" class="h-4" />
                  </template>
                </Button>
              </template>
            </Autocomplete>
            <Button
              v-if="filters?.size"
              class="!text-ink-gray-5"
              variant="ghost"
              :label=" ('Clear all Filter')"
              @click="clearfilter(close)"
            />
          </div>
        </div>
      </div>
    </template>
</NestedPopover>
</template>

<script setup>
import { NestedPopover, FeatherIcon, Autocomplete, FormControl } from "frappe-ui"
import { Dialog } from "frappe-ui"
import { createResource } from "frappe-ui"
import { ref, onMounted, computed } from "vue"
import { session } from "../data/session"

const typeCheck = ['Check']
const typeLink = ['Link', 'Dynamic Link']
const typeNumber = ['Float', 'Int', 'Currency', 'Percent']
const typeSelect = ['Select']
const typeString = ['Data', 'Long Text', 'Small Text', 'Text Editor', 'Text']
const typeDate = ['Date', 'Datetime']

const list = defineModel()

function apply() {
  let _filters = []
  filters.value.forEach((f) => {
    _filters.push({
      fieldname: f.fieldname,
      operator: f.operator,
      value: f.value,
    })
  })
  emit('update', parseFilters(_filters))
}

const filters = computed(() => {
  // if (!list.value?.data) return new Set()
  // console.log("WHATSUPPPPPPPPP!")
  // allFilters is a reactive (Proxy) plain object, typically from Vue's reactivity system.
  // It represents an object where each key is a fieldname and the value is either a primitive or an array like [operator, value].
  let allFilters =
    list.value?.params?.filters ||
    list.value?.data?.params?.filters ||
    {} // fallback to empty object if no data
  //   console.log("Filters?",allFilters)
  // if (!allFilters || !filterableFields.data) return new Set()
  // remove default filters
  // if (props.default_filters) {
  //   allFilters = removeCommonFilters(props.default_filters, allFilters)
  // }
  console.log("What's up?",convertFilters(filterableFields.data, allFilters))
  return convertFilters(filterableFields.data, allFilters)
})

function removeCommonFilters(commonFilters, allFilters) {
  for (const key in commonFilters) {
    if (commonFilters.hasOwnProperty(key) && allFilters.hasOwnProperty(key)) {
      if (commonFilters[key] === allFilters[key]) {
        delete allFilters[key]
      }
    }
  }
  return allFilters
}

function convertFilters(data, allFilters) {
  let f = []
  for (let [key, value] of Object.entries(allFilters)) {
    let field = data.find((f) => f.fieldname === key)
    if (typeof value !== 'object' || !value) {
      value = ['=', value]
      if (field?.fieldtype === 'Check') {
        value = ['equals', value[1] ? 'Yes' : 'No']
      }
    }

    if (field) {
      f.push({
        field,
        fieldname: key,
        operator: oppositeOperatorMap[value[0]],
        value: value[1],
      })
    }
  }
  return new Set(f)
}


const filterableFields = createResource({
  url: 'journal.api.doc.get_filterable_fields',
  cache: ['filterableFields', 'Note'],
  params: {
    doctype: 'Employee',
  },
  transform(fields) {
    console.log("HELLO?")
    fields = fields.map((field) => {
      return {
        label: field.label,
        value: field.fieldname,
        ...field,
      }
    })
    console.log(fields)
    return fields
  },
})

onMounted(() => {
  if (filterableFields.data?.length) return
  filterableFields.fetch()
})

function getOperators(fieldtype, fieldname) {
  let options = []
  if (typeString.includes(fieldtype)) {
    options.push(
      ...[
        { label: __('Equals'), value: 'equals' },
        { label: __('Not Equals'), value: 'not equals' },
        { label: __('Like'), value: 'like' },
        { label: __('Not Like'), value: 'not like' },
        { label: __('In'), value: 'in' },
        { label: __('Not In'), value: 'not in' },
        { label: __('Is'), value: 'is' },
      ],
    )
  }
  if (fieldname === '_assign') {
    // TODO: make equals and not equals work
    options = [
      { label: __('Like'), value: 'like' },
      { label: __('Not Like'), value: 'not like' },
      { label: __('Is'), value: 'is' },
    ]
  }
  if (typeNumber.includes(fieldtype)) {
    options.push(
      ...[
        { label: __('Equals'), value: 'equals' },
        { label: __('Not Equals'), value: 'not equals' },
        { label: __('Like'), value: 'like' },
        { label: __('Not Like'), value: 'not like' },
        { label: __('In'), value: 'in' },
        { label: __('Not In'), value: 'not in' },
        { label: __('Is'), value: 'is' },
        { label: __('<'), value: '<' },
        { label: __('>'), value: '>' },
        { label: __('<='), value: '<=' },
        { label: __('>='), value: '>=' },
      ],
    )
  }
  if (typeSelect.includes(fieldtype)) {
    options.push(
      ...[
        { label: __('Equals'), value: 'equals' },
        { label: __('Not Equals'), value: 'not equals' },
        { label: __('In'), value: 'in' },
        { label: __('Not In'), value: 'not in' },
        { label: __('Is'), value: 'is' },
      ],
    )
  }
  if (typeLink.includes(fieldtype)) {
    options.push(
      ...[
        { label: __('Equals'), value: 'equals' },
        { label: __('Not Equals'), value: 'not equals' },
        { label: __('Like'), value: 'like' },
        { label: __('Not Like'), value: 'not like' },
        { label: __('In'), value: 'in' },
        { label: __('Not In'), value: 'not in' },
        { label: __('Is'), value: 'is' },
      ],
    )
  }
  if (typeCheck.includes(fieldtype)) {
    options.push(...[{ label: __('Equals'), value: 'equals' }])
  }
  if (['Duration'].includes(fieldtype)) {
    options.push(
      ...[
        { label: __('Like'), value: 'like' },
        { label: __('Not Like'), value: 'not like' },
        { label: __('In'), value: 'in' },
        { label: __('Not In'), value: 'not in' },
        { label: __('Is'), value: 'is' },
      ],
    )
  }
  if (typeDate.includes(fieldtype)) {
    options.push(
      ...[
        { label: __('Equals'), value: 'equals' },
        { label: __('Not Equals'), value: 'not equals' },
        { label: __('Is'), value: 'is' },
        { label: __('>'), value: '>' },
        { label: __('<'), value: '<' },
        { label: __('>='), value: '>=' },
        { label: __('<='), value: '<=' },
        { label: __('Between'), value: 'between' },
        { label: __('Timespan'), value: 'timespan' },
      ],
    )
  }
  return options
}
function setfilter(data) {
  if (!data) return
  filters.value.add({
    field: {
      label: data.label,
      fieldname: data.value,
      fieldtype: data.fieldtype,
      options: data.options,
    },
    fieldname: data.value,
    operator: getDefaultOperator(data.fieldtype),
    value: getDefaultValue(data),
  })
  apply()
  console.log("Filters after setfilter",filters.value)
}

function getDefaultOperator(fieldtype) {
  if (typeSelect.includes(fieldtype)) {
    return 'equals'
  }
  if (typeCheck.includes(fieldtype) || typeNumber.includes(fieldtype)) {
    return 'equals'
  }
  if (typeDate.includes(fieldtype)) {
    return 'between'
  }
  return 'like'
}

function getDefaultValue(field) {
  if (typeSelect.includes(field.fieldtype)) {
    return getSelectOptions(field.options)[0]
  }
  if (typeCheck.includes(field.fieldtype)) {
    return 'Yes'
  }
  if (typeDate.includes(field.fieldtype)) {
    return null
  }
  return ''
}

const ping = createResource({
	url: "ping",
	auto: true,
})

const showDialog = ref(false)
</script>
