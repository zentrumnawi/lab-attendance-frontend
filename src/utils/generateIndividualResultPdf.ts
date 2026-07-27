import jsPDF from "jspdf";

export interface IndividualResultPdfData {
  firstName: string;
  lastName: string;
  email: string;
  matriculationNumber: string;
  department: string;
  groupName: string;
  papersCompleted: string;
  exercisesCompleted: string;
  labAttendanceCount: string;
  lectureAttendanceCount: string;
  experimentsCompleted: string;
  comment: string;
}

const MARGIN = 14;
const LINE_HEIGHT = 7;
const PAGE_HEIGHT = 297;

function addSection(
  doc: jsPDF,
  title: string,
  rows: [string, string][],
  startY: number,
): number {
  let y = startY;

  if (y > PAGE_HEIGHT - 40) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, MARGIN, y);
  y += LINE_HEIGHT + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  for (const [label, value] of rows) {
    if (y > PAGE_HEIGHT - 20) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, MARGIN, y);
    doc.setFont("helvetica", "normal");

    const lines = doc.splitTextToSize(value || "—", 110);
    doc.text(lines, 90, y);
    y += Math.max(LINE_HEIGHT, lines.length * LINE_HEIGHT);
  }

  return y + 4;
}

export function generateIndividualResultPdf(
  data: IndividualResultPdfData,
): jsPDF {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("de-DE");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Ergebnisübersicht", MARGIN, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Datum: ${date}`, MARGIN, 28);
  doc.text(`Matrikelnummer: ${data.matriculationNumber || "—"}`, MARGIN, 32);

  let y = 44;

  y = addSection(
    doc,
    "Allgemeine Daten",
    [
      ["Vorname", data.firstName],
      ["Nachname", data.lastName],
      ["E-Mail-Adresse", data.email],
      ["Matrikelnummer", data.matriculationNumber],
      ["Studiengang", data.department],
      ["Gruppe", data.groupName],
    ],
    y,
  );

  y = addSection(
    doc,
    "Anwesenheit und Leistung",
    [
      ["Anzahl akzeptierter Protokolle", data.papersCompleted],
      ["Anzahl akzeptierter Übungsblätter", data.exercisesCompleted],
      ["Anzahl besuchter Labortage", data.labAttendanceCount],
      ["Anzahl besuchter Seminarsitzungen", data.lectureAttendanceCount],
      ["Anzahl absolvierter Versuche", data.experimentsCompleted],
    ],
    y,
  );

  addSection(doc, "Zusätzliche Kommentare", [["Kommentar", data.comment]], y);

  return doc;
}

export function downloadIndividualResultPdf(
  data: IndividualResultPdfData,
): void {
  const doc = generateIndividualResultPdf(data);
  const filename = `Ergebnis_${data.matriculationNumber || "unbekannt"}.pdf`;
  doc.save(filename);
}
