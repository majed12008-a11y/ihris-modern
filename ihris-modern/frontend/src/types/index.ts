export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export interface Person {
  id: number;
  surname: string;
  firstname: string;
  othername: string | null;
  nationalityId: number | null;
  countryId: number | null;
  districtId: number | null;
  countyId: number | null;
  residenceCountryId: number | null;
  residenceDistrictId: number | null;
  residenceCountyId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonCreateInput {
  surname: string;
  firstname: string;
  othername?: string | null;
  nationalityId?: number | null;
  countryId?: number | null;
  districtId?: number | null;
  countyId?: number | null;
  residenceCountryId?: number | null;
  residenceDistrictId?: number | null;
  residenceCountyId?: number | null;
}

export interface Position {
  id: number;
  code: string | null;
  jobId: number | null;
  title: string | null;
  description: string | null;
  proposedSalary: string | null;
  source: string | null;
  supervisorId: number | null;
  facilityId: number | null;
  departmentId: number | null;
  posTypeId: number | null;
  proposedEndDate: string | null;
  proposedHiringDate: string | null;
  statusId: number | null;
  postedDate: string | null;
  comments: string | null;
  interviewComments: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: number;
  name: string;
  facilityTypeId: number | null;
  districtId: number | null;
  countyId: number | null;
  countryId: number | null;
  regionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
