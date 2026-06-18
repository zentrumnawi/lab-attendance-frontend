import { defineStore } from "pinia";
import type { Experiment, ExperimentCompletion } from "./types";
import {
  deleteExperiment,
  getExperimentCompletions,
  getExperiments,
  patchExperiment,
  postExperiment,
} from "@/api/experiments";

export const useExperimentStore = defineStore("experiments", {
  state: () => ({
    experiments: [] as Experiment[],
    experimentCompletions: new Map<number, ExperimentCompletion[]>(),
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
    async fetchExperimentCompletions(
      labDay: number,
    ): Promise<ExperimentCompletion[]> {
      if (this.experimentCompletions.has(labDay)) {
        return this.experimentCompletions.get(labDay)!;
      }

      const completions = await getExperimentCompletions(labDay);
      this.experimentCompletions.set(labDay, completions);
      return completions;
    },
  },
});
