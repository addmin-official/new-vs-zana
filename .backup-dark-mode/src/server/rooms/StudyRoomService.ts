import {
  StudyRoomData,
  StudyRoomSummary,
  RoomParticipant,
  RoomCheer,
  RoomMilestone,
  FocusStatus,
} from "./StudyRoomTypes.ts";

interface InternalRoom {
  id: string;
  title: string;
  subjectKey: string;
  subjectNameKu: string;
  grade: string;
  featuredConcept: string;
  participants: Map<string, RoomParticipant>;
  cheers: RoomCheer[];
  milestones: RoomMilestone[];
}

const AVATAR_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

function getRandomColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const DEFAULT_ROOMS: Omit<InternalRoom, "participants" | "cheers" | "milestones">[] = [
  {
    id: "chem-grade12",
    title: "ژووری کیمیای پۆلی ١٢",
    subjectKey: "chemistry",
    subjectNameKu: "کیمیا",
    grade: "12",
    featuredConcept: "هاوکێشەی ترش و تفتەکان و هاوسەنگی",
  },
  {
    id: "phys-grade12",
    title: "ژووری فیزیای پۆلی ١٢",
    subjectKey: "physics",
    subjectNameKu: "فیزیا",
    grade: "12",
    featuredConcept: "لەیزەر و تیشکی ئێکس و تەوژمی کارەبایی",
  },
  {
    id: "bio-grade12",
    title: "ژووری زیندەزانی پۆلی ١٢",
    subjectKey: "biology",
    subjectNameKu: "زیندەزانی",
    grade: "12",
    featuredConcept: "بۆماوەزانی، DNA و دابەشبوونی خانە",
  },
  {
    id: "math-grade12",
    title: "ژووری بیرکاری پۆلی ١٢",
    subjectKey: "mathematics",
    subjectNameKu: "بیرکاری",
    grade: "12",
    featuredConcept: "تەواوکاری، لێکردنەوە و نەخشە لۆگاریتمییەکان",
  },
  {
    id: "krd-grade12",
    title: "ژووری زمانی کوردی پۆلی ١٢",
    subjectKey: "kurdish",
    subjectNameKu: "کوردی",
    grade: "12",
    featuredConcept: "ڕێزمانی کوردی، ئەدەب و مێژووی دەقی ئەدەبی",
  },
  {
    id: "chem-grade11",
    title: "ژووری کیمیای پۆلی ١١",
    subjectKey: "chemistry",
    subjectNameKu: "کیمیا",
    grade: "11",
    featuredConcept: "بەندی کیمیایی، خولگەی ئەتۆمی و تێڕوانینی ئەتۆم",
  },
  {
    id: "phys-grade11",
    title: "ژووری فیزیای پۆلی ١١",
    subjectKey: "physics",
    subjectNameKu: "فیزیا",
    grade: "11",
    featuredConcept: "بزووتنی چەماوەیی و یاسای کێشکردنی نیوتن",
  },
  {
    id: "math-grade10",
    title: "ژووری بیرکاری پۆلی ١٠",
    subjectKey: "mathematics",
    subjectNameKu: "بیرکاری",
    grade: "10",
    featuredConcept: "هاوکێشەی دووجا و نەخشەی هێڵی",
  },
];

export class StudyRoomService {
  private static rooms = new Map<string, InternalRoom>();
  private static seeded = false;

  private static ensureInitialized() {
    if (this.seeded) return;
    this.seeded = true;

    for (const def of DEFAULT_ROOMS) {
      const room: InternalRoom = {
        ...def,
        participants: new Map(),
        cheers: [],
        milestones: [],
      };

      // Add seed classmates to create a warm community for students
      const now = Date.now();
      if (def.id === "chem-grade12") {
        room.participants.set("peer_sara", {
          id: "peer_sara",
          name: "سارا ئەحمەد",
          grade: "12",
          avatarColor: "#EC4899",
          currentConcept: "هاوکێشەی ترش و تفتەکان",
          subjectKey: "chemistry",
          joinedAt: now - 18 * 60 * 1000,
          lastHeartbeat: now,
          focusMinutes: 18,
          status: "deep_focus",
          goal: "شیکارکردنی پرسیارە وزارییەکانی ٢٠٢٣",
        });
        room.participants.set("peer_rebin", {
          id: "peer_rebin",
          name: "ڕێبین کامەران",
          grade: "12",
          avatarColor: "#3B82F6",
          currentConcept: "کیمیای ئەندامی",
          subjectKey: "chemistry",
          joinedAt: now - 32 * 60 * 1000,
          lastHeartbeat: now,
          focusMinutes: 32,
          status: "solving",
          goal: "پیاچوونەوەی هایدرۆکاربۆنەکان",
        });
        room.milestones.push({
          id: "m1",
          studentName: "سارا ئەحمەد",
          concept: "هاوکێشەی ترش و تفتەکان",
          text: "٥ پرسیاری وزاری بە سەرکەوتوویی شیکار کرد",
          timestamp: now - 5 * 60 * 1000,
        });
      } else if (def.id === "phys-grade12") {
        room.participants.set("peer_darya", {
          id: "peer_darya",
          name: "دەریا عومەر",
          grade: "12",
          avatarColor: "#10B981",
          currentConcept: "لەیزەر و تیشکی ئێکس",
          subjectKey: "physics",
          joinedAt: now - 15 * 60 * 1000,
          lastHeartbeat: now,
          focusMinutes: 15,
          status: "deep_focus",
          goal: "تێگەیشتن لە ئاستەکانی وزە لە لەیزەردا",
        });
        room.milestones.push({
          id: "m2",
          studentName: "دەریا عومەر",
          concept: "لەیزەر و تیشکی ئێکس",
          text: "تەواوکردنی تاقیکردنەوەی خێرای چەمکی لەیزەر",
          timestamp: now - 8 * 60 * 1000,
        });
      } else if (def.id === "math-grade12") {
        room.participants.set("peer_zhiyan", {
          id: "peer_zhiyan",
          name: "ژیان بەرزان",
          grade: "12",
          avatarColor: "#8B5CF6",
          currentConcept: "تەواوکاری دیاریکراو",
          subjectKey: "mathematics",
          joinedAt: now - 24 * 60 * 1000,
          lastHeartbeat: now,
          focusMinutes: 24,
          status: "solving",
          goal: "شیکارکردنی ڕاهێنانەکانی بەشی ٤",
        });
      }

      this.rooms.set(def.id, room);
    }
  }

  private static cleanupInactive(room: InternalRoom) {
    const now = Date.now();
    // Expose participants active in the last 90 seconds (allow peer seeds to stay refreshed)
    for (const [id, p] of room.participants.entries()) {
      if (id.startsWith("peer_")) {
        // Keep seed peers active by updating heartbeat periodically
        p.lastHeartbeat = now;
        continue;
      }
      if (now - p.lastHeartbeat > 90_000) {
        room.participants.delete(id);
      }
    }
  }

  public static listRooms(grade?: string): StudyRoomSummary[] {
    this.ensureInitialized();
    const result: StudyRoomSummary[] = [];

    for (const room of this.rooms.values()) {
      this.cleanupInactive(room);
      if (grade && room.grade !== grade) {
        continue;
      }

      const participants = Array.from(room.participants.values());
      result.push({
        id: room.id,
        title: room.title,
        subjectKey: room.subjectKey,
        subjectNameKu: room.subjectNameKu,
        grade: room.grade,
        featuredConcept: room.featuredConcept,
        activeCount: participants.length,
        recentActiveNames: participants.slice(0, 3).map((p) => p.name),
      });
    }

    return result;
  }

  public static getRoom(roomId: string): StudyRoomData | null {
    this.ensureInitialized();
    const room = this.rooms.get(roomId);
    if (!room) return null;

    this.cleanupInactive(room);

    const participants = Array.from(room.participants.values()).sort(
      (a, b) => b.focusMinutes - a.focusMinutes
    );

    return {
      id: room.id,
      title: room.title,
      subjectKey: room.subjectKey,
      subjectNameKu: room.subjectNameKu,
      grade: room.grade,
      featuredConcept: room.featuredConcept,
      participants,
      cheers: room.cheers.slice(-20), // Last 20 cheers
      milestones: room.milestones.slice(-15), // Last 15 milestones
      activeCount: participants.length,
    };
  }

  public static joinRoom(
    roomId: string,
    student: {
      id: string;
      name: string;
      grade: string;
      currentConcept?: string;
      goal?: string;
      status?: FocusStatus;
    }
  ): StudyRoomData | null {
    this.ensureInitialized();
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const now = Date.now();
    const existing = room.participants.get(student.id);

    const participant: RoomParticipant = {
      id: student.id,
      name: student.name || "قوتابی",
      grade: student.grade || room.grade,
      avatarColor: existing?.avatarColor || getRandomColor(student.id || student.name),
      currentConcept: student.currentConcept || existing?.currentConcept || room.featuredConcept,
      subjectKey: room.subjectKey,
      joinedAt: existing?.joinedAt || now,
      lastHeartbeat: now,
      focusMinutes: existing?.focusMinutes || 0,
      status: student.status || existing?.status || "deep_focus",
      goal: student.goal || existing?.goal,
    };

    room.participants.set(student.id, participant);

    // Record milestone when joining
    if (!existing) {
      room.milestones.push({
        id: `m_${now}_${Math.random().toString(36).substring(2, 6)}`,
        studentName: participant.name,
        concept: participant.currentConcept,
        text: `پەیوەندی بە ژوورەکەوە کرد بۆ خوێندنی: ${participant.currentConcept}`,
        timestamp: now,
      });
    }

    return this.getRoom(roomId);
  }

  public static leaveRoom(roomId: string, studentId: string): boolean {
    this.ensureInitialized();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    return room.participants.delete(studentId);
  }

  public static heartbeat(
    roomId: string,
    studentId: string,
    data: {
      currentConcept?: string;
      focusMinutes?: number;
      status?: FocusStatus;
      goal?: string;
    }
  ): StudyRoomData | null {
    this.ensureInitialized();
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const p = room.participants.get(studentId);
    if (p) {
      p.lastHeartbeat = Date.now();
      if (data.currentConcept) p.currentConcept = data.currentConcept;
      if (typeof data.focusMinutes === "number") p.focusMinutes = data.focusMinutes;
      if (data.status) p.status = data.status;
      if (data.goal !== undefined) p.goal = data.goal;
    }

    return this.getRoom(roomId);
  }

  public static sendCheer(
    roomId: string,
    cheerData: {
      fromId: string;
      fromName: string;
      toId: string;
      toName: string;
      message: string;
      emoji?: string;
    }
  ): RoomCheer | null {
    this.ensureInitialized();
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const cheer: RoomCheer = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromId: cheerData.fromId,
      fromName: cheerData.fromName,
      toId: cheerData.toId,
      toName: cheerData.toName,
      message: cheerData.message,
      emoji: cheerData.emoji || "👏",
      timestamp: Date.now(),
    };

    room.cheers.push(cheer);
    // Keep max 50 cheers
    if (room.cheers.length > 50) {
      room.cheers.splice(0, room.cheers.length - 50);
    }

    return cheer;
  }

  public static addMilestone(
    roomId: string,
    milestone: { studentName: string; concept: string; text: string }
  ): RoomMilestone | null {
    this.ensureInitialized();
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const item: RoomMilestone = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentName: milestone.studentName,
      concept: milestone.concept,
      text: milestone.text,
      timestamp: Date.now(),
    };

    room.milestones.push(item);
    if (room.milestones.length > 30) {
      room.milestones.splice(0, room.milestones.length - 30);
    }

    return item;
  }
}
