export type FocusStatus = "deep_focus" | "solving" | "review" | "break";

export interface RoomParticipant {
  id: string;
  name: string;
  grade: string;
  avatarColor: string;
  currentConcept: string;
  subjectKey: string;
  joinedAt: number;
  lastHeartbeat: number;
  focusMinutes: number;
  status: FocusStatus;
  goal?: string;
}

export interface RoomCheer {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  message: string;
  emoji: string;
  timestamp: number;
}

export interface RoomMilestone {
  id: string;
  studentName: string;
  concept: string;
  text: string;
  timestamp: number;
}

export interface StudyRoomData {
  id: string;
  title: string;
  subjectKey: string;
  subjectNameKu: string;
  grade: string;
  featuredConcept: string;
  participants: RoomParticipant[];
  cheers: RoomCheer[];
  milestones: RoomMilestone[];
  activeCount: number;
}

export interface StudyRoomSummary {
  id: string;
  title: string;
  subjectKey: string;
  subjectNameKu: string;
  grade: string;
  featuredConcept: string;
  activeCount: number;
  recentActiveNames: string[];
}
