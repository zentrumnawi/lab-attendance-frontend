import { defineStore } from "pinia";
import type { Group } from "./types";
import {
  deleteGroup,
  getGroups,
  getUsers,
  patchGroup,
  postGroup,
} from "@/api/groups";

export const useGroupStore = defineStore("groups", {
  state: () => ({
    groups: [] as Group[],
    users: [] as { id: string; username: string }[],
  }),

  getters: {
    groupNameById(state): Map<string, string> {
      return new Map(state.groups.map((group) => [group.id, group.name]));
    },
  },
  actions: {
    async saveGroup(formData: Omit<Group, "id"> & { id?: string }) {
      console.log(formData);
      if (formData.id) {
        await patchGroup(formData.id, formData);
        const index = this.groups.findIndex(
          (group) => group.id === formData.id,
        );

        if (index !== -1) {
          this.groups[index] = { ...formData, id: formData.id };
        }
      } else {
        const newGroup = await postGroup(formData);
        this.groups.push(newGroup);
      }
    },

    async removeGroup(id: string) {
      await deleteGroup(id);
      const index = this.groups.findIndex((group) => group.id === id);

      if (index !== -1) {
        this.groups.splice(index, 1);
      }
    },

    async fetchGroups() {
      if (this.groups.length > 0) {
        return this.groups;
      }

      const groups = await getGroups();
      this.groups = [...groups];
      return this.groups;
    },
    clearGroups() {
      this.groups = [];
    },
    async fetchUsers(): Promise<{ id: string; username: string }[]> {
      const users = await getUsers();
      return users;
    },
    getGroupNameById(id: string): string | undefined {
      return this.groupNameById.get(id) ?? undefined;
    },
  },

  persist: false,
});
