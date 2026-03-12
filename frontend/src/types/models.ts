// Centralized DB model types for frontend (shared across hooks/components)

export interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  social_accounts: SocialAccount[];
}

export interface SocialAccount {
  provider: string;
  email: string | null;
  linked_at: string;
}

export interface Car {
  id: string;
  owner_id: string;
  name: string;
  layout: 'Sedan' | 'Coupe' | 'Minivan';
  layout_label?: string;
  owner_name?: string;
  seats?: unknown[]; // SeatData is UI-only, type in consumer if needed
}

export interface CarFormData {
  name: string;
  layout: string;
}

export interface PassengerOut {
  user_id: string;
  seat_position: number;
  full_name: string | null;
  avatar_url: string | null;
}

export interface RideOut {
  id: string;
  car_id: string;
  car_driver_id: string;
  driver_user_id: string;
  departure_time: string;
  destination: string;
  created_at: string;
  passengers: PassengerOut[];
  car: Car | null;
}

export interface RideCreate {
  car_id: string;
  departure_time: string;
  destination: string;
}

export interface RideUpdate {
  departure_time: string;
  destination: string;
}

export interface Invitation {
  invited_email: string;
  status: "Pending" | "Accepted" | "Rejected";
  created_at: string;
  token: string;
  ride_id: string;
}
