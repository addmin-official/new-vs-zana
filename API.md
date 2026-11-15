# ZANA Edge API Specification (بەڵگەنامەی خزمەتگوزارییەکان)

All endpoints run on the Cloudflare Workers edge runtime and require appropriate headers, rate limiting adherence, and CORS origin matching.

---

## 1. Core Endpoints

### `POST /api/chat`
Socratic AI tutoring endpoint. Processes student queries and returns grounded Kurdish answers.

- **Request Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <STUDENT_JWT_TOKEN>` (optional for guest preview)
- **Request Body:**
  ```json
  {
    "message": "تکایە بەندی یەکەمم بۆ ڕوون بکەرەوە",
    "mode": "explain",
    "academicContext": {
      "subject": "chemistry",
      "grade": 12,
      "chapter": 1
    }
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "response": "بەندی یەکەم باس لە ترش و تفک دەکات...",
    "sourcePages": "258-278",
    "model": "gemini-3.6-flash",
    "suggestedFollowUps": [
      "هاوکێشەی ئارێنیۆس چۆن کار دەکات؟",
      "پێناسەی لۆری-برۆنشتێد چییە؟"
    ]
  }
  ```

---

### `GET /api/curriculum/:subject/:grade/outline`
Fetches official curriculum chapter index and page ranges dynamically.

- **Path Parameters:**
  - `subject`: e.g. `chemistry`, `physics`, `biology`, `mathematics`
  - `grade`: e.g. `12`
- **Response (200 OK):**
  ```json
  [
    { "id": 1, "title": "ترشەکان و تفتەکان (Acids & Bases)", "pages": "258-278" },
    { "id": 2, "title": "هاوسەنگی کیمیایی (Chemical Equilibrium)", "pages": "279-305" },
    ...
  ]
  ```

---

### `POST /api/practice/submit-step`
Validates a single mathematical/chemical step in the student drill solver and awards experience points (XP).

- **Request Body:**
  ```json
  {
    "problemId": "drill-chem-101",
    "stepNumber": 2,
    "studentInput": "pH = -log[0.05] = 1.30"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "correct": true,
    "feedback": "دەستخۆش! هەنگاوەکەت تەواوە.",
    "awardedXp": 25,
    "nextStepRequired": false
  }
  ```

---

### `POST /api/report`
Generates student learning diagnostics and parental summaries in formal Sorani Kurdish.

- **Request Body:**
  ```json
  {
    "studentId": "student-123",
    "period": "monthly"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "summary": "خوێندکار لە ماوەی مانگی ڕابردوودا ٢٨ کاتژمێر خوێندوویەتی...",
    "strengths": ["هاوسەنگی کیمیایی", "جەبری خطی"],
    "weaknesses": ["ترش و تفتەکان (پێویستی بە پێداچوونەوەیە)"],
    "recommendation": "پێشنیار دەکەین ٢ تاقیکردنەوەی خێرا لە بەندی یەکەم ئەنجام بدات."
  }
  ```

---

### `GET /api/health`
System health check endpoint verifying edge worker status, CORS origin, and upstream availability.

- **Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": 1740000000
  }
  ```
