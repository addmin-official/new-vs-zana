import {
  StudyRoomData,
  StudyRoomSummary,
  RoomCheer,
  RoomMilestone,
  FocusStatus,
} from "../server/rooms/StudyRoomTypes.ts";

const API_BASE = "/api/study-rooms";

export async function fetchStudyRooms(grade?: string): Promise<StudyRoomSummary[]> {
  const url = grade ? `${API_BASE}?grade=${encodeURIComponent(grade)}` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch study rooms");
  const data = (await res.json()) as { rooms: StudyRoomSummary[] };
  return data.rooms || [];
}

export async function fetchStudyRoom(roomId: string): Promise<StudyRoomData> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(roomId)}`);
  if (!res.ok) throw new Error("Failed to fetch study room details");
  const data = (await res.json()) as { room: StudyRoomData };
  return data.room;
}

export async function joinStudyRoom(
  roomId: string,
  student: {
    id: string;
    name: string;
    grade: string;
    currentConcept?: string;
    goal?: string;
    status?: FocusStatus;
  }
): Promise<StudyRoomData> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(roomId)}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error("Failed to join study room");
  const data = (await res.json()) as { room: StudyRoomData };
  return data.room;
}

export async function leaveStudyRoom(roomId: string, studentId: string): Promise<void> {
  await fetch(`${API_BASE}/${encodeURIComponent(roomId)}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId }),
  }).catch(() => {});
}

export async function sendStudyHeartbeat(
  roomId: string,
  data: {
    studentId: string;
    currentConcept?: string;
    focusMinutes?: number;
    status?: FocusStatus;
    goal?: string;
  }
): Promise<StudyRoomData> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(roomId)}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to send heartbeat");
  const json = (await res.json()) as { room: StudyRoomData };
  return json.room;
}

export async function sendStudyCheer(
  roomId: string,
  cheer: {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    message: string;
    emoji?: string;
  }
): Promise<RoomCheer> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(roomId)}/cheer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cheer),
  });
  if (!res.ok) throw new Error("Failed to send study encouragement");
  const json = (await res.json()) as { cheer: RoomCheer };
  return json.cheer;
}

export async function recordStudyMilestone(
  roomId: string,
  milestone: {
    studentName: string;
    concept: string;
    text: string;
  }
): Promise<RoomMilestone> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(roomId)}/milestone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(milestone),
  });
  if (!res.ok) throw new Error("Failed to record milestone");
  const json = (await res.json()) as { milestone: RoomMilestone };
  return json.milestone;
}
