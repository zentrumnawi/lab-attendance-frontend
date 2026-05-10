<template>
  <v-layout v-if="!authenticated">
    <v-flex xs12 sm6 offset-sm3>
      <v-card>
        <v-card-title primary-title class="justify-center">
          <h2>Authentifizierung</h2>
        </v-card-title>
        <v-card-text>
          <p>Bitte geben Sie das Passwort ein.</p>
          <v-text-field
            autofocus
            v-model="password"
            :append-icon="show_pw ? 'visibility' : 'visibility_off'"
            :type="show_pw ? 'text' : 'password'"
            label="Password"
            @keyup.enter="authenticate"
            @click:append="show_pw = !show_pw"
          >
          </v-text-field>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-spacer></v-spacer>
          <v-btn class="error" @click="authenticate">Absenden</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>

  <div v-else id="FormData">
    <v-dialog v-model="clearconfirm" max-width="600">
      <v-card>
        <v-card-title class="headline">Liste löschen?</v-card-title>
        <v-card-text>
          Alle geloggten Zeiten und Studierenden werden gelöscht!
        </v-card-text>
        <v-btn class="warning" @click="clearlist"> Clear </v-btn>
        <v-btn class="primary" @click="clearconfirm = false"> Abbrechen </v-btn>
      </v-card>
    </v-dialog>

    <v-tabs>
      <v-tab ripple>Teilnehmerliste</v-tab>
      <v-tab ripple>LV Mathe</v-tab>
      <v-tab ripple>LV Physik</v-tab>
      <v-tab ripple>Studienfächer</v-tab>
      <!--v-tab ripple>Einstellungen</v-tab-->

      <v-spacer></v-spacer>
      <v-btn class="secondary" to="/"> Logout </v-btn>

      <v-tab-item>
        <v-card>
          <v-data-table
            :headers="tbl_headers"
            :items="attendeesTable"
            no-data-text="Keine Daten vorhanden"
            disable-initial-sort
            class="elevation-1"
          >
            <template #item="props">
              <td class="text-xs-left">{{ props.item.date }}</td>
              <td class="text-xs-left">{{ props.item.pid }}</td>
              <td class="text-xs-left">{{ props.item.start }}</td>
              <td class="text-xs-left">{{ props.item.end }}</td>
              <td class="text-xs-left">{{ props.item.presence }}</td>
              <td class="text-xs-left">{{ props.item.faculty }}</td>
              <td class="text-xs-left">{{ props.item.semester }}</td>
              <td class="text-xs-left">{{ props.item.courses }}</td>
              <td class="text-xs-left">{{ props.item.comments }}</td>
            </template>
          </v-data-table>

          <v-card-actions>
            <v-btn
              class="success"
              :download="downloadName"
              :href="downloadURL"
              :disabled="attendees.length === 0"
            >
              Download
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              class="warning"
              @click="clearconfirm = true"
              :disabled="attendees.length === 0"
            >
              Clear
            </v-btn>
            <!--v-btn class="primary" @click="dummydata">
              Populate DB
            </v-btn-->
          </v-card-actions>
        </v-card>
      </v-tab-item>

      <v-tab-item>
        <v-card>
          <v-data-table
            :items="$options.config.courses_math"
            :headers="course_headers"
            class="elevation-1"
            hide-actions
          >
            <template #item="courses">
              <td class="text-xs-left">{{ (courses.item as Course).name }}</td>
              <td class="text-xs-left">{{ (courses.item as Course).tag }}</td>
              <td class="text-xs-left">
                {{ (courses.item as Course).semester }}
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-tab-item>

      <v-tab-item>
        <v-card>
          <v-data-table
            :items="$options.config.courses_physics"
            :headers="course_headers"
            class="elevation-1"
            hide-actions
          >
            <template #item="courses">
              <td class="text-xs-left">{{ (courses.item as Course).name }}</td>
              <td class="text-xs-left">{{ (courses.item as Course).tag }}</td>
              <td class="text-xs-left">
                {{ (courses.item as Course).semester }}
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-tab-item>

      <v-tab-item>
        <v-card>
          <v-data-table
            :items="$options.config.faculties"
            :headers="faculty_headers"
            class="elevation-1"
            hide-actions
          >
            <template #item="faculties">
              <td class="text-xs-left">{{ faculties.item }}</td>
            </template>
          </v-data-table>
        </v-card>
      </v-tab-item>
    </v-tabs>
  </div>
</template>

<script lang="ts">
import { Parser } from "@json2csv/plainjs";
import { format, addMinutes, differenceInMinutes } from "date-fns";
import { mapActions, mapState } from "pinia";
import configuration from "../assets/courses_ws.json";
import { useAppStore } from "@/stores/app";

interface Course {
  name: string;
  tag: string;
  semester: string | number;
}

interface Attendee {
  id?: string;
  pid?: string;
  name?: string;
  firstName?: string;
  studentId?: string;
  email?: string;
  labPartner?: string;
  start: Date | string | number;
  end: Date | string | number;
  courses: string[];
  faculty?: string;
  semester?: string | number;
  comments?: string;
  [key: string]: any;
}

interface HeaderField {
  label: string;
  value: string;
}

export default {
  config: configuration,
  data: function () {
    return {
      authenticated: false,
      clearconfirm: false,
      password: null,
      show_pw: false,
      requiredPassword: "HelloWorld",
      attendeesTable: [] as Record<string, any>[],
      tbl_headers: [
        {
          title: "Datum",
          align: "start" as const,
          sortable: true,
          key: "date",
        },
        {
          title: "ID",
          align: "start" as const,
          sortable: true,
          key: "pid",
        },
        { title: "Startzeit", key: "start" },
        { title: "Endzeit", key: "end" },
        { title: "Anwesend", key: "presence" },
        { title: "Studiengang", key: "faculty" },
        { title: "Semester", key: "semester" },
        { title: "Lehrveranstaltungen", key: "courses" },
        { title: "Kommentar", key: "comments" },
      ],
      course_headers: [
        { title: "Lehrveranstaltung", key: "name" },
        { title: "Kürzel", key: "tag" },
        { title: "Semester", key: "semester" },
      ],
      faculty_headers: [{ title: "Studienfach", key: "name" }],
      crs_headers: [] as { label: string; value: string }[],
      csv_flds: [] as { label: string; value: string }[],
    };
  },
  props: {
    downloadName: {
      type: String,
      default: format(Date.now(), "yyMMdd_HHmm") + "_mz.csv",
    },
    delimiter: {
      type: String,
      default: ";",
    },
    quote: {
      type: String,
      default: "",
    },
  },
  methods: {
    ...mapActions(useAppStore, ["clearAttendees", "populatedb"]),
    authenticate() {
      if (this.password != this.requiredPassword) return;
      this.authenticated = true;
    },
    select(course: Course) {
      (this.faculties_act as Course[]).push(course);
    },
    clearlist() {
      this.clearAttendees();
      this.clearconfirm = false;
    },
    dummydata() {
      this.populatedb();
    },
    format(attendees: Attendee[]) {
      return attendees.map((element: Attendee) => ({
        ...element,
        ...this.formatDates(element),
      }));
    },
    formatDates(element: Attendee) {
      const start = new Date(element.start);
      const end = new Date(element.end);

      const differenceMinutes = differenceInMinutes(end, start);
      const differenceDate = addMinutes(new Date(0), differenceMinutes);

      return {
        presence: format(differenceDate, "HH:mm"),
        date: format(element.start, "DD.MM.YYYY"),
        start: format(element.start, "HH:mm"),
        end: format(element.end, "HH:mm"),
        courses: element.courses.join(", "),
      };
    },
    buildheader(courses: Course[]): HeaderField[] {
      return courses.map((course) => ({
        label: course.tag,
        value: course.tag,
      }));
    },
  },
  watch: {
    attendees: function (newValue: Attendee[]) {
      if (newValue === undefined) {
        this.attendeesTable = [];
        return;
      }
      //this.attendeesTable = this.format(newValue) //Why doesn't this work?
      this.attendeesTable = newValue.map((element) => ({
        ...element,
        ...this.formatDates(element),
      }));
    },
  },
  created() {
    //set passeword to .env
    this.requiredPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    //this.attendeesTable = this.format(this.attendees) //Why doesn't this work?
    this.attendeesTable = (this.attendees as Attendee[]).map(
      (element: Attendee) => ({
        ...element,
        ...this.formatDates(element),
      }),
    );

    //build courseheaders
    this.crs_headers = [
      ...this.buildheader([
        ...this.$options.config.courses_math,
        ...this.$options.config.courses_physics,
      ]),
    ];

    //build 'fields'-Array from header object for CSV-Parser
    this.csv_flds = this.tbl_headers.map((item) => ({
      label: item.title as string,
      value: item.key as string,
    }));

    //remove 'courses' from fields array
    this.csv_flds.splice(
      this.csv_flds.findIndex((item) => item.value == "courses"),
      1,
    );

    //append courseheaders
    this.csv_flds = [...this.csv_flds, ...this.crs_headers];
  },
  computed: {
    ...mapState(useAppStore, ["attendees", "faculties_act"]),
    export() {
      (this.attendees as Attendee[]).forEach((attendee: Attendee) => {
        this.crs_headers.forEach((course: HeaderField) => {
          attendee[course.value] =
            attendee.courses.findIndex(
              (element: string) => element === course.value,
            ) >= 0
              ? 1
              : 0;
        });
      });
      return (this.attendees as Attendee[]).map((element: Attendee) => ({
        ...element,
        ...this.formatDates(element),
      }));
    },
    csv() {
      const opts = {
        fields: this.csv_flds,
        delimiter: this.delimiter,
        quote: this.quote,
        withBOM: true,
      };
      const parser = new Parser(opts);
      const csv = parser.parse(this.export);
      return csv;
    },
    downloadURL() {
      return this.attendees.length > 0
        ? "data:text/csv," + encodeURIComponent(this.csv)
        : "javascript:void(0);";
    },
  },
};
</script>
