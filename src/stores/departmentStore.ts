import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import type { Department } from "./types";

export const useDepartmentStore = defineStore("departments", {
  state: () => ({
    departments: [] as Department[],
  }),

  actions: {
    saveDepartment(formData: Omit<Department, "id"> & { id?: string }) {
      if (formData.id) {
        const index = this.departments.findIndex(
          (department) => department.id === formData.id,
        );

        if (index !== -1) {
          this.departments[index] = { ...formData, id: formData.id };
        }
      } else {
        this.departments.push({
          id: uuidv4(),
          name: formData.name,
        });
      }
    },

    removeDepartment(id: string) {
      const index = this.departments.findIndex(
        (department) => department.id === id,
      );

      if (index !== -1) {
        this.departments.splice(index, 1);
      }
    },

    clearDepartments() {
      this.departments = [];
    },
  },

  persist: true,
});
