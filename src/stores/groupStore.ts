import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import type { Group } from "./types";

export const useGroupStore = defineStore("groups", {
  state: () => ({
    groups: [] as Group[],
  }),

  actions: {
    saveGroup(formData: Omit<Group, "id"> & { id?: string }) {
      if (formData.id) {
        const index = this.groups.findIndex(
          (group) => group.id === formData.id,
        );

        if (index !== -1) {
          this.groups[index] = { ...formData, id: formData.id };
        }
      } else {
        this.groups.push({
          id: uuidv4(),
          name: formData.name,
          description: formData.description,
        });
      }
    },

    removeGroup(id: string) {
      const index = this.groups.findIndex((group) => group.id === id);

      if (index !== -1) {
        this.groups.splice(index, 1);
      }
    },

    clearGroups() {
      this.groups = [];
    },
  },

  persist: true,
});
