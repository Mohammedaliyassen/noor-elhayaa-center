// PocketBase-ready types with tenant_id for SaaS architecture

export interface BaseModel {
  id: string;
  created: string;
  updated: string;
  tenant_id: string;
}

export interface User extends BaseModel {
  email: string;
  name: string;
  avatar?: string;
  role: "super_admin" | "doctor" | "patient";
}

export interface Patient extends BaseModel {
  user_id: string;
  doctor_id: string;
  phone: string;
  date_of_birth?: string;
  medical_history?: string;
}

export interface Article extends BaseModel {
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  slug: string;
  cover_image: string;
  category: string;
  author_id: string;
  author_name_ar: string;
  author_name_en: string;
  published: boolean;
  likes_count: number;
  comments_count: number;
  tags: string[];
}

export interface Comment extends BaseModel {
  article_id: string;
  user_id: string;
  user_name: string;
  content: string;
}

export interface Like extends BaseModel {
  article_id: string;
  user_id: string;
}

export interface Appointment extends BaseModel {
  patient_name: string;
  phone: string;
  problem_description: string;
  service_type: "physiotherapy" | "nutrition" | "consultation";
  preferred_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  doctor_id: string;
}

export interface Offer extends BaseModel {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image: string;
  discount_percentage?: number;
  valid_until: string;
  active: boolean;
}

export interface DietPlan extends BaseModel {
  patient_id: string;
  doctor_id: string;
  title: string;
  content: string;
  start_date: string;
  end_date?: string;
}

export interface WorkoutPlan extends BaseModel {
  patient_id: string;
  doctor_id: string;
  title: string;
  content: string;
  start_date: string;
  end_date?: string;
}

export interface Message extends BaseModel {
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
}
