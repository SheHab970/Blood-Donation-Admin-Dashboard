// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface LoginResponse {
  accessToken: string;
  // The API returns a JWT — all claims are decoded from it
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
  statistics: DonationsStatistics;  // ✅ new
  donations: {                       // ✅ nested object, not root level
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    data: T[];                       // ✅ actual items array
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
  id: string; // UUID
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
  date: string; // ISO date string
  hospitalName?: string;
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


export interface DonationsStatistics {
  totalDonations: number;
  totalQuantity: number;
}


// ─── Inventory ────────────────────────────────────────────────────────────────

export type InventoryStatus = 'AVAILABLE' | 'LOW' | 'CRITICAL';

export interface BloodInventoryItem {
  bloodType: string;
  quantity: number;
  status: InventoryStatus;
  expirationDate: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  name: string;
  bloodType: string;
  phone: string;
  lastDonation: string;
  points: number;
  status: UserStatus;
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
  qrImageBase64?: string; // some APIs return base64 image
}

export interface QrScanRequest {
  qrToken: string;
}

export interface QrScanResponse {
  success: boolean;
  message: string;
  donorName?: string;
  bloodType?: string;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
