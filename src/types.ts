export type SubmissionStatus = "submitted" | "shortlisted" | "winner";

export interface Submission {
  id: string;
  project_title: string;
  category: string[];
  short_description: string;
  full_description: string;
  author_name: string;
  email: string;
  country: string;
  other_credits?: string;
  image_urls: string[];
  video_url?: string;
  payment_status: "pending" | "completed";
  submission_status: SubmissionStatus;
  created_at: any;
  is_featured: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
}

export interface Category {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
}
