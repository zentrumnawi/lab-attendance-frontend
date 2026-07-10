import { defineStore } from "pinia";
import type { Exercise } from "./types";
import {
  deleteExercise,
  getAllExercises,
  getExerciseStatus,
  patchExercise,
  postExercise,
  submitSingleExerciseData,
} from "@/api/exercises";
import { useStudentPerformanceStore } from "@/stores/studentPerformance";

export const useExerciseStore = defineStore("exercises", {
  state: () => ({
    exercises: [] as Exercise[],
    exercise_completions: [] as string[],
  }),

  actions: {
    async saveExercise(formData: Omit<Exercise, "id"> & { id?: string }) {
      if (formData.id) {
        await patchExercise(formData.id, formData);
        const index = this.exercises.findIndex(
          (exercise) => exercise.id === formData.id,
        );

        if (index !== -1) {
          this.exercises[index] = { ...formData, id: formData.id };
        }
      } else {
        const newExercise = await postExercise(formData);
        this.exercises.push(newExercise);
      }
    },

    async removeExercise(id: string) {
      await deleteExercise(id);
      const index = this.exercises.findIndex((exercise) => exercise.id === id);

      if (index !== -1) {
        this.exercises.splice(index, 1);
      }
    },

    async fetchExercises() {
      if (this.exercises.length > 0) {
        return this.exercises;
      }

      const exercises = await getAllExercises();
      this.exercises = [...exercises];
      return this.exercises;
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

      // Invalidate derived final-results counters
      useStudentPerformanceStore().invalidate(student_id);
    },
  },
});
