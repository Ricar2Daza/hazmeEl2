export type JobStatus = 'ABIERTO' | 'EN_PROGRESO' | 'FINALIZADO' | 'CANCELADO';
export type ApplicationStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
export type NotificationType = 'NEW_APPLICATION' | 'APPLICATION_ACCEPTED' | 'APPLICATION_REJECTED' | 'JOB_UPDATED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  phone?: string | null;
  companyName?: string | null;
  portfolioUrl?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  skills: string[];
  locationAddress?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  locationAddress: string;
  locationLat: number;
  locationLng: number;
  budgetMin: number;
  budgetMax: number;
  deadlineDate: string;
  categoryId: string;
  publisherId: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  publisher?: User;
  category?: Category;
  applications?: Application[];
  _count?: { applications: number };
  myApplication?: Application | null;
}

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  message?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  job?: Job;
  applicant?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedJobId?: string | null;
  read: boolean;
  createdAt: string;
  relatedJob?: Job | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
  count?: number;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}
