export interface Admin {
  id: string;
  name: string;
  email: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cnic: string;
  address?: string;
  driverLicense?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  type: 'Sedan' | 'SUV' | 'Truck' | 'Van' | 'Motorcycle' | 'Other';
  dailyRate: number;
  status: 'available' | 'booked' | 'maintenance';
  color?: string;
  mileage?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  customer: Customer;
  vehicle: Vehicle;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalVehicles: number;
  totalBookings: number;
  availableVehicles: number;
  activeBookings: number;
  totalRevenue: number;
  recentBookings: Booking[];
  bookingsByStatus: { _id: string; count: number }[];
  vehiclesByStatus: { _id: string; count: number }[];
  monthlyRevenue: { _id: { year: number; month: number }; revenue: number; bookings: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
