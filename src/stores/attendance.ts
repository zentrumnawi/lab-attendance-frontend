import {
  AttendanceRecordWrite,
  deleteLabSessionByLabDay,
  deleteSeminarSessionByDate,
  getLabDates,
  getLabSessionByLabDay,
  getSeminarSessionByDate,
  AttendanceRecordRead,
  LabDate,
  saveBulkAttendance,
  saveSeminarAttendance,
  type BulkAttendancePayload,
  type SeminarAttendancePayload,
  changeLabDayOfSession,
} from "@/api/attendance";
import { NetworkError } from "@/api/http";
import { defineStore } from "pinia";
import { useStudentPerformanceStore } from "@/stores/studentPerformance";
import { labDedupeKey, useSyncQueue } from "@/stores/syncQueue";
import { QueuedLocallyError } from "@/utils/network";

// this is because of different API shapes for read vs write
function writeRecordsToReadRecords(
  records: AttendanceRecordWrite[],
): AttendanceRecordRead[] {
  return records.map((r) => ({
    student: r.student_id,
    comment: r.comment ?? "",
    is_present: r.is_present,
  }));
}

function readRecordsToWriteRecords(
  records: AttendanceRecordRead[],
): AttendanceRecordWrite[] {
  return records.map((r) => ({
    student_id: r.student,
    is_present: r.is_present,
    ...(r.comment ? { comment: r.comment } : {}),
  }));
}

function isSameLabSession(
  a: { group: string; praktikum_day: number },
  group: string,
  praktikumDay: number,
) {
  return a.group === group && a.praktikum_day === praktikumDay;
}

export const useAttendanceStore = defineStore("attendance", {
  state: () => ({
    // list of passed lab dates, minimal info for calendar view
    labDates: [] as LabDate[],
    labSessions: [] as BulkAttendancePayload[],
    seminarSessions: [] as SeminarAttendancePayload[],
    dayNumbersInUse: [] as number[],
  }),
  actions: {
    async fetchLabDates() {
      if (this.labDates.length > 0) return this.labDates;
      try {
        const labDates = await getLabDates();
        this.labDates = [
          ...labDates.dates.map((date) => ({
            date: date.date,
            praktikum_day: date.praktikum_day,
            group: date.group,
          })),
        ];
        this.dayNumbersInUse = [
          ...(this.labDates.length > 0
            ? this.labDates.map((date) => date.praktikum_day)
            : []),
        ];
        console.log(this.labDates);
        return labDates;
      } catch (error) {
        console.error(error);
        this.labDates = [];
      }
    },
    async fetchSingleLabSession(praktikumDay: number, group: string) {
      if (this.labDates.length === 0) await this.fetchLabDates();
      const labDate = this.getLabDate(praktikumDay, group);
      // only fetch details if it's a past session (vs. newly to be created)
      if (!labDate) return null;

      const cached = this.labSessions.find((session) =>
        isSameLabSession(session, group, praktikumDay),
      );
      if (cached) {
        return writeRecordsToReadRecords(cached.records);
      }

      const labSession = await getLabSessionByLabDay(praktikumDay, group);

      const payload: BulkAttendancePayload = {
        date: labDate.date,
        group,
        praktikum_day: praktikumDay,
        day_type: "LAB",
        records: readRecordsToWriteRecords(labSession),
      };
      this.labSessions.push(payload);

      return labSession;
    },
    async fetchSingleSeminarSession(date: string) {
      try {
        const cached = this.seminarSessions.find(
          (session) => session.date === date,
        );
        if (cached) {
          return cached.records.length > 0
            ? writeRecordsToReadRecords(cached.records)
            : null;
        }

        const seminarSession = await getSeminarSessionByDate(date);

        if (seminarSession.length > 0) {
          const payload: SeminarAttendancePayload = {
            date,
            day_type: "LECTURE",
            records: readRecordsToWriteRecords(seminarSession),
          };
          this.seminarSessions.push(payload);
        }

        return seminarSession.length > 0 ? seminarSession : null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    getLabDate(praktikumDay: number, group: string): LabDate | undefined {
      return this.labDates.find((labDate) =>
        isSameLabSession(labDate, group, praktikumDay),
      );
    },
    applyLabDateLocally(date: string, praktikumDay: number, group: string) {
      const existingLabDate = this.getLabDate(praktikumDay, group);
      if (existingLabDate) {
        existingLabDate.date = date;
      } else {
        this.labDates.push({
          date,
          praktikum_day: praktikumDay,
          group,
        });
      }
    },
    applyLabSessionLocally(payload: BulkAttendancePayload) {
      const { date, praktikum_day: praktikumDay, group, records } = payload;

      this.applyLabDateLocally(date, praktikumDay, group);

      const existingSession = this.labSessions.find((session) =>
        isSameLabSession(session, group, praktikumDay),
      );
      if (existingSession) {
        existingSession.date = date;
        existingSession.records = records;
      } else {
        this.labSessions.push(payload);
      }
    },
    async saveSeminarSession(date: string, records: AttendanceRecordWrite[]) {
      const payload: SeminarAttendancePayload = {
        date,
        day_type: "LECTURE",
        records,
      };
      await saveSeminarAttendance(payload);

      const existingSeminarSession = this.seminarSessions.find(
        (session) => session.date === date,
      );
      if (existingSeminarSession) {
        existingSeminarSession.records = records;
      } else {
        this.seminarSessions.push(payload);
      }

      // invalidate for affected students so that their performance is recalculated
      const perfStore = useStudentPerformanceStore();
      for (const record of records) {
        perfStore.invalidate(record.student_id);
      }
    },
    async saveLabSession(
      date: string,
      praktikumDay: number,
      records: AttendanceRecordWrite[],
      group: string,
      previousPraktikumDay?: number,
    ) {
      const payload: BulkAttendancePayload = {
        date,
        praktikum_day: praktikumDay,
        group,
        day_type: "LAB",
        records,
      };

      const dayChanged =
        previousPraktikumDay != null && previousPraktikumDay !== praktikumDay;

      try {
        if (dayChanged) {
          // Changing lab day number of existing session is fundamentally different
          // from other session-related operations, so we need to handle it separately.
          // Queueing not (yet) possible
          payload.old_praktikum_day = previousPraktikumDay;
          await changeLabDayOfSession(payload);
          // Remove traces of old lab day number-keyed session: labDates, labSessions, dayNumbersInUse
          this.labDates = this.labDates.filter(
            (d) => !isSameLabSession(d, group, previousPraktikumDay),
          );
          this.labSessions = this.labSessions.filter(
            (s) => !isSameLabSession(s, group, previousPraktikumDay),
          );
          this.dayNumbersInUse = this.dayNumbersInUse.filter(
            (d) => d !== previousPraktikumDay,
          );
        } else {
          await saveBulkAttendance(payload);
        }

        this.applyLabSessionLocally(payload);

        if (!this.dayNumbersInUse.includes(praktikumDay)) {
          this.dayNumbersInUse.push(praktikumDay);
        }

        const perfStore = useStudentPerformanceStore();
        for (const record of records) {
          perfStore.invalidate(record.student_id);
        }
      } catch (error) {
        if (error instanceof NetworkError && !dayChanged) {
          useSyncQueue().enqueueAttendance({
            id: crypto.randomUUID(),
            type: "attendance.lab",
            dedupeKey: labDedupeKey(praktikumDay, group),
            payload,
            createdAt: new Date().toISOString(),
            status: "pending",
          });
          throw new QueuedLocallyError();
        } else {
          throw error;
        }
      }
    },
    async deleteSession(
      date: string,
      group: string,
      day_type: "LAB" | "LECTURE",
      praktikumDay?: number,
    ) {
      if (day_type === "LAB") {
        if (praktikumDay === undefined) {
          throw new Error(
            "praktikumDay is required when deleting a LAB session",
          );
        }
        await deleteLabSessionByLabDay(praktikumDay, group);
        this.labDates = this.labDates.filter(
          (labDate) => !isSameLabSession(labDate, group, praktikumDay),
        );
        this.labSessions = this.labSessions.filter(
          (session) => !isSameLabSession(session, group, praktikumDay),
        );
        // Clear this day number for future sessions
        this.dayNumbersInUse = this.dayNumbersInUse.filter(
          (day) => day !== praktikumDay,
        );
      } else {
        await deleteSeminarSessionByDate(date);
        this.seminarSessions = this.seminarSessions.filter(
          (session) => session.date !== date,
        );
      }
    },
  },
});
