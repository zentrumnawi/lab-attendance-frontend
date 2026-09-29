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
import { useAuthStore } from "./auth";

export const useExerciseStore = defineStore("exercises", {
  state: () => ({
    exercises: [] as Exercise[],
    exercise_completions: new Map<number, string[]>(),
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
      // group-scoping for admins
      const auth = useAuthStore();
      const adminGroup = auth.adminGroupScope;
      if (!this.exercise_completions.has(lab_day)) {
        const exerciseStatus = await getExerciseStatus(lab_day, adminGroup);
        this.exercise_completions.set(lab_day, exerciseStatus);
      }
    },
    async submitSingleExerciseData(
      lab_day: number,
      student_id: string,
      completed: boolean,
    ) {
      await submitSingleExerciseData(lab_day, student_id, completed);

      if (completed) {
        // add student to completions
        if (this.exercise_completions.has(lab_day)) {
          const completions = this.exercise_completions.get(lab_day) || [];
          completions.push(student_id);
          this.exercise_completions.set(lab_day, [...new Set(completions)]);
        } else {
          this.exercise_completions.set(lab_day, [student_id]);
        }
      } else {
        // remove student from completions if exercise not completed
        if (this.exercise_completions.has(lab_day)) {
          const completions = this.exercise_completions.get(lab_day) || [];
          if (completions.indexOf(student_id) !== -1) {
            completions.splice(completions.indexOf(student_id), 1);
            this.exercise_completions.set(lab_day, [...completions]);
          }
        }
      }

      // Invalidate derived final-results counters
      useStudentPerformanceStore().invalidate(student_id);
    },
  },
});
