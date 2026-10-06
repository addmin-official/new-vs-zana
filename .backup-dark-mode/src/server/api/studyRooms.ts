import { StudyRoomService } from "../rooms/StudyRoomService.ts";
import { FocusStatus } from "../rooms/StudyRoomTypes.ts";

export async function handleStudyRoomsRoute(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const jsonHeaders = {
    "Content-Type": "application/json",
  };

  // GET /api/study-rooms
  if (path === "/api/study-rooms" && method === "GET") {
    const grade = url.searchParams.get("grade") || undefined;
    const rooms = StudyRoomService.listRooms(grade);
    return new Response(JSON.stringify({ rooms }), { status: 200, headers: jsonHeaders });
  }

  // Routes with /api/study-rooms/:roomId
  const roomMatch = path.match(/^\/api\/study-rooms\/([^/]+)(?:\/([^/]+))?$/);
  if (!roomMatch) {
    return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers: jsonHeaders });
  }

  const roomId = roomMatch[1];
  const subAction = roomMatch[2]; // e.g. "join", "leave", "heartbeat", "cheer", "milestone"

  // GET /api/study-rooms/:roomId
  if (!subAction && method === "GET") {
    const room = StudyRoomService.getRoom(roomId);
    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), { status: 404, headers: jsonHeaders });
    }
    return new Response(JSON.stringify({ room }), { status: 200, headers: jsonHeaders });
  }

  // POST /api/study-rooms/:roomId/join
  if (subAction === "join" && method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        id?: string;
        name?: string;
        grade?: string;
        currentConcept?: string;
        goal?: string;
        status?: FocusStatus;
      };

      if (!body.id || !body.name) {
        return new Response(JSON.stringify({ error: "Missing student ID or name" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      const room = StudyRoomService.joinRoom(roomId, {
        id: body.id,
        name: body.name,
        grade: body.grade || "12",
        currentConcept: body.currentConcept,
        goal: body.goal,
        status: body.status,
      });

      if (!room) {
        return new Response(JSON.stringify({ error: "Room not found" }), { status: 404, headers: jsonHeaders });
      }

      return new Response(JSON.stringify({ room, success: true }), { status: 200, headers: jsonHeaders });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: jsonHeaders });
    }
  }

  // POST /api/study-rooms/:roomId/leave
  if (subAction === "leave" && method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as { studentId?: string };
      if (!body.studentId) {
        return new Response(JSON.stringify({ error: "Missing studentId" }), { status: 400, headers: jsonHeaders });
      }
      StudyRoomService.leaveRoom(roomId, body.studentId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: jsonHeaders });
    }
  }

  // POST /api/study-rooms/:roomId/heartbeat
  if (subAction === "heartbeat" && method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        studentId?: string;
        currentConcept?: string;
        focusMinutes?: number;
        status?: FocusStatus;
        goal?: string;
      };

      if (!body.studentId) {
        return new Response(JSON.stringify({ error: "Missing studentId" }), { status: 400, headers: jsonHeaders });
      }

      const room = StudyRoomService.heartbeat(roomId, body.studentId, {
        currentConcept: body.currentConcept,
        focusMinutes: body.focusMinutes,
        status: body.status,
        goal: body.goal,
      });

      if (!room) {
        return new Response(JSON.stringify({ error: "Room not found" }), { status: 404, headers: jsonHeaders });
      }

      return new Response(JSON.stringify({ room, success: true }), { status: 200, headers: jsonHeaders });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: jsonHeaders });
    }
  }

  // POST /api/study-rooms/:roomId/cheer
  if (subAction === "cheer" && method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        fromId?: string;
        fromName?: string;
        toId?: string;
        toName?: string;
        message?: string;
        emoji?: string;
      };

      if (!body.fromId || !body.toId || !body.message) {
        return new Response(JSON.stringify({ error: "Missing required cheer fields" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      const cheer = StudyRoomService.sendCheer(roomId, {
        fromId: body.fromId,
        fromName: body.fromName || "هاوپۆل",
        toId: body.toId,
        toName: body.toName || "هاوپۆل",
        message: body.message,
        emoji: body.emoji || "👏",
      });

      if (!cheer) {
        return new Response(JSON.stringify({ error: "Room not found" }), { status: 404, headers: jsonHeaders });
      }

      return new Response(JSON.stringify({ cheer, success: true }), { status: 200, headers: jsonHeaders });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: jsonHeaders });
    }
  }

  // POST /api/study-rooms/:roomId/milestone
  if (subAction === "milestone" && method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as {
        studentName?: string;
        concept?: string;
        text?: string;
      };

      if (!body.studentName || !body.text) {
        return new Response(JSON.stringify({ error: "Missing required milestone fields" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      const milestone = StudyRoomService.addMilestone(roomId, {
        studentName: body.studentName,
        concept: body.concept || "وانەی زانا",
        text: body.text,
      });

      return new Response(JSON.stringify({ milestone, success: true }), { status: 200, headers: jsonHeaders });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: jsonHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: jsonHeaders });
}
