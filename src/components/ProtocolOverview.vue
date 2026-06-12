<template>
  <v-sheet border rounded>
    <v-data-table
      :headers="headers"
      :items="rows"
      expand-strategy="single"
      item-value="matriculationNumber"
      hide-default-footer
      show-expand
    >
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-sheet class="ma-2" rounded="lg" border>
              <div>
                <p>Details for {{ item.firstName }} {{ item.name }}</p>
              </div>
            </v-sheet>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-sheet>
</template>

<script setup lang="ts">
interface ProtocolRow {
  name: string;
  firstName: string;
  matriculationNumber: string;
  labPartner: string;
  status: string;
}

const headers: {
  title: string;
  key: string;
  align: "start" | "end" | "center";
  width: string;
}[] = [
  { title: "Name", key: "name", align: "start", width: "40%" },
  { title: "First Name", key: "firstName", align: "start", width: "40%" },
  {
    title: "Matriculation Number",
    key: "matriculationNumber",
    align: "start",
    width: "20%",
  },
  { title: "Lab Partner", key: "labPartner", align: "start", width: "20%" },
  { title: "Status", key: "status", align: "start", width: "20%" },
];

const rows: ProtocolRow[] = [
  {
    name: "Doe",
    firstName: "John",
    matriculationNumber: "1234567890",
    labPartner: "Jane Doe",
    status: "pending",
  },
  {
    name: "Doe",
    firstName: "Jane",
    matriculationNumber: "1234565890",
    labPartner: "John Doe",
    status: "accepted",
  },
];
</script>
