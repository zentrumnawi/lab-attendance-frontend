import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import type { Department } from "./types";
import { getDepartments } from "@/api/students";

export const useDepartmentStore = defineStore("departments", {
  state: () => ({
    departments: [] as Department[],
  }),

  getters: {
    departmentNameById(state): Map<string, string> {
      return new Map(
        state.departments.map((department) => [department.id, department.name]),
      );
    },
  },

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

    async fetchDepartments() {
      if (this.departments.length > 0) {
        return this.departments;
      }
      const departments = await getDepartments();
      this.departments = departments;
      return this.departments;
    },

    clearDepartments() {
      this.departments = [];
    },

    getDepartmentNameById(id: string): string | undefined {
      return this.departmentNameById.get(id) ?? undefined;
    },
  },

  persist: true,
});
