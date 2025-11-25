export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  tags: string[];
  aiContext: string; // Specific context for the Gemini AI about this project
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
