export type UserRole = 'Admin' | 'Staff' | 'Tourist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username: string;
  nationality?: string;
  ageGroup?: string;
}

export interface TouristDestination {
  id: string;
  name: string;
  category: 'Beach' | 'Island' | 'Spring' | 'Heritage' | 'Adventure';
  description: string;
  location: string;
  averageRating: number;
  totalReviews: number;
}

export type QuestionCategory = 'Accommodation' | 'Cleanliness' | 'Safety' | 'Hospitality' | 'Accessibility' | 'Attraction Quality';
export type QuestionType = 'rating' | 'text' | 'yes_no';

export interface SurveyQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  type: QuestionType;
  isActive: boolean;
}

export interface SurveyResponse {
  id: string;
  touristName: string;
  touristEmail?: string;
  nationality: string;
  ageGroup: string;
  dateSubmitted: string;
  destinationId: string;
  answers: Record<string, any>; // questionId -> value (number for rating, boolean for yes_no, string for text)
  feedbackText: string;
  overallRating: number; // 1-5 calculated average
  encodedBy?: string; // 'self' or staff member name
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userRole: UserRole;
  actorName: string;
  action: string;
  details: string;
}

export interface GeminiResponseAnalysis {
  overallSatisfaction: string; // Brief headline summary
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  destinationInsights: {
    destinationName: string;
    insight: string;
    recommendation: string;
  }[];
  strategicRecommendations: string[];
  generatedAt: string;
}
