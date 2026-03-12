<template>
  <v-stepper v-model="stepper">
    <v-stepper-header>
      <div class="step" v-for="(step, index) in steps" :key="index">
        <v-stepper-step
          color="success"
          :edit-icon="'check_circle'"
          :complete-icon="'edit'"
          :step="index + 1"
          :complete="(index + 1 ) <= stepper"
          :editable="(index + 1) < stepper"
        >{{ step.label }}</v-stepper-step>
        <v-divider></v-divider>
      </div>
    </v-stepper-header>
    <v-stepper-items>
      <v-stepper-content step="1">
        <v-form ref="form_studinfo" v-model="valid">
          <v-card>
            <v-card-text>
              <v-text-field
                v-model="form.pid"
                :rules="rules.pid"
                maxlength="8"
                label="ID"
                append-outer-icon="help"
                persistent-hint
                placeholder="XX999999"
                required
                @click:append-outer="idhelper = true"
              ></v-text-field>
              
              <v-select
                v-model="form.semester"
                :rules="rules.time"
                :items="semester"
                label="Fachsemester"
                required
              ></v-select>

              <v-select
                v-model="form.faculty"
                :items="this.$options.config.faculties"
                :rules="rules.faculty"
                label="Studiengang"
                required
              ></v-select>
            </v-card-text>

            <v-card-actions>
              <v-btn color="primary" @click="next" :disabled="!valid">Weiter</v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-stepper-content>

      <v-stepper-content step="2">
        <v-form ref="form_coursemath" v-model="valid2">
          <v-card>
            <v-card-title class="justify-center">
              <h2>Mathematik</h2>
            </v-card-title>

            <v-card-text>
              <v-select
                v-model="form.courses"
                :items="this.$options.config.courses_math"
                :rules="rules.course"
                chips
                label="Zu welchen Lehrveranstaltungen haben Sie heute gearbeitet?"
                item-text="name"
                item-value="tag"
                multiple
              >
                <template v-slot:selection="data">
                  <v-chip
                    :selected="data.selected"
                    close
                    class="chip--select-multi"
                    @input="remove(data.item)"
                  >{{ data.item.name }}</v-chip>
                </template>
                <template v-slot:item="data">
                  <template v-if="typeof data.item !== 'object'">
                    <v-list-tile-content v-text="data.item"></v-list-tile-content>
                  </template>
                  <template v-else>
                    <v-list-tile-content>
                      <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
                      <v-list-tile-sub-title v-html="data.item.group"></v-list-tile-sub-title>
                    </v-list-tile-content>
                  </template>
                </template>
              </v-select>
            </v-card-text>

            <v-card-title class="justify-center">
              <h2>Physik</h2>
            </v-card-title>

            <v-card-text>
              <v-select
                v-model="form.courses"
                :items="this.$options.config.courses_physics"
                :rules="rules.course"
                chips
                label="Zu welchen Lehrveranstaltungen haben Sie heute gearbeitet?"
                item-text="name"
                item-value="tag"
                multiple
              >
                <template v-slot:selection="data">
                  <v-chip
                    :selected="data.selected"
                    close
                    class="chip--select-multi"
                    @input="remove(data.item)"
                  >{{ data.item.name }}</v-chip>
                </template>

                <template v-slot:item="data">
                  <template v-if="typeof data.item !== 'object'">
                    <v-list-tile-content v-text="data.item"></v-list-tile-content>
                  </template>

                  <template v-else>
                    <v-list-tile-content>
                      <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
                      <v-list-tile-sub-title v-html="data.item.group"></v-list-tile-sub-title>
                    </v-list-tile-content>
                  </template>
                </template>
              </v-select>
            </v-card-text>

            <v-card-actions>
              <v-btn color="primary" @click="next" :disabled="!valid2">Weiter</v-btn>
              <v-btn flat @click.native="previous">Zurück</v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-stepper-content>

      <v-stepper-content step="3">
        <v-card>
          <v-card-text>
            <time-input v-model="form.start" :max="maxStartTime" label="Startzeit" required></time-input>
            <time-input v-model="form.end" label="Jetzt" disabled></time-input>
            <v-textarea
              v-model="form.comments"
              label="Kommentarfeld"
              no-resize
            ></v-textarea>
          </v-card-text>

          <v-dialog v-model="idhelper"  max-width="600">
            <v-card>
              <v-card-title class="headline">ID</v-card-title>
              <v-card-text>
                <p>Die ID setzt sich zusammen aus...</p> 
                <ul>
                  <li>den ersten 2 Buchstaben des Vornamens Ihrer Mutter.</li>
                  <li>den 2 Ziffern des Geburts<em>tags</em> Ihrer Mutter.</li>
                  <li>2 Ziffern Ihres eigenen Geburts<em>monats</em>.</li>
                  <li>2 Ziffern der Nummer Ihres Fachbereichs.</li>
                </ul>
              </v-card-text>
            </v-card>
          </v-dialog>

          <v-card-actions>
            <v-dialog v-model="dialog" persistent max-width="500">
              <template v-slot:activator="{ on }">
                <v-btn color="primary" v-on="on">Absenden</v-btn>
              </template>

              <v-card>
                <v-card-title class="headline" primary-title>Angaben bestätigen</v-card-title>
               
                <v-list>
                  <v-list-tile>
                    <v-list-tile-content>
                      <v-list-tile-sub-title>ID</v-list-tile-sub-title>
                      {{form.pid}}
                    </v-list-tile-content>
                  </v-list-tile>
                  <v-divider></v-divider>
                  <v-list-tile>
                    <v-list-tile-content>
                      <v-list-tile-sub-title>Studienfach</v-list-tile-sub-title>
                      {{form.faculty}}
                    </v-list-tile-content>

                    <v-list-tile-content>
                      <v-list-tile-sub-title>Fachsemester</v-list-tile-sub-title>
                      {{form.semester}}
                    </v-list-tile-content>
                  </v-list-tile>

                  <v-divider></v-divider>

                  <v-list-tile>
                    <v-list-tile-content>
                      <v-list-tile-sub-title>Startzeit</v-list-tile-sub-title>
                      {{form.start | formatTime}}
                    </v-list-tile-content>

                    <v-list-tile-content>
                      <v-list-tile-sub-title>Endzeit</v-list-tile-sub-title>
                      {{form.end | formatTime}}
                    </v-list-tile-content>
                  </v-list-tile>

                  <v-divider></v-divider>

                  <v-list-tile>
                    <v-list-tile-content>
                      <v-list-tile-sub-title>Lehrveranstaltungen</v-list-tile-sub-title>
                      {{form.courses | formatCourselist}}
                    </v-list-tile-content>
                  </v-list-tile>
                </v-list>

                <v-card-text>Sind die Angaben korrekt?</v-card-text>

                <v-card-actions>
                  <v-btn class="primary" @click="submit">Ja</v-btn>
                  <v-btn @click="dialog = false" flat>Nein</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
            <v-btn flat @click.native="stepper -= 1">Zurück</v-btn>
          </v-card-actions>
        </v-card>
      </v-stepper-content>
    </v-stepper-items>
  </v-stepper>
</template>

<script>
import { format, subHours, subMinutes, setMinutes, setHours, isBefore } from "date-fns";
import TimeInput from "@/components/TimeInput.vue";
import uuid from "uuid/v4";
import configuration from '../assets/courses_ws.json'

function initializeForm() {
  return {
    pid: "",
    start: isBefore(setHours(new Date(),8), subHours(new Date(),2)) ? subHours(new Date(),2) : (setHours(setMinutes(new Date(),0),8)),
    end: new Date(),
    faculty: null,
    semester: "",
    courses: [],
    comments: ""
  };
}
export default {
  config: configuration,
  components: { TimeInput },
  data: function() {
    return {
      stepper: 0,
      steps: [
        {
          label: "Persönliche ID",
          completed: false
        },
        {
          label: "Lehrveranstaltungen",
          completed: false
        },
        {
          label: "Zeitangabe",
          completed: false
        }
      ],
      interval: null,
      form: initializeForm(),
      courses_selected: [],
      semester: ["1", "2", "3", "4", "5", "6", "7+"],
      dialog: false,
      idhelper: false,
      valid: true,
      valid2: true,
      disabled: 0,
      rules: {
        pid: [
          v => !!v || "Bitte geben Sie Ihre persönlichen 8 stellige ID an",
          v => v.length === 8 || "Ihre ID muss 8 Zeichen lang sein"
        ],
        time: [v => !!v || "Bitte geben Sie Ihre Anwesenheitszeit an"],
        course: [
          v => v.length > 0 || "Bitte wählen Sie mindestens eine Lehrveranstaltung aus"
        ],
        semester: [v => !!v || "Bitte geben Sie Ihr aktuelles Fachsemester an"],
        faculty: [v => !!v || "Bitte geben Sie Ihren Studiengang an"]
      }
    };
  },
  created() {
    // Create an interval to update current time every 1000ms
    this.interval = setInterval(() => this.setEndTime(), 1000);
  },
  destroyed() {
    // Cleanup interval when we leave the page.
    clearInterval(this.interval);
  },
  computed: {
    maxStartTime() {
      return format(subMinutes(this.form.end, 10), "HH:mm");
    },
    localizedForm() {
      return {
        ...this.form,
        start: this.form.start.toString(),
        end: this.form.end.toString()
      };
    }
  },
  filters: {
    formatTime(time) {
      return format(time, "HH:mm")
    },
    formatCourselist(courselist) {
      return courselist.join(", ")
    }
  },
  methods: {
    remove(item) {
      const index = this.form.courses.indexOf(item.name);
      if (index >= 0) {
        this.form.courses.splice(index, 1);
      }
    },
    setEndTime() {
      this.form.end = new Date();
    },
    validate() {
      if (this.stepper == 2) {
        this.$refs.form_coursemath.validate();

        if (this.valid2 && this.form.courses.length > 0) {
          this.$refs.form_coursemath.resetValidation();
          return true;
        }
      }

      if (this.stepper == 1) {
        this.$refs.form_studinfo.validate();

        if (this.valid) {
          this.$refs.form_studinfo.resetValidation();
          return true;
        }
      }

      return false;
    },
    next() {
      this.validate()

      this.stepper += 1;
    },
    previous() {
      this.stepper -= 1;
      this.$refs.form_coursemath.resetValidation();
    },
    submit() {
      this.$store.dispatch("submitForm", {
        ...this.localizedForm,
        id: uuid()
      });
      this.form = initializeForm();
      this.$refs.form_studinfo.resetValidation();
      this.$refs.form_coursemath.resetValidation();
      this.dialog = false;
      this.valid = false;
      this.stepper = 1;
    }
  }
};
</script>
