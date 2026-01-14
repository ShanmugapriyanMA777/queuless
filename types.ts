
export enum ViewType {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: ViewType;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  averageServiceTime: number; // in minutes
}

export interface Business {
  id: string;
  owner_id?: string;
  name: string;
  category: string;
  location: string;
  services: Service[];
  imageUrl: string;
  isLiked?: boolean;
}

export interface QueueToken {
  id: string;
  businessId: string;
  serviceId: string;
  tokenNumber: string;
  position: number;
  status: 'WAITING' | 'SERVING' | 'COMPLETED' | 'CANCELLED';
  joinedAt: Date;
  notes?: string;
  userId?: string;
  business_name?: string; // For profile view
  customer_name?: string; // For owner view
}

export interface Inquiry {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  user_id?: string;
}

export interface QueueState {
  tokens: QueueToken[];
}
