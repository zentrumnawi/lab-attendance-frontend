<template>
  <v-menu
    ref="menu"
    v-model="menu"
    :close-on-content-click="false"
    v-model:return-value="time"
    lazy
    transition="scale-transition"
    offset-y
    :max-width="290"
    :disabled="disabled"
  >
    <template #activator="{ props }">
      <v-text-field
        v-model="time"
        v-bind="props"
        :label="label"
        readonly
        prepend-icon="access_time"
      ></v-text-field>
    </template>

    <v-time-picker
      v-if="menu"
      no-title
      v-model="time"
      format="24hr"
      @click:minute="$refs.menu.save(time)"
      :min="min"
      :max="max"
    ></v-time-picker>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { format } from "date-fns";

export default defineComponent({
  name: "TimeInput",
  emits: ["update:modelValue"],
  data: () => ({
    menu: false,
  }),
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null,
    },
    min: {
      type: String,
      default: "08:00",
    },
    max: {
      type: String,
      default: null,
    },
    rules: {
      type: Array as PropType<unknown[]>,
      default: null,
    },
    modelValue: {
      type: Date,
      required: true,
    },
  },
  computed: {
    time: {
      get() {
        return format(this.modelValue, "HH:mm");
      },
      set(val: string): void {
        const [year, month, day] = format(this.modelValue, "yyyy-MM-dd").split(
          "-",
        );
        const [hours, minutes] = val.split(":");
        const date = new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hours),
          Number(minutes),
        );
        this.$emit("update:modelValue", date);
      },
    },
  },
});
</script>
