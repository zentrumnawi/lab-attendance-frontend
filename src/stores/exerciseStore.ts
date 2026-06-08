import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import type { Exercise } from "./types";

export const useExerciseStore = defineStore("exercises", {
  state: () => ({
    exercises: [] as Exercise[],
  }),

  actions: {
    saveExercise(formData: Omit<Exercise, "id"> & { id?: string }) {
      if (formData.id) {
        const index = this.exercises.findIndex(
          (exercise) => exercise.id === formData.id,
        );

        if (index !== -1) {
          this.exercises[index] = { ...formData, id: formData.id };
        }
      } else {
        this.exercises.push({
          id: uuidv4(),
          name: formData.name,
        });
      }
    },

    removeExercise(id: string) {
      const index = this.exercises.findIndex((exercise) => exercise.id === id);

      if (index !== -1) {
        this.exercises.splice(index, 1);
      }
    },

    clearExercises() {
      this.exercises = [];
    },
  },

  persist: true,
});
