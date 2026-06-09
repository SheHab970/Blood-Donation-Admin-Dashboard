// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
  user: {
    id:       string;
    email:    string;
    fullName: string;
    role:     string;
  };
  message: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken:   string;
  refreshToken?: string;
  expiresIn?:    number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  currentPage: number;
  pageSize: number;
}

export interface DonationsStatistics {
  totalDonations: number;
  totalQuantity: number;
}

export interface PaginatedResponse<T> {
  statistics: DonationsStatistics;
  donations: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    data: T[];
  };
}

// ─── Hospital ─────────────────────────────────────────────────────────────────

export interface Hospital {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export interface CreateHospitalRequest {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export interface UpdateHospitalRequest {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
}

// ─── Hospital Admin ───────────────────────────────────────────────────────────

export interface HospitalAdmin {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  hospitalId: number;
  hospitalName?: string;
}

export interface CreateHospitalAdminRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  hospitalId: number;
}

export interface UpdateHospitalAdminRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  hospitalId: number;
}

// ─── Blood Request ────────────────────────────────────────────────────────────

export type status = 'Pending' | 'Approved' | 'Rejected' | 'Completed';
export type UrgencyLevel = 'Emergency' | 'High' | 'Medium' | 'Low';

export interface BloodRequest {
  id: number;
  patientName: string;
  bloodType: string;
  quantity: number;
  status: status;
  urgency: UrgencyLevel;
  date: string;
  hospitalName?: string;
}

export interface RequestsStatistics {
  totalRequests: number;
  openRequests: number;
  fulfilledRequests: number;
  completedRequests: number;
}

// ─── Donation ─────────────────────────────────────────────────────────────────

export interface Donation {
  id: number;
  userId: string;
  donorName: string;
  createdAt: string;
  time: string;
  bloodType: string;
  quantity: number;
  status: status;
  hospitalName?: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type InventoryStatus = 'High' | 'Low' | 'Critical' | 'Empty';

export interface BloodInventoryItem {
  bloodType: string;
  quantity: number;
  nearestExpiryDate: string;
  status: InventoryStatus;
}

// ─── Users ────────────────────────────────────────────────────────────────────
 
export type UserStatus = 'ACTIVE' | 'INACTIVE';
 
export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  bloodType: string;
  points: number;
  lastDonation: string;
  status: string;
}
 
export interface UsersResponse {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  data: User[];
}
 
export interface PaginationParams {
  currentPage: number;
  pageSize: number;
}
 
// ─── Rewards ──────────────────────────────────────────────────────────────────

export interface Reward {
  id: number;
  title: string;
  description: string;
  pointsRequired: number;
}

export interface CreateRewardRequest {
  title: string;
  description: string;
  pointsRequired: number;
}

export interface UpdateRewardRequest {
  title: string;
  description: string;
  pointsRequired: number;
}

// ─── QR System ───────────────────────────────────────────────────────────────

export interface QrTokenResponse {
  qrToken: string;
  qrImageBase64?: string;
}

export interface QrScanRequest {
  qrToken: string;
}

export interface QrScanResponse {
  success?: boolean;
  message: string;
  donorName?: string;
  userName?: string;       // ← reward API returns userName not donorName
  bloodType?: string;
  status?: string;         // ← reward API returns status: "Used"
  rewardTitle?: string;
  rewardRedemptionId?: number;
  usedAt?: string;
}

// ─── Blood Demand Predictions ────────────────────────────────────────────────

export interface PredictionEntry {
  bloodType:        string;
  currentStock:     number;
  requiredUnits:    number;
  daysOfCoverage:   number;
  shortageExpected: boolean;
  predictionMethod: string;
}

export interface PredictionsResponse {
  horizonDays:         number;
  demandLevel:         string;
  totalExpectedUnits:  number;
  totalUnitsRequired:  number;
  overallAccuracy:     number;
  predictions:         PredictionEntry[];
}

// ─── API Error ───────────────────────────────────────────────────────────────
