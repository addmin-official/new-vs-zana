export const MOCK_KURDISH_CHAT_FIXTURES = {
  directExplanation: {
    message: "ترشەکان بەپێی تیۆری لۆری-برۆنشتێد بریتیین لەو پێکهاتانەی کە توانای بەخشینی پرۆتۆنیان (H+) هەیە بە ماددەیەکی تر.",
    subject: "chemistry",
    confidence: 0.95,
  },
  socraticGuidingQuestion1: {
    message: "کاتێک گیراوەی ترش دەخرێتە ناو ئاو، بە بڕوای تۆ چی ڕوودەدات بە خەستی ئایۆنی هایدرۆنیۆم [H3O+]؟",
    mode: "socratic",
    step: 1,
    hintsAllowed: 3,
  },
  socraticGuidingQuestion2: {
    message: "ئافەرم! ئێستا بیر بکەرەوە لە یاسای pH = -log[H3O+]، ئەگەر خەستی هایدرۆنیۆم زیاد بکات، ژمارەی pH چۆن دەگۆڕێت؟",
    mode: "socratic",
    step: 2,
    hintsAllowed: 2,
  },
  suggestions: [
    "یاساکانی ترش و تفتەکانم بۆ شیکار بکە",
    "چۆن پێوەری pH هەژمار دەکرێت؟",
    "جیاوازی نێوان ترشی بەهێز و لاواز چییە؟",
    "نموونەیەکی تاقیکردنەوەی نیشتمانیم بۆ بهێنەرەوە"
  ],
};

export const MOCK_KURDISH_ASSESSMENT_FIXTURE = {
  sessionId: "session_krd_001",
  subject: "chemistry",
  abilityEstimate: 0.85,
  standardError: 0.24,
  questions: [
    {
      id: "q_ph_01",
      questionTextKu: "ئەگەر خەستی ئایۆنی هایدرۆنیۆم [H3O+] لە گیراوەیەکدا یەکسان بێت بە 1.0 × 10^-3 M، نرخی pH چەندە؟",
      optionsKu: ["3.0", "11.0", "7.0", "1.0"],
      correctIndex: 0,
      difficulty: 0.2,
      discrimination: 1.4,
      guessing: 0.25,
      cognitiveLevel: "APPLICATION",
    },
    {
      id: "q_redox_01",
      questionTextKu: "لە کارلێکی ئۆکسان و داڕزاندا، ئەو ماددەیەی ئەلیکترۆن لەدەست دەدات چی پێ دەوترێت؟",
      optionsKu: ["ماددەی داڕزێنەر", "ماددەی ئۆکسێنەر", "ماددەی هاندەر", "ماددەی هاوسەنگکەر"],
      correctIndex: 0,
      difficulty: 0.8,
      discrimination: 1.6,
      guessing: 0.25,
      cognitiveLevel: "COMPREHENSION",
    }
  ],
  roadmapKu: [
    "پێداچوونەوەی ورد بە یاساکانی پێوەری pH و لۆگاریتم",
    "ڕاهێنانی زیاتر لەسەر هاوکێشەکانی ئۆکسان و داڕزان",
    "شیکارکردنی پرسیارە وزارییەکانی ٥ ساڵی ڕابردوو"
  ]
};

export const MOCK_STUDENT_PROFILE_KURDISH = {
  id: "student_krd_12",
  name: "ئاراس کامەران",
  grade: "12",
  stream: "scientific",
  school: "ئامادەیی زانیاری نموونەیی",
  avatar: "avatar_1.webp",
  streak: 7,
  xp: 1450,
  studyMinutes: 180,
};
