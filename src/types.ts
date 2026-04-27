export type Gender = 'Male' | 'Female';
export type Grade = 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10' | 'Grade 11' | 'Grade 12';
export type ReasonForADM = 'Distance' | 'Work' | 'Health' | 'Family Problems' | 'Others';
export type AcademicStatus = '(90-100) Outstanding' | '(85-89) Very Satisfactory' | '(80-84) Satisfactory' | '(75-79) Fairly Satisfactory' | '(Below 75) Did not meet expectations';
export type Assessment = 'Pending' | 'Continue ADM' | 'Back to Regular Class';

export interface StudentRecord {
  id: string;
  district: string;
  school: string;
  studentName: string;
  lastName: string;
  firstName: string;
  middleInitial?: string;
  suffix?: string;
  gender: Gender;
  grade: Grade;
  reasonForADM: ReasonForADM;
  academicStatus: AcademicStatus;
  assessment: Assessment;
  duration: string;
  startDate: string;
  endDate: string;
  createdAt: number;
  createdBy: string;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  district: string;
  school: string;
  role: 'admin' | 'user';
  createdAt: number;
  congressionalDistrict?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
