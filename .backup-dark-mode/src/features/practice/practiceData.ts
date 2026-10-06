import { PracticeModule } from "./practiceTypes.ts";

export const PRACTICE_MODULES: PracticeModule[] = [
  // ==========================================
  // 1. GRADE 9 MATH - LINEAR EQUATION SOLVER
  // ==========================================
  {
    id: "math9_linear_equations_solver",
    titleKu: "شیکارکەری هەنگاو بە هەنگاوی هاوکێشە هێڵییەکان",
    subtitleKu: "فێربوونی گواستنەوەی نەزانراوەکان و جیاکردنەوەی گۆڕاو لە هاوکێشەی یەک پلەدا",
    subject: "math",
    grade: "9",
    moduleType: "step_solver",
    difficulty: "beginner",
    estimatedMinutes: 6,
    xpReward: 120,
    badgeAwardId: "badge_math_solver",
    stepSolverData: {
      problemStatementKu: "هاوکێشەی هێڵیی بەرامبەر شیکار بکە و بەهای x بدۆزەرەوە:",
      problemContextKu: "٤x - ٩ = ٢x + ٧",
      formulaKu: "ax + b = cx + d  ==>  ax - cx = d - b",
      steps: [
        {
          stepNumber: 1,
          titleKu: "هەنگاوی ١: گواستنەوەی تێرمە نەزانراوەکان بۆ یەک لا",
          instructionKu: "بۆ ئەوەی گۆڕاوەکان کۆبکەینەوە، پێویستە ٢x لە لای ڕاستەوە بگوازینەوە بۆ لای چەپ. چی بەسەر هێماکەیدا دێت؟",
          mathExpression: "٤x - ٢x - ٩ = ٧",
          options: [
            {
              id: "s1_opt1",
              labelKu: "دەبێتە -٢x لە لای چەپ (چونکە لە کاتی پەڕینەوە لە یەکسان هێما پێچەوانە دەبێتەوە)",
              isCorrect: true,
              explanationKu: "ڕاستە! کاتێک هەر ژمارە یان تێرمێک بەسەر هێمای یەکسان (=) دەپەڕێتەوە، هێماکەی دەگۆڕێت بۆ پێچەوانە (+ دەبێتە -)."
            },
            {
              id: "s1_opt2",
              labelKu: "وەک خۆی دەمێنێتەوە بە +٢x لە هەردوو لا",
              isCorrect: false,
              explanationKu: "هەڵەیە. ئەگەر هێماکەی نەگۆڕیت، هاوسەنگیی هاوکێشەکە تێکدەچێت."
            },
            {
              id: "s1_opt3",
              labelKu: "لێکدانی دەکرێت بە ٤x نەک لێدەرکردن",
              isCorrect: false,
              explanationKu: "هەڵەیە. کرداری بنەڕەتی لێرەدا کۆکردنەوە و لێدەرکردنە، نەک لێکدان."
            }
          ],
          hintKu: "یاسای زێڕینی جەبر: هەموو پەڕینەوەیەک بەسەر (=) هێمای تێرمەکە هەڵدەگەڕێنێتەوە.",
          commonMisconception: {
            textKu: "لەبیرچوونی گۆڕینی هێمای تێرم لە کاتی گواستنەوەدا",
            correctionKu: "هەمیشە دەستنیشانی بکە کە ژمارەکە ئەرێنییە یان نەرێنی پێش ئەوەی بیپەڕێنیتەوە."
          }
        },
        {
          stepNumber: 2,
          titleKu: "هەنگاوی ٢: گواستنەوەی ژمارە نەگۆڕەکان بۆ لای ڕاست",
          instructionKu: "ئێستا با -٩ لە لای چەپ بگوازینەوە بۆ لای ڕاست لە تەنیشت ٧. چۆن دەنووسرێت؟",
          mathExpression: "٢x = ٧ + ٩",
          options: [
            {
              id: "s2_opt1",
              labelKu: "٢x = ١٦ (چونکە -٩ دەبێتە +٩ و لەگەڵ ٧ کۆدەکرێتەوە)",
              isCorrect: true,
              explanationKu: "بژیت! ٧ + ٩ دەکاتە ١٦، و لە لای چەپیش ٤x - ٢x دەبێتە ٢x."
            },
            {
              id: "s2_opt2",
              labelKu: "٢x = -٢ (چونکە ٧ - ٩ دەکرێت)",
              isCorrect: false,
              explanationKu: "ئاگاداربە! -٩ کاتێک دەچێتە لای ڕاست دەبێتە ئەرێنی (+٩)، کەواتە ٧ + ٩ دەکەین نەک ٧ - ٩."
            }
          ],
          hintKu: "تەنها سەرنج بدە لەسەر: ٧ + ٩ = ١٦."
        },
        {
          stepNumber: 3,
          titleKu: "هەنگاوی ٣: جیاکردنەوەی تەواوی x بە دابەشکردن",
          instructionKu: "ئێستا هاوکێشەکەمان بریتییە لە: ٢x = ١٦. چۆن بەهای تەواوی x دەدۆزینەوە؟",
          mathExpression: "x = ١٦ ÷ ٢",
          options: [
            {
              id: "s3_opt1",
              labelKu: "هەردوو لا دابەشی ٢ دەکەین، کەواتە x = ٨",
              isCorrect: true,
              explanationKu: "ناوازەیە! ٢x ÷ ٢ دەکاتە x، وە ١٦ ÷ ٢ دەکاتە ٨. کەواتە بەهای x یەکسانە بە ٨."
            },
            {
              id: "s3_opt2",
              labelKu: "هەردوو لا لێکدانی ٢ دەکەین، کەواتە x = ٣٢",
              isCorrect: false,
              explanationKu: "هەڵەیە. بەستەری نێوان ٢ و x لێکدانە، بۆ پووچەڵکردنەوەی دەبێت دابەش بکەین نەک لێکدان."
            }
          ],
          hintKu: "پێچەوانەی لێکدان بریتییە لە دابەشکردن."
        },
        {
          stepNumber: 4,
          titleKu: "هەنگاوی ٤: دڵنیابوونەوە (پشکنینی وەڵام)",
          instructionKu: "با x = ٨ دابنێینەوە ناو هاوکێشە بنەڕەتییەکە (٤x - ٩ = ٢x + ٧). ئایا دوو لایەنەکە یەکسانن؟",
          mathExpression: "٤(٨) - ٩ = ٢٣  و  ٢(٨) + ٧ = ٢٣",
          options: [
            {
              id: "s4_opt1",
              labelKu: "بەڵێ، ٣٢ - ٩ = ٢٣ وە ١٦ + ٧ = ٢٣، هەردوو لا بە تەواوی یەکسانن",
              isCorrect: true,
              explanationKu: "تەواوە! پشکنین دەیسەلمێنێت کە شیکارەکەت سەد لە سەد دروستە و بە متمانەوە وەڵامت بەدەستهێنا."
            },
            {
              id: "s4_opt2",
              labelKu: "نەخێر، لای چەپ یەکسان نییە بە لای ڕاست",
              isCorrect: false,
              explanationKu: "دووبارە ژماردن بکە: ٤ لێکدانی ٨ دەکاتە ٣٢، ٣٢ کەم ٩ دەکاتە ٢٣."
            }
          ],
          hintKu: "٤ × ٨ = ٣٢، ٢ × ٨ = ١٦."
        }
      ],
      conclusionKu: "پیرۆزە! بە سەرکەوتوویی فێربوویت چۆن بە ٤ هەنگاوی یاسایی هاوکێشەی هێڵی شیکار بکەیت."
    }
  },

  // ==========================================
  // 2. GRADE 10 MATH - QUADRATIC FORMULA
  // ==========================================
  {
    id: "math10_quadratic_formula_solver",
    titleKu: "شیکارکەری یاسای گشتیی هاوکێشەی دووجا",
    subtitleKu: "دۆزینەوەی مەمیز (Δ) و ڕەگەکانی هاوکێشەی پلە دوو بە هەنگاو",
    subject: "math",
    grade: "10",
    moduleType: "step_solver",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    xpReward: 150,
    badgeAwardId: "badge_step_virtuoso",
    stepSolverData: {
      problemStatementKu: "هاوکێشەی دووجای بەرامبەر شیکار بکە بە یاسای گشتی:",
      problemContextKu: "x² - ٥x + ٦ = ٠",
      formulaKu: "x = (-b ± √(b² - ٤ac)) / (٢a)",
      steps: [
        {
          stepNumber: 1,
          titleKu: "هەنگاوی ١: دەرهێنانی هاوکۆلکەکانی a, b, c",
          instructionKu: "لە هاوکێشەی ax² + bx + c = ٠، بەهای هاوکۆلکەکانی x² - ٥x + ٦ = ٠ دیاری بکە:",
          options: [
            {
              id: "q1_opt1",
              labelKu: "a = ١,  b = -٥,  c = ٦",
              isCorrect: true,
              explanationKu: "ڕاستە! هاوکۆلکەی x² بریتییە لە ١، هاوکۆلکەی x بریتییە لە -٥ بە هێماکەیەوە، و ژمارە سەربەستەکە ٦ە."
            },
            {
              id: "q1_opt2",
              labelKu: "a = ١,  b = ٥,  c = ٦ (بێ لەبەرچاوگرتنی هێمای نێگەتیڤ)",
              isCorrect: false,
              explanationKu: "ئاگاداربە! هێمای پێش ٥ نێگەتیڤە (-) کەواتە b = -٥ە، فەرامۆشکردنی هێما وەڵامەکەت هەڵە دەکات."
            }
          ],
          hintKu: "هەمیشە هێمای پێش ژمارەکە بەشێکە لە خودی هاوکۆلکەکە."
        },
        {
          stepNumber: 2,
          titleKu: "هەنگاوی ٢: دۆزینەوەی بەهای مەمیز (Δ = b² - ٤ac)",
          instructionKu: "با بەهاکان دابنێین: Δ = (-٥)² - ٤(١)(٦). ئەنجامی مەمیز چەندە؟",
          mathExpression: "Δ = ٢٥ - ٢٤ = ١",
          options: [
            {
              id: "q2_opt1",
              labelKu: "Δ = ١ (مەمیز لە سفر گەورەترە، کەواتە دوو ڕەگی ڕاستەقینەی جیاواز هەیە)",
              isCorrect: true,
              explanationKu: "بژیت! (-٥)² = ٢٥ و ٤ × ١ × ٦ = ٢٤. کەواتە ٢٥ - ٢٤ = ١. چونکە Δ > ٠ دوو ڕەگی جیاوازمان دەبێت."
            },
            {
              id: "q2_opt2",
              labelKu: "Δ = -٤٩ (چونکە -٥ دووجا دەبێتە -٢٥)",
              isCorrect: false,
              explanationKu: "تێبینیی زانا: هەر ژمارەیەکی نێگەتیڤ کاتێک دەخرێتە توان دوو، ئەنجامەکەی هەمیشە ئەرێنییە: (-٥)² = +٢٥."
            }
          ],
          hintKu: "دووجای ژمارەی نێگەتیڤ هەمیشە ئەرێنییە."
        },
        {
          stepNumber: 3,
          titleKu: "هەنگاوی ٣: جێبەجێکردنی یاسای گشتی بۆ دۆزینەوەی ڕەگەکان",
          instructionKu: "یاساکە بریتییە لە: x = (-(-٥) ± √١) / (٢ × ١). کەواتە x = (٥ ± ١) / ٢. دوو بەهاکەی x چەندن؟",
          mathExpression: "x₁ = (٥ + ١)/٢ = ٣  ،  x₂ = (٥ - ١)/٢ = ٢",
          options: [
            {
              id: "q3_opt1",
              labelKu: "x = ٣  یان  x = ٢",
              isCorrect: true,
              explanationKu: "دەستخۆش! بە بەکارهێنانی +: (٥+١)/٢ = ٦/٢ = ٣. بە بەکارهێنانی -: (٥-١)/٢ = ٤/٢ = ٢."
            },
            {
              id: "q3_opt2",
              labelKu: "x = -٣  یان  x = -٢",
              isCorrect: false,
              explanationKu: "ئاگاداربە لە هێمای یاساکە: -(-٥) دەبێتە +٥، بۆیە بەهاکان ئەرێنین نەک نەرێنی."
            }
          ],
          hintKu: "-(-b) هەمیشە دەبێتە ئەرێنی."
        }
      ],
      conclusionKu: "بە سەرکەوتوویی هاوکێشەی دووجات شیکار کرد و تێگەیشتیت کە چۆن مەمیز جۆری ڕەگەکان دیاری دەکات."
    }
  },

  // ==========================================
  // 3. GRADE 12 MATH - CALCULUS DERIVATIVE
  // ==========================================
  {
    id: "math12_calculus_derivatives_solver",
    titleKu: "شیکارکەری هەنگاو بە هەنگاوی گرتەی نەخشەکان (Calculus)",
    subtitleKu: "یاسای توان لە گرتە و دۆزینەوەی لێژیی هێڵی لێکەوت لە خاڵێکدا",
    subject: "math",
    grade: "12",
    moduleType: "step_solver",
    difficulty: "advanced",
    estimatedMinutes: 9,
    xpReward: 180,
    badgeAwardId: "badge_step_virtuoso",
    stepSolverData: {
      problemStatementKu: "گرتەی نەخشەی بەرامبەر بدۆزەرەوە، پاشان لێژی لێکەوت لە خاڵی x = ١ حساب بکە:",
      problemContextKu: "f(x) = ٣x⁴ - ٥x² + ٧x - ٩",
      formulaKu: "d/dx [a xⁿ] = n · a xⁿ⁻¹",
      steps: [
        {
          stepNumber: 1,
          titleKu: "هەنگاوی ١: جێبەجێکردنی یاسای توان بۆ تێرمی ٣x⁴",
          instructionKu: "کاتێک گرتەی ٣x⁴ دەگریت، توانەکەی دێتە پێشەوە و توانەکەی سەر x یەک دانە کەم دەبێتەوە:",
          options: [
            {
              id: "c1_opt1",
              labelKu: "٤ × ٣x³ = ١٢x³",
              isCorrect: true,
              explanationKu: "ڕێک وایە! ٤ لێکدانی ٣ دەبێتە ١٢، و توان (٤ - ١) دەبێتە ٣. کەواتە ١٢x³."
            },
            {
              id: "c1_opt2",
              labelKu: "٧x³ (کۆکردنەوەی توان و هاوکۆلکە)",
              isCorrect: false,
              explanationKu: "هەڵەیە. یاساکە لێکدانە نەک کۆکردنەوە: توانەکە لێکدانی هاوکۆلکەکە دەکرێت."
            }
          ],
          hintKu: "توانەکە لێکدانی هاوکۆلکەکە دەکرێت."
        },
        {
          stepNumber: 2,
          titleKu: "هەنگاوی ٢: گرتەی تێرمەکانی تری نەخشەکە (-٥x² + ٧x - ٩)",
          instructionKu: "گرتەی -٥x² و ٧x و -٩ چی دەبێت؟",
          mathExpression: "d/dx [-٥x² + ٧x - ٩] = -١٠x + ٧ + ٠",
          options: [
            {
              id: "c2_opt1",
              labelKu: "-١٠x + ٧ (چونکە گرتەی ژمارەی نەگۆڕی -٩ سفرە)",
              isCorrect: true,
              explanationKu: "ناوازەیە! گرتەی -٥x² دەبێتە -١٠x، گرتەی ٧x دەبێتە ٧، و گرتەی نەگۆڕ سفرە (d/dx[c] = 0)."
            },
            {
              id: "c2_opt2",
              labelKu: "-١٠x + ٧ - ٩ (هێشتنەوەی نەگۆڕەکە وەک خۆی)",
              isCorrect: false,
              explanationKu: "تێبینی: ژمارەی نەگۆڕ لە گرتەدا دەبێتە سفر چونکە هیچ گۆڕانکارییەکی تێدا نییە."
            }
          ],
          hintKu: "گرتەی هەر ژمارەیەکی سەربەخۆ سفرە."
        },
        {
          stepNumber: 3,
          titleKu: "هەنگاوی ٣: پێکەوەنانی هاوکێشەی گرتەکە f'(x)",
          instructionKu: "هاوکێشەی کۆتایی گرتەکە کۆبکەرەوە:",
          mathExpression: "f'(x) = ١٢x³ - ١٠x + ٧",
          options: [
            {
              id: "c3_opt1",
              labelKu: "f'(x) = ١٢x³ - ١٠x + ٧",
              isCorrect: true,
              explanationKu: "بژیت! ئەمە نەخشەی لێژییە بۆ هەر خاڵێک لەسەر چەماوەکە."
            },
            {
              id: "c3_opt2",
              labelKu: "f'(x) = ١٢x⁴ - ١٠x² + ٧x",
              isCorrect: false,
              explanationKu: "هەڵەیە. گرتە توانی گۆڕاوەکان کەمدەکاتەوە نەک وەک خۆی بمێنێتەوە."
            }
          ],
          hintKu: "تێرمەکانی هەردوو هەنگاو پێکەوە کۆبکەرەوە."
        },
        {
          stepNumber: 4,
          titleKu: "هەنگاوی ٤: دۆزینەوەی لێژیی لێکەوت لە خاڵی x = ١",
          instructionKu: "x = ١ لە نەخشەی f'(x) دابنێ: f'(١) = ١٢(١)³ - ١٠(١) + ٧ = ؟",
          mathExpression: "f'(١) = ١٢ - ١٠ + ٧ = ٩",
          options: [
            {
              id: "c4_opt1",
              labelKu: "لێژی = ٩ (نەخشەکە لەم خاڵەدا بە خێرایی ڕوو لە زیادبوونە)",
              isCorrect: true,
              explanationKu: "پیرۆزە! ١٢ - ١٠ = ٢، پاشان ٢ + ٧ = ٩. ئەمەش لێژیی هێڵی لێکەوتی چەماوەکەیە لە x = ١."
            },
            {
              id: "c4_opt2",
              labelKu: "لێژی = ٥",
              isCorrect: false,
              explanationKu: "ژماردنەکە ڕاست بکەرەوە: ١٢ - ١٠ دەبێتە ٢، ٢ + ٧ دەبێتە ٩."
            }
          ],
          hintKu: "١٢ - ١٠ = ٢، ٢ + ٧ = ٩."
        }
      ],
      conclusionKu: "بە سەرکەوتوویی چەمکی سەرەکیی تەواوکاری و جیاکاری پۆلی ١٢ت بە شێوەیەکی کرداری جێبەجێ کرد."
    }
  },

  // ==========================================
  // 4. GRADE 12 PHYSICS - OHM'S LAW VIRTUAL LAB
  // ==========================================
  {
    id: "phys12_ohms_law_lab",
    titleKu: "تاقیگەی مەجازی خولە کارەباییەکان و یاسای ئۆم",
    subtitleKu: "تاقیکردنەوەی کرداریی پەیوەندی نێوان ڤۆڵتیە، بەرگری، تەزووی کارەبا و ڕووناکی گڵۆپ",
    subject: "physics",
    grade: "12",
    moduleType: "virtual_lab",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    xpReward: 200,
    badgeAwardId: "badge_circuit_master",
    virtualLabData: {
      labKind: "ohms_law_circuit",
      objectiveKu: "سەلماندنی یاسای ئۆم (V = I · R) و تێگەیشتن لە چۆنیەتی کاریگەریی بەرگری لەسەر تەزووی کارەبا لە تاقیگەدا.",
      theoryKu: "یاسای ئۆم دەڵێت: تەزووی کارەبا (I) کە بەناو گەیەنەرێکدا تێدەپەڕێت، ڕاستەوانە دەگۆڕێت لەگەڵ جیاوازی پۆتەنسیال (V) و پێچەوانە دەگۆڕێت لەگەڵ بەرگری (R). هاوکۆلکەی توانا: P = V · I = I² · R.",
      defaultControls: {
        voltage: 12,
        resistance: 4,
        switchClosed: 1
      },
      tasks: [
        {
          id: "ohm_task_1",
          titleKu: "تاقیکردنەوەی ١: پێوانی تەزوو لە دۆخی بنەڕەتیدا",
          instructionKu: "سەیری پێوەرەکان (ئەمپێرمیتەر) بکە لە کاتێکدا ڤۆڵتیە = ١٢V و بەرگری = ٤Ω. تەزووی کارەبا چەندە؟",
          inquiryQuestionKu: "بەپێی یاسای I = V / R، تەزووی خولەکە دەبێتە چەند؟",
          options: [
            {
              id: "ot1_opt1",
              textKu: "٣ ئەمپێر (I = ١٢ / ٤ = ٣A)",
              isCorrect: true,
              explanationKu: "ڕاستە! ١٢ ڤۆڵت دابەشی ٤ ئۆم دەکاتە ٣ ئەمپێر. سەیری ئەمپێرمیتەرەکە بکە دەبینی ٣.٠A نیشان دەدات."
            },
            {
              id: "ot1_opt2",
              textKu: "٤٨ ئەمپێر (I = ١٢ × ٤)",
              isCorrect: false,
              explanationKu: "ئاگاداربە: یاساکە بریتییە لە V / R نەک V × R."
            }
          ],
          hintKu: "یاسای ئۆم: I = V / R"
        },
        {
          id: "ohm_task_2",
          titleKu: "تاقیکردنەوەی ٢: دوو هێندەکردنی بەرگری",
          instructionKu: "سلایدەری بەرگری (R) لەسەر ٨Ω دابنێ بەبێ ئەوەی دەستکاری ڤۆڵتیە (١٢V) بکەیت. چی بەسەر تەزووی کارەبا و ڕووناکی گڵۆپەکەدا دێت؟",
          inquiryQuestionKu: "کاتێک بەرگری زیاد دەکەین لە ٤Ω بۆ ٨Ω، تەزووی کارەبا:",
          options: [
            {
              id: "ot2_opt1",
              textKu: "دەبێتە نیوە (١.٥ ئەمپێر) و گڵۆپەکە کزتر دەبێتەوە",
              isCorrect: true,
              explanationKu: "بژیت! پەیوەندی نێوان بەرگری و تەزوو پێچەوانەیە. کاتێک بەرگری دوو هێندە دەبێت، ڕێگری لە لێشاوی ئەلیکترۆنەکان زیاد دەکات و تەزوو بۆ نیوە کەمدەبێتەوە."
            },
            {
              id: "ot2_opt2",
              textKu: "زیاد دەکات بۆ ٦ ئەمپێر",
              isCorrect: false,
              explanationKu: "هەڵەیە. بەرگری بەربەستە لەبەردەم تەزوودا، بۆیە زیادبوونی بەرگری تەزوو کەمدەکاتەوە نەک زیاد."
            }
          ],
          hintKu: "پەیوەندی نێوان I و R پێچەوانەیە."
        },
        {
          id: "ohm_task_3",
          titleKu: "تاقیکردنەوەی ٣: گەیشتن بە زۆرترین توانا (Power)",
          instructionKu: "ڤۆڵتیە زیاد بکە بۆ ٢٤V و بەرگری کەم بکەوە بۆ ٢Ω. سەیری توانای بەفیڕۆچوو (Watt) و گەشاوەیی گڵۆپەکە بکە.",
          inquiryQuestionKu: "تەزوو دەگاتە ١٢ ئەمپێر، توانای گڵۆپەکە (P = V · I) دەبێتە چەند؟",
          options: [
            {
              id: "ot3_opt1",
              textKu: "٢٨٨ وات (P = ٢٤ × ١٢ = ٢٨٨W) - گڵۆپەکە زۆر بە توندی دەدرەوشێتەوە",
              isCorrect: true,
              explanationKu: "ناوازەیە! توانا پەیوەستە بە لێکدانی ڤۆڵتیە و تەزوو، لەم دۆخەدا گڵۆپەکە بە تەواوی ڕووناکە."
            },
            {
              id: "ot3_opt2",
              textKu: "٢ وات",
              isCorrect: false,
              explanationKu: "هەڵەیە. توانا لێکدانی ڤۆڵتیە و تەزوویە."
            }
          ],
          hintKu: "P = V × I = ٢٤ × ١٢"
        }
      ]
    }
  },

  // ==========================================
  // 5. GRADE 12 CHEMISTRY - TITRATION VIRTUAL LAB
  // ==========================================
  {
    id: "chem12_titration_lab",
    titleKu: "تاقیگەی شیکاری ترش و تفت (Acid-Base Titration & pH Lab)",
    subtitleKu: "تایتڕەیشنی HCl بە بەکارهێنانی NaOH، تێبینی گۆڕانی ڕەنگی ئیندیکەیتەر و خاڵی هاوتایی",
    subject: "chemistry",
    grade: "12",
    moduleType: "virtual_lab",
    difficulty: "advanced",
    estimatedMinutes: 10,
    xpReward: 200,
    badgeAwardId: "badge_chem_titration",
    virtualLabData: {
      labKind: "acid_base_titration",
      objectiveKu: "تێگەیشتن لە چۆنیەتی هاوسەنگبوونی ئایۆنەکانی H⁺ لەگەڵ OH⁻، دیاریکردنی خاڵی هاوتایی (Equivalence Point) بەپێی گۆڕانی pH و ڕەنگی پەمەیی فینۆڵفثالین.",
      theoryKu: "لە کاتی تایتڕەیشندا: کارلێکی بێلایەنبوون: HCl + NaOH -> NaCl + H₂O. لە خاڵی هاوتاییدا ژمارەی مۆڵەکانی H⁺ یەکسانە بە مۆڵەکانی OH⁻ (M_acid · V_acid = M_base · V_base).",
      defaultControls: {
        baseAddedMl: 0,
        flowRate: 1,
        indicatorAdded: 1
      },
      tasks: [
        {
          id: "titration_task_1",
          titleKu: "تاقیکردنەوەی ١: پێوانی pH ی ترشی بەهێز پێش دەستپێکردن",
          instructionKu: "لە فلاسکەکەدا ٢٥ ملیلیتر لە ٠.١M HCl هەیە. سەیری pH-میتەرەکە بکە پێش ئەوەی قەواکە (NaOH) تێبکەیت.",
          inquiryQuestionKu: "پێوەری pH بۆ گیراوەی ٠.١ مۆلاری ترشی هایدرۆکلۆریک چەند نیشان دەدات؟",
          options: [
            {
              id: "tt1_opt1",
              textKu: "pH = ١.٠ (ترشێکی بەهێزە، چونکە pH = -log[٠.١] = ١)",
              isCorrect: true,
              explanationKu: "ڕاستە! ترشی HCl بە تەواوی ئایۆن دەبێت، کەواتە چڕی [H⁺] = ٠.١M یە، و -log(10⁻¹) = 1.0."
            },
            {
              id: "tt1_opt2",
              textKu: "pH = ٧.٠ (بێلایەنە)",
              isCorrect: false,
              explanationKu: "هەڵەیە. پێش تێکردنی تفتی، گیراوەکە بە تەواوی ترشە نەک بێلایەن."
            }
          ],
          hintKu: "pH = -log[H⁺] = -log[0.1]"
        },
        {
          id: "titration_task_2",
          titleKu: "تاقیکردنەوەی ٢: نزیکبوونەوە لە خاڵی هاوتایی (Equivalence Point)",
          instructionKu: "سلایدەری بۆڕی تایتڕەیشنەکە بجوڵێنە تاوەکو قەبارەی NaOH دەگاتە ٢٤.٥ ملیلیتر.",
          inquiryQuestionKu: "بۆچی تا نزیک خاڵی هاوتایی ڕەنگی گیراوەکە هێشتا بێ ڕەنگ (Clear) دەمێنێتەوە؟",
          options: [
            {
              id: "tt2_opt1",
              textKu: "چونکە هێشتا بڕێکی کەم لە ئایۆنی H⁺ بەسەرنەچوو ماوەتەوە و pH لە ژێر ٨.٢ دایە",
              isCorrect: true,
              explanationKu: "تەواوە! فینۆڵفثالین لە ژینگەی ترشدا بێ ڕەنگە. تەنها کاتێک pH لە ٨.٢ دەپەڕێت ڕەنگی پەمەیی دەردەکەوێت."
            },
            {
              id: "tt2_opt2",
              textKu: "چونکە ئیندیکەیتەر کار ناکات",
              isCorrect: false,
              explanationKu: "هەڵەیە. ئیندیکەیتەر کار دەکات بەڵام مەودای گۆڕانی ڕەنگی لە pH > 8.2 دایە."
            }
          ],
          hintKu: "فینۆڵفثالین لە ترشدا بێڕەنگە."
        },
        {
          id: "titration_task_3",
          titleKu: "تاقیکردنەوەی ٣: گەیشتن بە خاڵی کۆتایی (End Point)",
          instructionKu: "قەبارەی NaOH بگەیەنە ٢٥.٠ ملیلیتر. سەیری ڕەنگی فلاسکەکە و pH بکە کە دەفڕێت بۆ دەوروبەری ٧-٨.٢ و پەمەییەکی کاڵ دروست دەبێت.",
          inquiryQuestionKu: "لە قەبارەی ٢٥ ملیلیتری تەواودا چی ڕوویدا؟",
          options: [
            {
              id: "tt3_opt1",
              textKu: "خاڵی هاوتایی بەدیهات: هەموو ترشەکە بە تەواوی لەگەڵ تفتەکە بێلایەن بووەوە (NaCl + H₂O)",
              isCorrect: true,
              explanationKu: "ناوازەیە! ٢٥ ملیلیتر لە ٠.١M NaOH تەواوی ٢٥ ملیلیتر لە ٠.١M HCl بێلایەن دەکات. ئەمەش تەواوکردنی سەرکەوتووانەی تایتڕەیشنە."
            },
            {
              id: "tt3_opt2",
              textKu: "گیراوەکە بوو بە ترشێکی زۆر خەستتر",
              isCorrect: false,
              explanationKu: "پێچەوانەکەی ڕاستە: ترشەکە بێلایەن کرا بە قەواکە."
            }
          ],
          hintKu: "M₁V₁ = M₂V₂"
        }
      ]
    }
  },

  // ==========================================
  // 6. GRADE 10 PHYSICS - NEWTON'S 2ND LAW VIRTUAL LAB
  // ==========================================
  {
    id: "phys10_newton_law_lab",
    titleKu: "تاقیگەی هێز و تاودان (یاسای دووەمی نیوتن)",
    subtitleKu: "تاقیکردنەوەی کرداری کارلێکی نێوان هێز (F)، بارستایی (m) و تاودان (a) لەسەر هێڵی جووڵە",
    subject: "physics",
    grade: "10",
    moduleType: "virtual_lab",
    difficulty: "beginner",
    estimatedMinutes: 8,
    xpReward: 160,
    badgeAwardId: "badge_newton_force",
    virtualLabData: {
      labKind: "newton_second_law",
      objectiveKu: "تێگەیشتن لە پەیوەندی نێوان هێزی کارتێکەر، بارستایی، و تاودانی تەن بەپێی یاسای F = m · a.",
      theoryKu: "یاسای دووەمی نیوتن دەڵێت: کاتێک هێزێکی دەرەکی لەسەر تەنێک کار دەکات، تاودانێکی پێدەبەخشێت کە هاوڕێژەیە لەگەڵ هێزەکە و پێچەوانە ڕێژەیە لەگەڵ بارستایی تەنەکە (a = F_net / m).",
      defaultControls: {
        appliedForce: 20,
        mass: 5,
        frictionCoeff: 0.1
      },
      tasks: [
        {
          id: "newton_task_1",
          titleKu: "تاقیکردنەوەی ١: دۆزینەوەی تاودان بۆ بارستایی دیاریکراو",
          instructionKu: "هێزی پاڵنان لەسەر ٢٠ نیوتن دابنێ و بارستایی تەنەکە لەسەر ٥ کیلۆگرام دابنێ (بە لێکخشاندنی کەم). سەیری پێوەری تاودان بکە.",
          inquiryQuestionKu: "بەپێی یاسای a = F / m، تاودانی تەنەکە دەبێتە چەند مەتر لەسەر چرکە دووجا؟",
          options: [
            {
              id: "nt1_opt1",
              textKu: "a = ٤ m/s² (چونکە ٢٠ دابەشی ٥ دەبێتە ٤)",
              isCorrect: true,
              explanationKu: "ڕاستە! هێزی ٢٠ نیوتن لەسەر بارستایی ٥ کگم تاودانی ٤ مەتر لەسەر چرکە دووجا دروست دەکات."
            },
            {
              id: "nt1_opt2",
              textKu: "a = ١٠٠ m/s² (لێکدانی ٢٠ × ٥)",
              isCorrect: false,
              explanationKu: "هەڵەیە. تاودان بریتییە لە دابەشکردنی هێز بەسەر بارستاییدا نەک لێکدان."
            }
          ],
          hintKu: "a = F / m = ٢٠ / ٥"
        },
        {
          id: "newton_task_2",
          titleKu: "تاقیکردنەوەی ٢: دوو هێندەکردنی بارستایی",
          instructionKu: "ئێستا بارستایی زیاد بکە بۆ ١٠ کگم بەبێ دەستکاریکردنی هێز (٢٠N). چی بەسەر تاوداندا دێت؟",
          inquiryQuestionKu: "کاتێک تەنەکە قورستر دەبێت، تاودانەکەی چۆن دەگۆڕێت؟",
          options: [
            {
              id: "nt2_opt1",
              textKu: "دەبێتە نیوە (a = ٢ m/s²)، چونکە بەستەری نێوان بارستایی و تاودان پێچەوانەیە",
              isCorrect: true,
              explanationKu: "بژیت! تا تەنەکە قورستر بێت، سستییەکەی (Inertia) زیاترە و تاودانی کەمتر دەبێتەوە لە کاتی کارکردنی هەمان هێزدا."
            },
            {
              id: "nt2_opt2",
              textKu: "زیاد دەکات بۆ ٨ m/s²",
              isCorrect: false,
              explanationKu: "هەڵەیە. تەنە قورسەکان هێواشتر تاودان وەردەگرن."
            }
          ],
          hintKu: "تەنە قورسەکان سەختتر تاودان وەردەگرن."
        }
      ]
    }
  },

  // ==========================================
  // 7. GRADE 9 CHEMISTRY - BOHR ATOM DIAGRAM
  // ==========================================
  {
    id: "chem9_bohr_atom_diagram",
    titleKu: "دیاگرامی کارلێککاری ئەتۆم و بەرگە ئەلیکترۆنییەکان",
    subtitleKu: "ڕێکخستنی ئەلیکترۆن لەسەر بەرگەکانی K, L, M و تێگەیشتن لە ژمارەی گەردیلەیی و بارگەکان",
    subject: "chemistry",
    grade: "9",
    moduleType: "interactive_diagram",
    difficulty: "beginner",
    estimatedMinutes: 7,
    xpReward: 140,
    badgeAwardId: "badge_bohr_atom",
    diagramData: {
      diagramKind: "bohr_atom",
      instructionKu: "ئەلیکترۆنەکان زیاد بکە بۆ سەر بەرگەکانی وزە بەپێی یاسای ٢n². سەرنج بدە لە توانای بەرگی یەکەم (K = ٢) و بەرگی دووەم (L = ٨).",
      parameters: [
        {
          id: "atomicNumber",
          nameKu: "ژمارەی گەردیلەیی (پرۆتۆنەکان Z)",
          min: 1,
          max: 18,
          step: 1,
          defaultValue: 6,
          unitKu: "پرۆتۆن"
        }
      ],
      challenges: [
        {
          id: "bohr_chal_1",
          questionKu: "ژمارەی گەردیلەیی ڕێکبخە لەسەر ٦ (کاربۆن C). چەند ئەلیکترۆن لە بەرگی دەرەوە (Valence Shell) دا دەمێنێتەوە؟",
          targetCriteriaKu: "Z = ٦",
          hintKu: "بەرگی K دوو دانە وەردەگرێت، ئەوەی دەمێنێتەوە دەچێتە بەرگی L.",
          successExplanationKu: "تەواوە! لە کاربۆندا، ٢ ئەلیکترۆن لە بەرگی یەکەمدایە و ٤ ئەلیکترۆنی ڤالانسی لە بەرگی دەرەوەدایە.",
          checkSolved: (vals) => vals.atomicNumber === 6
        },
        {
          id: "bohr_chal_2",
          questionKu: "ژمارەی گەردیلەیی بگۆڕە بۆ ١٠ (گازی نێۆن Ne). ئایا ئەم گازە جێگیرە؟",
          targetCriteriaKu: "Z = ١٠",
          hintKu: "بەرگی دووەم بە ٨ ئەلیکترۆن پڕ دەبێتەوە.",
          successExplanationKu: "بژیت! لە گازی نێۆندا (٢ + ٨ = ١٠)، بەرگی دەرەوە بە تەواوی پڕ بووەتەوە بە ٨ ئەلیکترۆن (قاعیدەی هەشتینە) و گازێکی نەجیب و تەواو جێگیرە.",
          checkSolved: (vals) => vals.atomicNumber === 10
        }
      ]
    }
  },

  // ==========================================
  // 8. GRADE 9-10 MATH - COORDINATE PLANE DIAGRAM
  // ==========================================
  {
    id: "math9_coordinate_geometry_diagram",
    titleKu: "دیاگرامی کارلێککاری تەوەرەی پۆوتان و هێڵی ڕاست",
    subtitleKu: "تێگەیشتن لە لێژایی هێڵ (Slope m) و بڕینی تەوەری y بە شێوەی بینراو و دینامیکی",
    subject: "math",
    grade: "9",
    moduleType: "interactive_diagram",
    difficulty: "beginner",
    estimatedMinutes: 6,
    xpReward: 130,
    badgeAwardId: "badge_math_solver",
    diagramData: {
      diagramKind: "coordinate_plane",
      instructionKu: "سلایدەرەکانی لێژایی (m) و بڕینی تەوەری y (b) بجوڵێنە بۆ بینینی گۆڕانکاریی ئاراستە و بەرزیی هێڵەکە بە شێوەیەکی زیندوو:",
      parameters: [
        {
          id: "slope",
          nameKu: "لێژایی هێڵ (m)",
          min: -4,
          max: 4,
          step: 0.5,
          defaultValue: 1,
          unitKu: ""
        },
        {
          id: "yIntercept",
          nameKu: "بڕینی تەوەری y (b)",
          min: -5,
          max: 5,
          step: 1,
          defaultValue: 0,
          unitKu: ""
        }
      ],
      challenges: [
        {
          id: "geom_chal_1",
          questionKu: "نەخشەی بەرامبەر لەسەر تەوەرەکان دروست بکە: y = ٢x - ٣. لێژایی و بڕین چەند دانێیت؟",
          targetCriteriaKu: "m = ٢  و  b = -٣",
          hintKu: "لە هاوکێشەی y = mx + b، لێژایی بەرامبەرە بە m و بڕینی تەوەری y بریتییە لە b.",
          successExplanationKu: "ناوازەیە! هێڵەکە لێژایی ئەرێنی ٢ی هەیە و لە خاڵی (٠، -٣) تەوەری y دەبڕێت.",
          checkSolved: (vals) => vals.slope === 2 && vals.yIntercept === -3
        },
        {
          id: "geom_chal_2",
          questionKu: "هێڵێکی ئاسۆیی بە تەواوی دروست بکە لە بەرزایی y = ٤.",
          targetCriteriaKu: "m = ٠  و  b = ٤",
          hintKu: "هێڵی ئاسۆیی لێژاییەکەی سفرە (m = 0).",
          successExplanationKu: "تەواوە! کاتێک لێژایی سفرە، نەخشەکە نەگۆڕە (y = 4) و بە تەواوی ئاسۆییە بە هاوتەریبی لەگەڵ تەوەری x.",
          checkSolved: (vals) => vals.slope === 0 && vals.yIntercept === 4
        }
      ]
    }
  },

  // ==========================================
  // 9. GRADE 12 ENGLISH - SUNRISE 12 GAMIFIED QUIZ
  // ==========================================
  {
    id: "eng12_grammar_gamified_quiz",
    titleKu: "یاریی زمانەوانی و خاڵبەندی: Sunrise 12 Grammar Arena",
    subtitleKu: "ڕکابەری لەگەڵ کات بۆ بەدەستهێنانی خاڵی کۆمبۆ و مەدالیای زمانی ئینگلیزی",
    subject: "english",
    grade: "12",
    moduleType: "gamified_quiz",
    difficulty: "intermediate",
    estimatedMinutes: 5,
    xpReward: 160,
    badgeAwardId: "badge_quiz_champion",
    gamifiedQuizData: {
      timeLimitSeconds: 90,
      basePointsPerQuestion: 25,
      questions: [
        {
          id: "eng_q1",
          questionKu: "Choose the correct modal verb: 'Look at the heavy black clouds! It _____ rain soon.'",
          contextKu: "Prediction based on clear present evidence (Sunrise 12 Unit 1)",
          options: [
            {
              id: "eq1_1",
              textKu: "is definitely going to",
              isCorrect: true,
              explanationKu: "ڕاستە! کاتێک بەڵگەی ڕوون و بینراو هەیە لە ساتەکەدا (هەوری ڕەش)، لە ئینگلیزیدا 'going to' بەکاردێت نەک 'will'."
            },
            {
              id: "eq1_2",
              textKu: "might not",
              isCorrect: false,
              explanationKu: "هەڵەیە. هەوری ڕەش بەڵگەی بارانبارینە نەک نەبارین."
            },
            {
              id: "eq1_3",
              textKu: "used to",
              isCorrect: false,
              explanationKu: "used to بۆ کاری ڕابردووی دووبارەبووەوەیە نەک پێشبینی داهاتوو."
            }
          ],
          hintKu: "Evidence in the present -> going to",
          categoryKu: "Grammar: Future Forms"
        },
        {
          id: "eng_q2",
          questionKu: "Complete the Third Conditional: 'If he _____ harder, he would have passed the ministerial exam.'",
          contextKu: "Talking about unreal past events and regret (Sunrise 12 Unit 3)",
          options: [
            {
              id: "eq2_1",
              textKu: "had studied",
              isCorrect: true,
              explanationKu: "ناوازەیە! یاسای دەستووری مەرجی سێیەم بریتییە لە: If + Past Perfect (had + V3) ... would have + V3."
            },
            {
              id: "eq2_2",
              textKu: "studies",
              isCorrect: false,
              explanationKu: "ئەمە کاتی ڕانەبردووە و هی مەرجی یەکەمە."
            },
            {
              id: "eq2_3",
              textKu: "would study",
              isCorrect: false,
              explanationKu: "لە ڕستەی If دا هەرگیز 'would' نانووسرێت."
            }
          ],
          hintKu: "If + had + past participle -> would have + past participle",
          categoryKu: "Grammar: Third Conditional"
        },
        {
          id: "eng_q3",
          questionKu: "Which sentence is correctly written in Passive Voice?",
          contextKu: "Sunrise 12 Unit 5 - Focus on the action/object",
          options: [
            {
              id: "eq3_1",
              textKu: "The new Kurdish curriculum was developed by education experts.",
              isCorrect: true,
              explanationKu: "تەواوە! شێوازی نەناسراو پێکدێت لە (Object + was/were + Past Participle)."
            },
            {
              id: "eq3_2",
              textKu: "Education experts developing the curriculum.",
              isCorrect: false,
              explanationKu: "ئەمە ڕستەی ناتەواوە و نەناسراو نییە."
            },
            {
              id: "eq3_3",
              textKu: "The curriculum developed experts.",
              isCorrect: false,
              explanationKu: "مانای ڕستەکە پێچەوانەیە چونکە پڕۆگرام ناتوانێت شارەزایان دروست بکات."
            }
          ],
          hintKu: "Passive = be + past participle",
          categoryKu: "Grammar: Passive Voice"
        }
      ]
    }
  },

  // ==========================================
  // 10. GRADE 11 CHEMISTRY - LE CHATELIER'S PRINCIPLE
  // ==========================================
  {
    id: "chem11_le_chatelier_quiz",
    titleKu: "یاریی هاوسەنگیی کیمیایی و پرەنسیپی لۆ شاتلیە",
    subtitleKu: "پێشبینیکردنی لاریی هاوسەنگی کارلێک لە کاتی گۆڕانی پلەی گەرمی و فشار و خەستی",
    subject: "chemistry",
    grade: "11",
    moduleType: "gamified_quiz",
    difficulty: "intermediate",
    estimatedMinutes: 6,
    xpReward: 150,
    badgeAwardId: "badge_quiz_champion",
    gamifiedQuizData: {
      timeLimitSeconds: 75,
      basePointsPerQuestion: 30,
      questions: [
        {
          id: "lc_q1",
          questionKu: "لە کارلێکی گەرمیبەخشدا: A + B ⇌ C + D + Heat، ئەگەر پلەی گەرمی بەرز بکەینەوە، هاوسەنگی کارلێکەکە بە کام ئاراستەدا لادەدات؟",
          contextKu: "پرەنسیپی لۆ شاتلیە (پۆلی ١١)",
          options: [
            {
              id: "lc1_1",
              textKu: "بەرەو لای چەپ (بەرەو ماددە کارلێککەرەکان)",
              isCorrect: true,
              explanationKu: "ڕاستە! چونکە گەرمی بەرهەمهاتووە (لە لای ڕاستە)، زیادکردنی پلەی گەرمی وا لە سیستمەکە دەکات کارلێکەکە بە ئاراستەی پێچەوانە (چەپ) ببات تاوەکو لە گەرمییە زیادەکە ڕزگاری بێت."
            },
            {
              id: "lc1_2",
              textKu: "بەرەو لای ڕاست (بەرەو بەرهەمەکان)",
              isCorrect: false,
              explanationKu: "هەڵەیە. زیادکردنی بەرهەمێک (گەرمی) هاوسەنگییەکە بەرەو لای پێچەوانە پاڵ دەنێت."
            }
          ],
          hintKu: "سیستمەکە هەمیشە هەوڵ دەدات کارتێکەرە دەرەکییەکە کەم بکاتەوە."
          ,categoryKu: "هاوسەنگیی گەرمی"
        },
        {
          id: "lc_q2",
          questionKu: "لە کارلێکی گازی: N₂(g) + ٣H₂(g) ⇌ ٢NH₃(g)، زیادکردنی پەستان (فشار) چ کارێک دەکات؟",
          contextKu: "کاریگەریی پەستان لەسەر ژمارەی مۆڵە گازییەکان",
          options: [
            {
              id: "lc2_1",
              textKu: "هاوسەنگی دەباتە لای ڕاست (لای کەمترینی مۆڵی گازی: ٤ مۆڵ بەرامبەر ٢ مۆڵ)",
              isCorrect: true,
              explanationKu: "ناوازەیە! لای چەپ ٤ مۆڵ گازی هەیە و لای ڕاست تەنها ٢ مۆڵ. کاتێک فشار زیاد دەکەین، سیستمەکە بەرەو ئەو لایە دەچێت کە قەبارەی کەمترە (٢ مۆڵ)."
            },
            {
              id: "lc2_2",
              textKu: "هیچ کاریگەرییەکی نابێت لەسەر هاوسەنگی",
              isCorrect: false,
              explanationKu: "هەڵەیە. کاتێک ژمارەی مۆڵ لە هەردوو لا جیاواز بێت، فشار کاریگەری ڕاستەوخۆی هەیە."
            }
          ],
          hintKu: "فشاری زیاتر -> لای کەمترین مۆڵی گازی.",
          categoryKu: "کاریگەری پەستان"
        },
        {
          id: "lc_q3",
          questionKu: "ئەگەر خەستیی یەکێک لە ماددە کارلێککەرەکان (لە لای چەپ) زیاد بکرێت، هاوسەنگیی کارلێکەکە بە کام ئاراستە دەڕوات؟",
          contextKu: "کاریگەریی خەستی لەسەر هاوسەنگیی کیمیایی",
          options: [
            {
              id: "lc3_1",
              textKu: "بەرەو لای ڕاست (بەرهەمهێنانی زیاتری بەرهەمەکان)",
              isCorrect: true,
              explanationKu: "ڕاستە! زیادکردنی خەستیی کارلێککەرەکان دەبێتە هۆی ئەوەی سیستمەکە بە ئاراستەی پێشەوە (ڕاست) بڕوات بۆ بەکارهێنانی ئەو بڕە زیادە و دروستکردنی هاوسەنگیی نوێ."
            },
            {
              id: "lc3_2",
              textKu: "بەرەو لای چەپ (بەرهەمهێنانی زیاتری کارلێککەرەکان)",
              isCorrect: false,
              explanationKu: "هەڵەیە. کاتێک ماددەیەک لە لای چەپ زیاد دەکەیت، سیستمەکە بەرەو لای پێچەوانە دەڕوات تا بڕە زیادەکە بەکاربهێنێت."
            }
          ],
          hintKu: "سیستمەکە بۆ کەمکردنەوەی ماددەی زیادکراو بەرەو لای بەرامبەر دەجووڵێت.",
          categoryKu: "کاریگەری خەستی"
        }
      ]
    }
  }
];
