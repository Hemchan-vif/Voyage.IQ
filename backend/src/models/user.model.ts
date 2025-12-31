export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'Traveler' | 'Admin';
  contact_info?: string;
  created_at?: Date;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: 'Traveler' | 'Admin';
  contact_info?: string;
  created_at?: Date;
}
