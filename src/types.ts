export enum ADMType {
  HOME_SCHOOLING = "Home Schooling",
  OHSP = "OHSP",
  MODULAR_PRINT = "Modular-Print",
  MODULAR_DIGITAL = "Modular-Digital",
  RADIO_BASED = "Radio-Based",
  TV_BASED = "TV-Based"
}

export enum StudentStatus {
  ACTIVE = "Active",
  DROPPED = "Dropped",
  TRANSFERRED = "Transferred",
  GRADUATED = "Graduated"
}

export enum UserRole {
  ADMIN = "Admin",
  SCHOOL_COORDINATOR = "School-Coordinator",
  DISTRICT_COORDINATOR = "District-Coordinator"
}

export interface Student {
  id?: string;
  lrn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gradeLevel: string;
  section: string;
  admType: ADMType;
  status: StudentStatus;
  schoolId: string;
  enrolledAt: string;
  updatedAt: string;
  remarks?: string;
}

export interface School {
  id: string;
  name: string;
  district: string;
  contactEmail?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  district?: string;
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
