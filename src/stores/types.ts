export interface Attendee {
  id: string;
  name: string;
  firstName: string;
  studentId: string;
  email: string;
  labPartner: string;
  [key: string]: any;
}

export interface Department {
  id: string;
  name: string;
}

export interface Exercise {
  id: string;
  name: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
}
