import { defineStore } from "pinia";
import type { Experiment } from "./types";
import {
  deleteExperiment,
  getExperiments,
  patchExperiment,
  postExperiment,
} from "@/api/experiments";

export const useExperimentStore = defineStore("experiments", {
  state: () => ({
    experiments: [] as Experiment[],
  }),

  actions: {
    async saveExperiment(formData: Omit<Experiment, "id"> & { id?: string }) {
      if (formData.id) {
        await patchExperiment(formData.id, formData);
        const index = this.experiments.findIndex(
          (experiment) => experiment.id === formData.id,
        );

        if (index !== -1) {
          this.experiments[index] = { ...formData, id: formData.id };
        }
      } else {
        const newExperiment = await postExperiment(formData);
        this.experiments.push(newExperiment);
      }
    },

    async removeExperiment(id: string) {
      await deleteExperiment(id);
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
