import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
import type { Experiment } from "./types";
import { getExperiments } from "@/api/experiments";

export const useExperimentStore = defineStore("experiments", {
  state: () => ({
    experiments: [] as Experiment[],
  }),

  actions: {
    saveExperiment(formData: Omit<Experiment, "id"> & { id?: string }) {
      if (formData.id) {
        const index = this.experiments.findIndex(
          (experiment) => experiment.id === formData.id,
        );

        if (index !== -1) {
          this.experiments[index] = { ...formData, id: formData.id };
        }
      } else {
        this.experiments.push({
          id: uuidv4(),
          title: formData.title,
          description: formData.description,
          lab_day: formData.lab_day,
        });
      }
    },

    removeExperiment(id: string) {
      const index = this.experiments.findIndex(
        (experiment) => experiment.id === id,
      );

      if (index !== -1) {
        this.experiments.splice(index, 1);
      }
    },

    clearExperiments() {
      this.experiments = [];
    },
    async fetchExperiments(): Promise<Experiment[]> {
      if (this.experiments.length > 0) {
        return this.experiments;
      }

      const experiments = await getExperiments();
      this.experiments = [...experiments];
      return this.experiments;
    },
  },
});
