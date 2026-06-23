import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import type { Exercise } from "./types";
import { getExerciseStatus, submitSingleExerciseData } from "@/api/exercises";

export const useExerciseStore = defineStore("exercises", {
  state: () => ({
    exercises: [] as Exercise[],
    exercise_completions: [] as string[],
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
    async fetchExerciseStatus(lab_day: number) {
      const exerciseStatus = await getExerciseStatus(lab_day);
      this.exercise_completions = exerciseStatus;
    },
    async submitSingleExerciseData(
      lab_day: number,
      student_id: string,
      completed: boolean,
    ) {
      await submitSingleExerciseData(lab_day, student_id, completed);

      if (completed) {
        if (!this.exercise_completions.includes(student_id)) {
          this.exercise_completions.push(student_id);
        }
      } else {
        if (this.exercise_completions.includes(student_id)) {
          this.exercise_completions.splice(
            this.exercise_completions.indexOf(student_id),
            1,
          );
        }
      }
    },
  },
});
