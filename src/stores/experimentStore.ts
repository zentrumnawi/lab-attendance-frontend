import { defineStore } from "pinia";
import type { Experiment, ExperimentCompletion } from "./types";
import {
  deleteExperiment,
  getExperimentCompletions,
  getExperiments,
  patchExperiment,
  postExperiment,
  saveExperimentCompletions,
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

    async setExperimentCompletion(
      labDay: number,
      studentId: string,
      experimentIds: string[],
      labPartnerId?: string,
    ) {
      const records = [
        { student_id: studentId, experiment_ids: experimentIds },
      ];
      if (labPartnerId) {
        records.push({
          student_id: labPartnerId,
          experiment_ids: experimentIds,
        });
      }
      await saveExperimentCompletions({
        lab_day: labDay,
        records: records,
      });

      // Update local state for one or two students.
      await this._writeNewCompletionsToStorage(
        labDay,
        {
          student: studentId,
          experiment_completions: experimentIds,
        },
        labPartnerId ?? undefined,
      );
    },
    async _writeNewCompletionsToStorage(
      labDay: number,
      entry: ExperimentCompletion,
      labPartnerId?: string,
    ) {
      const completions = [...(this.experimentCompletions.get(labDay) ?? [])];
      const index = completions.findIndex(
        (completion) => completion.student === entry.student,
      );

      if (index === -1) {
        completions.push(entry);
      } else {
        completions[index] = entry;
      }

      if (labPartnerId) {
        const labPartnerEntry = { ...entry, student: labPartnerId };
        const labPartnerIndex = completions.findIndex(
          (completion) => completion.student === labPartnerId,
        );
        if (labPartnerIndex === -1) {
          completions.push(labPartnerEntry);
        } else {
          completions[labPartnerIndex] = labPartnerEntry;
        }
      }

      this.experimentCompletions.set(labDay, completions);
    },
  },
});
