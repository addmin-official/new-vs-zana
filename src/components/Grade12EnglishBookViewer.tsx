import React, { useState } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Languages,
  Compass,
  PenTool,
  BookMarked
} from "lucide-react";

interface Grade12EnglishBookViewerProps {
  initialBookType?: "student" | "activity";
  onSelectTopicForStudy?: (topicTitle: string, pageRange: string, partName: string) => void;
  onNavigateToChat?: () => void;
}

interface UnitLesson {
  id: string;
  title: string;
  pageSB: string;
  pageAB: string;
  summary: string;
  grammarFocus?: string[];
  vocabularyKey?: { en: string; ku: string }[];
  ministerialPoints?: string[];
}

interface SunriseUnit {
  unitIndex: number;
  title: string;
  subtitle: string;
  theme: string;
  pagesSB: string;
  pagesAB: string;
  iconColor: string;
  overview: string;
  lessons: UnitLesson[];
}

export const Grade12EnglishBookViewer: React.FC<Grade12EnglishBookViewerProps> = React.memo(({
  initialBookType = "student",
  onSelectTopicForStudy,
  onNavigateToChat,
}) => {
  const [activeBookMode, setActiveBookMode] = useState<"student" | "activity" | "reader">(initialBookType === "activity" ? "activity" : "student");
  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>("eng-1-1");

  const SUNRISE_UNITS: SunriseUnit[] = [
    {
      unitIndex: 1,
      title: "Unit 1: To New York",
      subtitle: "Travel, Aviation & Introductions",
      theme: "گواستنەوە و گەشتکردن، ڕێکارەکانی فڕۆکەخانە، ڕێنماییدان و پێشنیار، بەراورد و پلەی باڵا، و کاتەکانی ڕابردوو",
      pagesSB: "4 - 11",
      pagesAB: "2 - 9",
      iconColor: "text-amber-400 bg-amber-950/60 border-amber-700/50",
      overview: "Unit 1 follows Azad Qadir travelling to a youth conference in New York. Core language focuses on giving instructions (Imperatives), making suggestions (Why not...? / How about + -ing? / Let's...), comparative and superlative forms (-er/more, -est/most, irregulars), and contrasting Past Simple, Present Perfect, and Past Perfect tenses.",
      lessons: [
        {
          id: "eng-1-1",
          title: "Lessons 1 & 2: Why not contact my cousin? (Airport Procedures & Suggestions)",
          pageSB: "4 - 5",
          pageAB: "2 - 3",
          summary: "Azad at the airport; checking in, boarding passes, luggage. Conversational structures for giving instructions and making friendly suggestions.",
          grammarFocus: [
            "Making Suggestions: Why not + base verb? (e.g., Why not contact my cousin?)",
            "How about + -ing? / What about + -ing? (e.g., How about staying at a youth hostel?)",
            "Let's + base verb / Shall we + base verb? (e.g., Let's check the schedule.)",
            "Giving Instructions: Positive & Negative Imperatives (e.g., Check in two hours before departure. / Don't leave bags unattended.)"
          ],
          vocabularyKey: [
            { en: "boarding pass", ku: "کارت یان پسوولەی سەرکەوتنە فڕۆکە" },
            { en: "luggage / baggage", ku: "باروبنە و کەلوپەلی گەشت" },
            { en: "departure lounge", ku: "هۆڵی چاوەڕوانی بەڕێکەوتن" },
            { en: "customs officer", ku: "ئەفسەری گومرگ" },
            { en: "hand luggage", ku: "جانتا یان باری دەستی ناو فڕۆکە" }
          ],
          ministerialPoints: [
            "Distinguishing between 'Why not' (+ base verb) and 'How about' (+ -ing) in ministerial multiple-choice questions.",
            "Recognizing vocabulary collocations: 'board a plane', 'check in baggage', 'go through customs'."
          ]
        },
        {
          id: "eng-1-2",
          title: "Lessons 3 & 4: They wanted a better life (Comparatives & Superlatives)",
          pageSB: "6 - 7",
          pageAB: "4 - 5",
          summary: "Historical migration to New York; life in big cities vs small towns. Comprehensive rules for comparative and superlative adjectives and adverbs.",
          grammarFocus: [
            "Short Adjectives: add -er / -est (e.g., fast -> faster -> fastest; big -> bigger -> biggest)",
            "Long Adjectives: more / most + adj (e.g., expensive -> more expensive -> most expensive)",
            "Irregular Forms: good/well -> better -> best; bad/badly -> worse -> worst; far -> further/farther -> furthest",
            "Equality: as + adjective + as (e.g., Life there isn't as busy as New York.)"
          ],
          vocabularyKey: [
            { en: "immigrant", ku: "کۆچبەر بۆ ناو وڵات" },
            { en: "skyscraper", ku: "تەلارە هەوربڕەکان" },
            { en: "multicultural", ku: "فرەکولتووری" },
            { en: "living standards", ku: "ئاستی بژێوی ژیان" }
          ],
          ministerialPoints: [
            "Irregular comparatives (better, worse, further) frequently appear in exam questions.",
            "Using 'than' after comparatives and 'the' before superlatives."
          ]
        },
        {
          id: "eng-1-3",
          title: "Lessons 5 & 6: Past Simple, Present Perfect & Past Perfect Tenses",
          pageSB: "8 - 11",
          pageAB: "6 - 9",
          summary: "Contrasting completed past actions with past actions having present relevance, and the action that happened earlier in the past (Past Perfect).",
          grammarFocus: [
            "Past Simple: S + V2 (finished time in the past: yesterday, in 2010, ago, last week)",
            "Present Perfect: S + have/has + V3 (experience, unspecified time, ongoing states: since, for, already, yet, ever, never)",
            "Past Perfect: S + had + V3 (the action that happened before another action in the past)",
            "Have been to (visited and returned) vs Have gone to (went and still there)"
          ],
          vocabularyKey: [
            { en: "conference", ku: "کۆنفرانس و کۆڕبەندی فەرمی" },
            { en: "delegate", ku: "نوێنەر یان بەشداربوو" },
            { en: "hostel", ku: "میوانخانە یان هۆستێلی خوێندکاران" },
            { en: "recommendation", ku: "ڕاسپاردە و پێشنیار" }
          ],
          ministerialPoints: [
            "Forming sentences with 'After + had + V3, Past Simple' and 'Before + Past Simple, had + V3'.",
            "The difference between 'has been' (گەڕاوەتەوە) and 'has gone' (هێشتا نەگەڕاوەتەوە)."
          ]
        }
      ]
    },
    {
      unitIndex: 2,
      title: "Unit 2: Getting Organized",
      subtitle: "Schedules, Technology & Time Management",
      theme: "ڕێکخستنی کات، مۆبایل و تەکنەلۆجیا، پرسیاری نەرێنی، کاتی بەردەوامی داهاتوو، و ڕستەکانی Too و Enough",
      pagesSB: "12 - 19",
      pagesAB: "10 - 17",
      iconColor: "text-blue-400 bg-blue-950/60 border-blue-700/50",
      overview: "Unit 2 explores practical organization, phone conversations, and schedule planning. Grammar features prepositions of time (at, on, in, during, by), contrast linkers (although, however, whereas), negative questions, Future Continuous (will be + -ing), and too / (not) enough structures.",
      lessons: [
        {
          id: "eng-2-1",
          title: "Lessons 1 & 2: Prepositions of Time & Stating Contrasts",
          pageSB: "12 - 13",
          pageAB: "10 - 11",
          summary: "Using precise prepositions of time for appointments, and contrasting ideas using formal linking words.",
          grammarFocus: [
            "Prepositions of Time: at (times, at night), on (days, dates), in (months, years, parts of day), by (deadline/no later than), until (up to a point)",
            "Contrasting: Although / Even though + clause (e.g., Although he was tired, he kept studying.)",
            "However (at start of second sentence with comma: However, ...)",
            "Whereas / While for direct contrast between two subjects"
          ],
          vocabularyKey: [
            { en: "schedule / timetable", ku: "خشتەی کات و کارەکان" },
            { en: "appointment", ku: "ژوان یان دیداری دیاریکراو" },
            { en: "deadline", ku: "کۆتا مۆڵەتی دیاریکراو" },
            { en: "priority", ku: "کاری لەپێشینە" }
          ],
          ministerialPoints: [
            "Punctuation with 'However,' vs 'Although' in writing and grammar transformation questions.",
            "Choosing the correct preposition before dates (on May 15th) vs months (in May)."
          ]
        },
        {
          id: "eng-2-2",
          title: "Lessons 3 & 4: Negative Questions & Future Continuous",
          pageSB: "14 - 15",
          pageAB: "12 - 13",
          summary: "Negative questions for confirmation and surprise; Future Continuous for actions in progress at a specific future moment.",
          grammarFocus: [
            "Negative Questions: Haven't you received the email? / Isn't that right? (Expecting agreement or expressing surprise)",
            "Future Continuous: S + will be + verb-ing (e.g., At 10 o'clock tomorrow, I will be flying to London.)",
            "Future Continuous questions: Will you be using the computer this evening?"
          ],
          vocabularyKey: [
            { en: "voicemail", ku: "پەیامی دەنگی مۆبایل" },
            { en: "network", ku: "تۆڕی پەیوەندی و زانیاری" },
            { en: "efficient", ku: "کارا و بەسوود" },
            { en: "distraction", ku: "سەرلێشێواندنی بیر و هۆش" }
          ],
          ministerialPoints: [
            "Time expressions triggering Future Continuous: 'At this time tomorrow', 'Between 3 and 5 pm tomorrow'.",
            "Using polite negative questions in phone conversations."
          ]
        },
        {
          id: "eng-2-3",
          title: "Lessons 5 & 6: Too and (Not) Enough + Infinitive",
          pageSB: "16 - 19",
          pageAB: "14 - 17",
          summary: "Expressing excess and sufficiency using too and enough with adjectives, adverbs, and countable/uncountable nouns.",
          grammarFocus: [
            "too + adjective + to-infinitive (e.g., The box is too heavy to carry. = It is so heavy that I cannot carry it.)",
            "adjective + enough + to-infinitive (e.g., He is old enough to drive.)",
            "too much + uncountable noun (e.g., too much noise / too much traffic)",
            "too many + countable plural noun (e.g., too many mistakes / too many people)",
            "enough + noun (e.g., enough time / enough books)"
          ],
          vocabularyKey: [
            { en: "exhausted", ku: "زۆر ماندوو و بێهێز" },
            { en: "productive", ku: "بەرهەمدار" },
            { en: "interruption", ku: "پچڕان یان قسەپێبڕین" },
            { en: "concentrate", ku: "تەرکیز و سەرنجدان" }
          ],
          ministerialPoints: [
            "Word order: 'adjective + enough' (clever enough) vs 'enough + noun' (enough money).",
            "Rephrasing 'too ... to' into '(not) ... enough to' in ministerial rewrites."
          ]
        }
      ]
    },
    {
      unitIndex: 3,
      title: "Unit 3: Saving the Past for the Future",
      subtitle: "Archaeology, World Heritage & Passives",
      theme: "شوێنەوارناسی، کەلەپووری جیهانی، قەڵای هەولێر، دەنگی نادیار (Passive)، و کارەکانی دەربڕینی دڵنیایی (Modals)",
      pagesSB: "20 - 27",
      pagesAB: "18 - 25",
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-700/50",
      overview: "Unit 3 celebrates ancient heritage and archaeology (including the Erbil Citadel and Mesopotamia). Key grammar focuses on the Passive Voice across all tenses, modal verbs for present and past certainty/deduction (must, can't, might), and cause-and-effect linkers.",
      lessons: [
        {
          id: "eng-3-1",
          title: "Lessons 1 & 2: Active and Passive Voice (Tenses & Agent)",
          pageSB: "20 - 21",
          pageAB: "18 - 19",
          summary: "Transforming active sentences to passive voice when the action or object is more important than the doer.",
          grammarFocus: [
            "Passive Formula: Subject (Object of active) + BE (in tense of active) + Past Participle (V3) (+ by agent)",
            "Present Simple Passive: am/is/are + V3 (e.g., The Citadel is visited by thousands.)",
            "Past Simple Passive: was/were + V3 (e.g., The site was discovered in 1920.)",
            "Present Continuous Passive: am/is/are being + V3",
            "Passive with Modals / going to: modal + be + V3 / is/are going to be + V3"
          ],
          vocabularyKey: [
            { en: "archaeologist", ku: "شوێنەوارناس" },
            { en: "citadel", ku: "قەڵا یان قەڵای دێرین" },
            { en: "artefact / artifact", ku: "کەلوپەلی مێژوویی دەستکرد" },
            { en: "excavation", ku: "هەڵکۆڵین و پشکنینی شوێنەوار" },
            { en: "heritage site", ku: "شوێنی کەلەپووری جیهانی" }
          ],
          ministerialPoints: [
            "Changing tenses accurately in passive transformations (especially Continuous with 'being').",
            "Identifying when 'by + agent' is necessary and when it can be omitted."
          ]
        },
        {
          id: "eng-3-2",
          title: "Lessons 3 & 4: Modal Verbs for Deduction & Certainty",
          pageSB: "22 - 23",
          pageAB: "20 - 21",
          summary: "Using modals to express logical deduction in the present and past based on evidence.",
          grammarFocus: [
            "Present Certainty (Positive): must + base verb (e.g., It must be ancient; look at the brickwork.)",
            "Present Certainty (Negative): can't + base verb (e.g., It can't be modern; it was buried underground.)",
            "Present Possibility: may / might / could + base verb",
            "Past Certainty: must have + V3 (e.g., Ancient builders must have used strong mortar.)",
            "Past Impossible: can't have + V3 (e.g., They can't have built it in a single year.)",
            "Past Possibility: might have / could have + V3"
          ],
          vocabularyKey: [
            { en: "evidence", ku: "بەڵگە و شایەدی" },
            { en: "civilization", ku: "شارستانییەت" },
            { en: "restoration", ku: "نۆژەنکردنەوە و چاککردنەوە" },
            { en: "monument", ku: "مۆنۆمێنت یان یادگاری مێژوویی" }
          ],
          ministerialPoints: [
            "Never use 'mustn't' for logical impossibility; the negative of 'must be' is 'can't be'.",
            "Past deduction: recognizing clues (e.g., 'I am certain he was here' -> 'He must have been here')."
          ]
        },
        {
          id: "eng-3-3",
          title: "Lessons 5 & 6: Impersonal Passive & Cause and Effect",
          pageSB: "24 - 27",
          pageAB: "22 - 25",
          summary: "Formal reporting with 'It is said/believed that...' and connecting historical developments with cause and effect linkers.",
          grammarFocus: [
            "Impersonal Passive: It is said / believed / thought / reported that + clause",
            "Cause: because, since, as, due to + noun phrase, because of + noun phrase",
            "Effect: therefore, so, as a result, consequently, led to + noun phrase"
          ],
          vocabularyKey: [
            { en: "preservation", ku: "پاراستن و هێشتنەوە" },
            { en: "mud brick", ku: "خشتی قوڕین" },
            { en: "dynasty", ku: "بنەماڵەی فەرمانڕەوا" },
            { en: "architecture", ku: "ئەندازیاری تەلارسازی" }
          ],
          ministerialPoints: [
            "Transformation: 'People believe that...' -> 'It is believed that...'.",
            "Distinction between 'due to + noun phrase' and 'because + full clause'."
          ]
        }
      ]
    },
    {
      unitIndex: 4,
      title: "Unit 4: Revision & Exam Practice (Units 1-3)",
      subtitle: "Review & National Exam Consolidation",
      theme: "پێداچوونەوەی یەکەکانی ١ تا ٣، تاقیکردنەوەی وزاری نموونەیی، ڕاهێنانی ئەکادیمی",
      pagesSB: "28 - 31",
      pagesAB: "26 - 31",
      iconColor: "text-rose-400 bg-rose-950/60 border-rose-700/50",
      overview: "Comprehensive consolidation of language points, reading comprehension, vocabulary sets, and phonetics from Units 1 to 3, directly preparing students for the national baccalaureate examination.",
      lessons: [
        {
          id: "eng-4-1",
          title: "Unit 4: Grammar & Vocabulary Consolidation",
          pageSB: "28 - 29",
          pageAB: "26 - 28",
          summary: "Integrated practice on comparatives, past tenses, passives, and modal deductions.",
          grammarFocus: [
            "Comparative and Superlative error corrections",
            "Passive voice transformations in mixed tenses",
            "Modal deduction past and present matching"
          ],
          ministerialPoints: [
            "Reviewing typical ministerial question formats for Units 1–3.",
            "Common student pitfalls in irregular verbs and preposition selection."
          ]
        },
        {
          id: "eng-4-2",
          title: "Unit 4: Reading Comprehension & Writing Skills",
          pageSB: "30 - 31",
          pageAB: "29 - 31",
          summary: "Techniques for answering unseen reading passages, scanning for specific data, and paragraph writing.",
          grammarFocus: [
            "Skimming for main idea vs Scanning for specific facts",
            "Topic sentences, supporting details, and transitional words"
          ],
          ministerialPoints: [
            "Locating answers directly from text without copying irrelevant sentences.",
            "Writing clear summary paragraphs."
          ]
        }
      ]
    },
    {
      unitIndex: 5,
      title: "Unit 5: Feeding Nine Billion",
      subtitle: "Environment, 4 R's & Conditionals",
      theme: "کشتوکاڵ، ئاسایشی خۆراک، ژینگە، چوار ڕێگاکە (Reduce, Re-use, Recycle, Repair)، و تەواوی مەرجییەکان (Conditionals)",
      pagesSB: "32 - 39",
      pagesAB: "32 - 39",
      iconColor: "text-emerald-500 bg-emerald-950/60 border-emerald-700/50",
      overview: "Unit 5 focuses on global food challenges, environmental sustainability, and the 4 R's. The grammar curriculum covers comparing quantities (fractions, percentages), time conjunctions + present + future, all conditional types (Zero, 1st, 2nd, 3rd), might have/could have in conditionals, and expressing regrets with 'If only' and 'I wish'.",
      lessons: [
        {
          id: "eng-5-1",
          title: "Lessons 1 & 2: Quantities, Percentages & Time Conjunctions",
          pageSB: "32 - 33",
          pageAB: "32 - 33",
          summary: "Describing population and agricultural statistics using percentages, fractions, and time clauses with future meaning.",
          grammarFocus: [
            "Comparing Quantities: twice as much as (uncountable), three times as many as (countable)",
            "Fractions & Percentages: half of, a quarter of, 70 percent of",
            "Time Conjunctions: When / As soon as / Once / Before / After + Present Simple, will + base verb (e.g., As soon as the harvest arrives, we will distribute the food.)"
          ],
          vocabularyKey: [
            { en: "sustainable", ku: "بەردەوام و پارێزەر لە ژینگە" },
            { en: "harvest", ku: "دروێنە و بەروبووم" },
            { en: "scarcity", ku: "دەگمەنی و کەمیی سەرچاوە" },
            { en: "consumption", ku: "بەکاربردن" }
          ],
          ministerialPoints: [
            "Never use 'will' inside the time clause (after 'when', 'as soon as', 'before'); use Present Simple instead.",
            "Comparing with 'as much as' (uncountable) vs 'as many as' (countable plural)."
          ]
        },
        {
          id: "eng-5-2",
          title: "Lessons 3 & 4: Zero, First & Second Conditionals",
          pageSB: "34 - 35",
          pageAB: "34 - 35",
          summary: "Real facts (Zero), future possibilities (1st), and hypothetical/unreal present situations (2nd conditional).",
          grammarFocus: [
            "Zero Conditional: If + Present Simple, Present Simple (Scientific facts: If you heat ice, it melts.)",
            "First Conditional: If + Present Simple, will + base verb (Real future: If the rains fail, crops will die.)",
            "Second Conditional: If + Past Simple, would + base verb (Unreal present: If we had more arable land, we would grow more wheat.)",
            "Were instead of was: If I were you, I would conserve water."
          ],
          vocabularyKey: [
            { en: "deforestation", ku: "داربڕین و لەناوبردنی دارستان" },
            { en: "irrigation", ku: "ئاودێری زەوی کشتوکاڵی" },
            { en: "fertile soil", ku: "خاکی بەپیت" },
            { en: "crop yield", ku: "بڕی بەرهەمی دانەوێڵە" }
          ],
          ministerialPoints: [
            "Matching verb tenses in If-clause and Main clause in multiple-choice questions.",
            "Identifying 2nd conditional as hypothetical/unreal advice ('If I were you')."
          ]
        },
        {
          id: "eng-5-3",
          title: "Lessons 5 & 6: Third Conditional & Regrets (If only / I wish)",
          pageSB: "36 - 39",
          pageAB: "36 - 39",
          summary: "Past hypothetical situations that did not happen and expressing regrets about past actions.",
          grammarFocus: [
            "Third Conditional: If + Past Perfect (had + V3), would have + Past Participle (V3) (e.g., If they had built the dam earlier, they would have saved the crops.)",
            "Modal variants: might have + V3 / could have + V3",
            "Regrets with If only / I wish: If only / I wish + Past Perfect (had + V3) (e.g., If only we had recycled more plastic! / I wish I had studied harder.)"
          ],
          vocabularyKey: [
            { en: "reduce", ku: "کەمکردنەوەی بەفیڕۆدان" },
            { en: "re-use", ku: "دووبارە بەکارهێنانەوە" },
            { en: "recycle", ku: "ڕیسایکلین و نوێکردنەوە" },
            { en: "repair", ku: "چاککردنەوە و نۆژەنکردنەوە" }
          ],
          ministerialPoints: [
            "Recognizing past regrets: 'I didn't bring an umbrella' -> 'I wish I had brought an umbrella'.",
            "Third conditional formula is one of the most frequently tested topics in the national exam."
          ]
        }
      ]
    },
    {
      unitIndex: 6,
      title: "Unit 6: Into the Information Age",
      subtitle: "Relative Clauses, Internet & Kurdish SchoolNet",
      theme: "تەکنەلۆجیای زانیاری، ئینتەرنێت، پڕۆژەی تۆڕی قوتابخانەکانی کوردستان، و ڕستە پەیوەندییەکان (Relative Clauses)",
      pagesSB: "40 - 47",
      pagesAB: "40 - 47",
      iconColor: "text-cyan-400 bg-cyan-950/60 border-cyan-700/50",
      overview: "Unit 6 explores how digital communication and Kurdish SchoolNet empower education. Grammar centers on defining and non-defining relative clauses, reduced relative clauses (-ing / -ed participles), clauses introduced by wh-words, and expressing purpose (in order to, so that).",
      lessons: [
        {
          id: "eng-6-1",
          title: "Lessons 1 & 2: Defining & Non-Defining Relative Clauses",
          pageSB: "40 - 41",
          pageAB: "40 - 41",
          summary: "Joining sentences with relative pronouns (who, which, that, whose, where); essential information vs extra information between commas.",
          grammarFocus: [
            "Defining Relative Clauses: essential to identify the noun (no commas). Who (people), Which/That (things), Whose (possession), Where (places)",
            "Non-defining Relative Clauses: gives extra non-essential information (enclosed in commas). (e.g., Tim Berners-Lee, who invented the World Wide Web, was born in London.)",
            "Note: 'That' cannot be used in non-defining relative clauses (after a comma)."
          ],
          vocabularyKey: [
            { en: "telecommunications", ku: "پەیوەندییە ئەلیکترۆنییەکان" },
            { en: "search engine", ku: "ماتۆڕی گەڕان لە ئینتەرنێت" },
            { en: "SchoolNet", ku: "تۆڕی ئینتەرنێتی قوتابخانەکان" },
            { en: "e-learning", ku: "فێربوونی ئەلیکترۆنی" }
          ],
          ministerialPoints: [
            "Using commas correctly in non-defining clauses; 'that' is strictly prohibited after a comma.",
            "Whose for possession: 'The student whose project won first prize'."
          ]
        },
        {
          id: "eng-6-2",
          title: "Lessons 3 & 4: Reduced Relative Clauses & Wh-Clauses",
          pageSB: "42 - 43",
          pageAB: "42 - 43",
          summary: "Shortening relative clauses using active (-ing) or passive (-ed) participles, and clauses with how, what, where, why.",
          grammarFocus: [
            "Reduced with Active Participle (-ing): Students who study hard -> Students studying hard",
            "Reduced with Passive Participle (V3): Computers which are made in Japan -> Computers made in Japan",
            "Wh-clauses: I don't understand how this program works. / He explained what happened."
          ],
          vocabularyKey: [
            { en: "database", ku: "بنکەدراوەی زانیاری" },
            { en: "broadband", ku: "هێڵی ئینتەرنێتی خێرا" },
            { en: "hardware / software", ku: "کەلوپەلی ڕەقەواڵە و نەرمەواڵە" },
            { en: "interactive", ku: "کارلێککارانە" }
          ],
          ministerialPoints: [
            "Active reduction takes '-ing' while passive reduction takes past participle (V3).",
            "Word order in embedded wh-clauses: subject comes before verb (e.g., 'where he lives', not 'where does he live')."
          ]
        },
        {
          id: "eng-6-3",
          title: "Lessons 5 & 6: Expressing Purpose (In order to, So that)",
          pageSB: "44 - 47",
          pageAB: "44 - 47",
          summary: "Stating reasons and intentions using infinitives of purpose and clauses with so that.",
          grammarFocus: [
            "To / In order to / So as to + base verb (e.g., He logged on in order to download the lecture.)",
            "Negative Purpose: In order not to / So as not to + base verb",
            "So that + Subject + can/could/will/would + base verb (e.g., They installed fiber optics so that schools could connect faster.)"
          ],
          vocabularyKey: [
            { en: "connectivity", ku: "توانای بەستنەوە بە تۆڕەوە" },
            { en: "collaborate", ku: "هاوکاری و بەشداریکردن پێکەوە" },
            { en: "cyberspace", ku: "جیهانی ئەلیکترۆنی و مەجازی" },
            { en: "distance learning", ku: "خوێندنی دوورەدەست" }
          ],
          ministerialPoints: [
            "Choosing between 'in order to' (+ base verb) and 'so that' (+ subject + can/could).",
            "Negative purpose: 'in order not to', NOT 'in order to not'."
          ]
        }
      ]
    },
    {
      unitIndex: 7,
      title: "Unit 7: Working Together for a Better World",
      subtitle: "Humanitarian Aid, Verb Patterns & Reported Speech",
      theme: "هاوکاری نێودەوڵەتی، ڕێکخراوە مرۆییەکان، دەستەواژەی Participle، یاساکانی Used to، و وتەی گواستراوە (Reported Speech)",
      pagesSB: "48 - 55",
      pagesAB: "48 - 55",
      iconColor: "text-indigo-400 bg-indigo-950/60 border-indigo-700/50",
      overview: "Unit 7 discusses international aid agencies, humanitarian missions, and disaster relief. Grammar features participle clauses with prepositions (while, after, on), verb patterns (verb + inf vs verb + -ing), used to vs be/get used to, and comprehensive reported speech rules.",
      lessons: [
        {
          id: "eng-7-1",
          title: "Lessons 1 & 2: Participle Clauses & Verb Patterns",
          pageSB: "48 - 49",
          pageAB: "48 - 49",
          summary: "Using -ing participle clauses to connect simultaneous actions, and verbs followed by infinitives or gerunds.",
          grammarFocus: [
            "Participle Clauses with Prepositions: After finishing his degree, he joined the Red Cross. / On arriving at the camp, they set up tents.",
            "Verb + to-infinitive: decide, agree, hope, promise, refuse, manage, want",
            "Verb + -ing (Gerund): enjoy, avoid, suggest, consider, practise, finish, keep",
            "Verbs with both (difference in meaning): stop to do (pause to do sth) vs stop doing (quit an activity)"
          ],
          vocabularyKey: [
            { en: "humanitarian aid", ku: "یارمەتی و فریاگوزاری مرۆیی" },
            { en: "volunteer", ku: "خۆبەخش" },
            { en: "refugee camp", ku: "کەمپی ئاوارە و پەنابەران" },
            { en: "donor country", ku: "وڵاتی بەخشەر" }
          ],
          ministerialPoints: [
            "Memorizing verbs followed by infinitive vs gerund (classic multiple-choice question).",
            "Shortening sentences using 'After / Before / On + -ing'."
          ]
        },
        {
          id: "eng-7-2",
          title: "Lessons 3 & 4: Used to do vs Be / Get used to doing",
          pageSB: "50 - 51",
          pageAB: "50 - 51",
          summary: "Past abandoned habits vs being accustomed to a current situation.",
          grammarFocus: [
            "used to + base verb: past habit/state that is no longer true (e.g., He used to live in London, but now lives in Erbil.)",
            "didn't use to + base verb / Did you use to...? (note the spelling without 'd')",
            "be used to + noun / -ing: accustomed to (e.g., She is used to working long hours.)",
            "get used to + noun / -ing: the process of becoming accustomed (e.g., He will soon get used to the hot weather.)"
          ],
          vocabularyKey: [
            { en: "accustomed to", ku: "ڕاهاتوو لەسەر" },
            { en: "disaster relief", ku: "فریاکەوتن لە کاتی کارەساتدا" },
            { en: "emergency supplies", ku: "پێداویستییە بەپەلەکانی فریاگوزاری" },
            { en: "logistics", ku: "گواستنەوە و دابینکردنی کەرەستە" }
          ],
          ministerialPoints: [
            "The crucial difference between 'used to + base verb' and 'is used to + -ing'.",
            "Negative and question forms: 'didn't use to' (without 'd')."
          ]
        },
        {
          id: "eng-7-3",
          title: "Lessons 5 & 6: Reported Speech (Statements, Questions & Orders)",
          pageSB: "52 - 55",
          pageAB: "52 - 55",
          summary: "Comprehensive transformation of direct speech into reported/indirect speech with tense shifts and pronoun adjustments.",
          grammarFocus: [
            "Tense Shifts: Present Simple -> Past Simple; Present Continuous -> Past Continuous; Past Simple / Present Perfect -> Past Perfect; will -> would; can -> could",
            "Reported Statements: He said (that) he was ready.",
            "Reported Questions: Wh-questions (He asked where I lived.) / Yes-No questions (He asked if/whether I liked tea.)",
            "Reported Orders/Requests: S + told/asked + object + to-infinitive (e.g., The doctor told him to rest.)"
          ],
          vocabularyKey: [
            { en: "negotiation", ku: "دانوستان و گفتوگۆ" },
            { en: "statement", ku: "لێدوان یان ڕاگەیەندراو" },
            { en: "representative", ku: "نوێنەری فەرمی" },
            { en: "compromise", ku: "ڕێککەوتن بە سازشکردنی دوولایەنە" }
          ],
          ministerialPoints: [
            "Affirmative word order in reported questions (no 'did', 'do', or question mark).",
            "Pronoun and time shifts: 'now' -> 'then', 'tomorrow' -> 'the following day', 'here' -> 'there'."
          ]
        }
      ]
    },
    {
      unitIndex: 8,
      title: "Unit 8: Revision & Exam Practice (Units 5-7)",
      subtitle: "Review & National Exam Consolidation",
      theme: "پێداچوونەوەی یەکەکانی ٥ تا ٧، پرسیارە وزارییەکان، و بەستنەوەی چەمکە سەرەکییەکان",
      pagesSB: "56 - 59",
      pagesAB: "56 - 61",
      iconColor: "text-amber-500 bg-amber-950/60 border-amber-700/50",
      overview: "Final revision of the Sunrise 12 core syllabus covering all conditional sentences, relative clauses, participle clauses, and reported speech, equipping students with high-scoring ministerial exam skills.",
      lessons: [
        {
          id: "eng-8-1",
          title: "Unit 8: Advanced Grammar Consolidation",
          pageSB: "56 - 57",
          pageAB: "56 - 58",
          summary: "Intensive multi-unit practice on Conditionals (1st, 2nd, 3rd), Relative Clauses, and Reported Speech.",
          grammarFocus: [
            "All conditional types comparison in a single table",
            "Reported speech transformation drills",
            "Relative clause joining and reducing drills"
          ],
          ministerialPoints: [
            "Recognizing tricky questions where multiple grammar rules interact.",
            "Speed techniques for multiple choice grammar sections."
          ]
        },
        {
          id: "eng-8-2",
          title: "Unit 8: Vocabulary & Collocation Mastery",
          pageSB: "58 - 59",
          pageAB: "59 - 61",
          summary: "Mastering high-frequency academic words, prefixes/suffixes, and grammatical pairs across the entire book.",
          grammarFocus: [
            "Prefix re- (rebuild, recycle, recreate)",
            "Verb-Noun-Adjective derivations",
            "Idiomatic collocations"
          ],
          ministerialPoints: [
            "Vocabulary in context questions.",
            "Spelling checks and common phonetic traps."
          ]
        }
      ]
    },
    {
      unitIndex: 9,
      title: "Literary Reader: Treasure Island",
      subtitle: "Novel by Robert Louis Stevenson",
      theme: "ڕۆمانی بەناوبانگی گەنجینەی دوورگە (تەواوی ٩ ئەڵقەکە)، کەسایەتییەکان، وتەکان، و تاقیکردنەوەی وزاری",
      pagesSB: "66 - 102",
      pagesAB: "62 - 81",
      iconColor: "text-rose-400 bg-rose-950/60 border-rose-700/50",
      overview: "The complete official literary reader for Grade 12: 'Treasure Island' by Robert Louis Stevenson. Covers Episodes 1 through 9, following young Jim Hawkins, the mutiny led by Long John Silver, the loyal crew, Ben Gunn, and the quest for Flint's buried gold.",
      lessons: [
        {
          id: "eng-9-1",
          title: "Episodes 1 & 2: The Old Sea-dog & The Sea Chest",
          pageSB: "66 - 73",
          pageAB: "62 - 65",
          summary: "Billy Bones arrives at the Admiral Benbow Inn with his sea chest; visits from Black Dog and Blind Pew; the Black Spot; Billy's death; Jim and his mother open the chest and find Captain Flint's treasure map.",
          grammarFocus: [
            "Narrative tenses: Past Simple, Past Continuous, Past Perfect",
            "Character descriptions and indirect characterization"
          ],
          vocabularyKey: [
            { en: "innkeeper", ku: "خاوەن میوانخانە" },
            { en: "sea chest", ku: "سندوقی گەورەی دەریایی" },
            { en: "the Black Spot", ku: "خاڵە ڕەشەکە (نیشانەی مردن یان هەڕەشەی چەتەکانی دەریا)" },
            { en: "buccaneer / pirate", ku: "چەتەی دەریا" }
          ],
          ministerialPoints: [
            "Who gave the Black Spot to Billy Bones? (Blind Pew).",
            "What important document did Jim find in the chest? (Flint's treasure map)."
          ]
        },
        {
          id: "eng-9-2",
          title: "Episodes 3 & 4: The Voyage & The Apple Barrel",
          pageSB: "74 - 81",
          pageAB: "66 - 69",
          summary: "Squire Trelawney buys the Hispaniola in Bristol; hiring the one-legged cook Long John Silver; Captain Smollett's suspicions; Jim hides inside an apple barrel and overhears Silver plotting mutiny.",
          grammarFocus: [
            "Dialogue in literature and dramatic irony",
            "Expressing suspicion and discovery"
          ],
          vocabularyKey: [
            { en: "mutiny", ku: "یاخیبوون و یاخیگەری چەکداری لەناو کەشتیدا" },
            { en: "schooner", ku: "کەشتی دوو تەیرەیی جۆری هیسپانیۆلا" },
            { en: "apple barrel", ku: "بەرمیلی سێو" },
            { en: "loyal crew", ku: "دەستەی کەشتیوانە دڵسۆزەکان" }
          ],
          ministerialPoints: [
            "Where was Jim when he discovered the mutiny? (Inside the apple barrel).",
            "What was Long John Silver's secret identity? (Flint's former quartermaster)."
          ]
        },
        {
          id: "eng-9-3",
          title: "Episodes 5 & 6: The Adventure on Shore & The Stockade",
          pageSB: "82 - 89",
          pageAB: "70 - 73",
          summary: "Landing on Treasure Island; Jim slips ashore and meets the marooned Ben Gunn; the loyal crew abandons ship and takes refuge in the log-house (stockade); Silver offers a truce which Captain Smollett rejects; the pirate assault.",
          grammarFocus: [
            "Descriptive landscape writing and action sequences",
            "Reported negotiations"
          ],
          vocabularyKey: [
            { en: "marooned", ku: "بەجێهێڵراو بە تەنیا لەسەر دوورگەی چۆڵەوانی" },
            { en: "stockade / log-house", ku: "قەڵای دارین و سەنگەری پارێزراو" },
            { en: "truce", ku: "ئاگربەست" },
            { en: "cheese", ku: "پەنیر (ئەوەی بن گەن تامەزرۆی بوو)" }
          ],
          ministerialPoints: [
            "How long had Ben Gunn been marooned on the island? (Three years).",
            "What food was Ben Gunn desperately longing for? (A piece of cheese)."
          ]
        },
        {
          id: "eng-9-4",
          title: "Episodes 7, 8 & 9: The Coracle, The Skeleton & The Gold",
          pageSB: "90 - 102",
          pageAB: "74 - 81",
          summary: "Jim cuts the Hispaniola loose using Ben Gunn's coracle; fights Israel Hands; returns to the stockade to find Silver in charge; pirates follow Flint's pointer (a skeleton); the treasure cache is empty; Ben Gunn had already moved the 700,000 pounds of gold to his cave; sailing home with the fortune; Silver escapes with a small bag of coins.",
          grammarFocus: [
            "Climax and resolution in narrative structure",
            "Themes of greed and redemption"
          ],
          vocabularyKey: [
            { en: "coracle", ku: "بەلەمۆکەی بچووکی خڕی دروستکراو لە پێست و دار" },
            { en: "skeleton", ku: "ئێسکەپەیکەری ئاماژەپێکەری شوێنی گەنجینە" },
            { en: "cache", ku: "شاراوگە و چاڵی گەنجینە" },
            { en: "guineas and doubloons", ku: "دراوە زێڕە کۆنەکانی گەنجینەکە" }
          ],
          ministerialPoints: [
            "Who had already dug up and moved the treasure? (Ben Gunn).",
            "How did Long John Silver escape on the journey back? (He slipped away in a Caribbean port with a bag of gold)."
          ]
        }
      ]
    }
  ];

  // Official English-Kurdish-Arabic Glossary for Sunrise 12
  const GLOSSARY_TERMS = [
    { en: "boarding pass", ku: "پسوولەی سەرکەوتنە فڕۆکە", ar: "بطاقة صعود الطائرة" },
    { en: "customs officer", ku: "ئەفسەری گومرگ", ar: "موظف الجمارك" },
    { en: "immigration", ku: "کۆچبەری و فەرمانگەی پاسپۆرت", ar: "إدارة الهجرة والجوازات" },
    { en: "living standards", ku: "ئاستی بژێوی ژیان", ar: "مستوى المعيشة" },
    { en: "multicultural", ku: "فرەکولتووری", ar: "متعدد الثقافات" },
    { en: "priority", ku: "کاری لەپێشینە و گرنگ", ar: "أولوية" },
    { en: "distraction", ku: "سەرلێشێواندن و لادانی سەرنج", ar: "تشتت الانتباه" },
    { en: "productive", ku: "بەرهەمدار و کارامە", ar: "مُنْتِج / ذو مردود" },
    { en: "archaeologist", ku: "شوێنەوارناس", ar: "عالم آثار" },
    { en: "citadel", ku: "قەڵا یان قەڵای دێرین", ar: "قلعة تاريخية" },
    { en: "heritage site", ku: "شوێنی کەلەپووری جیهانی", ar: "موقع تراث عالمي" },
    { en: "excavation", ku: "هەڵکۆڵین و پشکنینی زەوی", ar: "تنقيب عن الآثار" },
    { en: "artefact", ku: "کەرەستەی دەستکردی مێژوویی", ar: "قطعة أثرية" },
    { en: "sustainable", ku: "بەردەوام و دۆستی ژینگە", ar: "مستدام" },
    { en: "harvest", ku: "دروێنە و وەرزی چنینەوە", ar: "حصاد" },
    { en: "deforestation", ku: "داربڕین و لەناوبردنی دارستان", ar: "إزالة الغابات" },
    { en: "irrigation", ku: "ئاودێری کێڵگەکان", ar: "الري الزراعي" },
    { en: "conservation", ku: "پاراستنی ژینگە و سامانی سروشتی", ar: "الحفاظ على البيئة" },
    { en: "broadband", ku: "هێڵی ئینتەرنێتی پان و خێرا", ar: "النطاق العريض" },
    { en: "connectivity", ku: "بەستراوەیی و پەیوەندی تۆڕ", ar: "الاتصالية بالشبكة" },
    { en: "search engine", ku: "ماتۆڕی گەڕانی ئینتەرنێت", ar: "محرك البحث" },
    { en: "humanitarian aid", ku: "یارمەتی و فریاگوزاری مرۆیی", ar: "المساعدات الإنسانية" },
    { en: "volunteer", ku: "خۆبەخش", ar: "متطوع" },
    { en: "refugee camp", ku: "کەمپی ئاوارە و پەنابەران", ar: "مخيم اللاجئين" },
    { en: "negotiation", ku: "دانوستان و ڕێککەوتن", ar: "مفاوضات" },
    { en: "mutiny", ku: "یاخیبوون لەناو کەشتیدا", ar: "تمرد بحري" },
    { en: "stockade", ku: "سەنگەری دارین و قەڵا", ar: "حصن خشبي" },
    { en: "marooned", ku: "بەجێهێڵراو لە دوورگەی چۆڵ", ar: "مهجور في جزيرة" },
    { en: "coracle", ku: "بەلەمۆکەی بچووکی خڕ", ar: "قارب جلدي صغير" },
    { en: "the Black Spot", ku: "خاڵە ڕەشەکەی چەتەکان", ar: "البقعة السوداء" }
  ];

  const currentUnit = SUNRISE_UNITS.find(
    (u) => u.unitIndex === activeUnitIndex
  ) || SUNRISE_UNITS[0];

  const filteredLessons = currentUnit.lessons.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.summary.toLowerCase().includes(q) ||
      l.grammarFocus?.some((g) => g.toLowerCase().includes(q)) ||
      l.vocabularyKey?.some((v) => v.en.toLowerCase().includes(q) || v.ku.toLowerCase().includes(q)) ||
      l.ministerialPoints?.some((m) => m.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner with Subject Title & Metadata */}
      <div className="bg-gradient-to-r from-sky-900/60 via-[#0a273b] to-indigo-950/60 border border-sky-800/40 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full">
                وەزارەتی پەروەردە - پۆلی ١٢ (زانستی و وێژەیی)
              </span>
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full">
                Sunrise 12 (SB + AB)
              </span>
              <span className="text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full">
                Treasure Island
              </span>
            </div>
            <h2 className="font-sans font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight flex items-center gap-3">
              <Languages className="w-8 h-8 text-sky-400 shrink-0" />
              <span>ئینگلیزی (Sunrise 12)</span>
            </h2>
            <p className="font-sans text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تەواوی مەنهەجی فەرمی ئینگلیزی پۆلی ١٢ بۆ هەردوو بەشی زانستی و وێژەیی: هەشت یەکەی سەرەکی، کتێبی خوێندکار (Student's Book)، کتێبی چاڵاکی (Activity Book)، و ڕۆمانی ئەدەبی Treasure Island بە شێوازی شیکاری ورد و ئامادەکاری بۆ تاقیکردنەوەی وزاری.
            </p>
          </div>

          {/* Quick Stats Block */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-[#071927]/80 border border-sky-800/40 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-mono text-sky-400 block mb-0.5">یەکەکانی مەنهەج</span>
              <span className="text-xl font-mono font-black text-white">٨ یەکە + ڕۆمان</span>
            </div>
            <div className="bg-[#071927]/80 border border-sky-800/40 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-mono text-sky-400 block mb-0.5">کۆی لاپەڕەکان</span>
              <span className="text-xl font-mono font-black text-white">٢٠١ لاپەڕە</span>
            </div>
            <div className="bg-[#071927]/80 border border-sky-800/40 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-emerald-400 block mb-0.5">پەرتووکەکان</span>
              <span className="text-xl font-mono font-black text-emerald-300">SB + AB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Book Mode Switcher Pills: Student's Book vs Activity Book vs Literary Reader */}
      <div className="flex items-center gap-2 bg-[#092238] p-1.5 rounded-2xl border border-cyan-900/40 max-w-md shadow-inner">
        <button
          type="button"
          onClick={() => setActiveBookMode("student")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeBookMode === "student"
              ? "bg-sky-500 text-slate-950 font-black shadow-md"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Student's Book (کتێبی خوێندکار)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveBookMode("activity")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeBookMode === "activity"
              ? "bg-sky-500 text-slate-950 font-black shadow-md"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Activity Book (کتێبی چاڵاکی)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveBookMode("reader");
            setActiveUnitIndex(9); // Navigate to Treasure Island
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeBookMode === "reader"
              ? "bg-rose-500 text-slate-950 font-black shadow-md"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Treasure Island</span>
        </button>
      </div>

      {/* Unit Selection Tabs (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-sky-800/50">
        {SUNRISE_UNITS.map((unit) => {
          const isActive = unit.unitIndex === activeUnitIndex;
          const isNovel = unit.unitIndex === 9;
          return (
            <button
              key={unit.unitIndex}
              onClick={() => {
                setActiveUnitIndex(unit.unitIndex);
                setExpandedLessonId(unit.lessons[0]?.id || null);
                if (isNovel) setActiveBookMode("reader");
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2.5 border ${
                isActive
                  ? isNovel
                    ? "bg-rose-500 text-slate-950 border-rose-400 shadow-lg font-black"
                    : "bg-sky-500 text-slate-950 border-sky-400 shadow-lg font-black"
                  : "bg-[#092238] text-slate-300 border-cyan-950 hover:bg-[#0c2e4a] hover:text-white"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-black ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "bg-sky-950/80 text-sky-400 border border-sky-800/50"
                }`}
              >
                {isNovel ? "📖" : unit.unitIndex}
              </span>
              <div className="text-right">
                <span className="block leading-tight">{unit.title.split(":")[0]}</span>
                <span className="text-[10px] opacity-80 block truncate max-w-[140px]">
                  {unit.title.split(":")[1] || unit.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Unit Overview Card */}
      <div className="bg-[#081f33] border border-cyan-950 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-sky-400 bg-sky-950/70 border border-sky-800/50 px-2.5 py-0.5 rounded-md font-bold">
                Student's Book: Pages {currentUnit.pagesSB}
              </span>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-950/70 border border-amber-800/50 px-2.5 py-0.5 rounded-md font-bold">
                Activity Book: Pages {currentUnit.pagesAB}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {currentUnit.lessons.length} وانەی فەرمی
              </span>
            </div>
            <h3 className="font-sans font-black text-xl text-white">
              {currentUnit.title}
            </h3>
            <p className="text-xs font-mono text-sky-400/90">{currentUnit.subtitle}</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان لە ڕێزمان، وشە و خاڵە وزارییەکان..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#061524] border border-cyan-950 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="bg-[#061726] p-4 rounded-xl border border-cyan-950/80 space-y-2">
          <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentUnit.overview}
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs text-amber-300/90 font-sans">
            <span className="font-bold">تەوەری سەرەکی بە کوردی:</span>
            <span>{currentUnit.theme}</span>
          </div>
        </div>
      </div>

      {/* Lessons Accordion List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-sans font-bold text-sm text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>وانە و بەشەکانی ئەم یەکەیە</span>
          </h4>
          <span className="text-xs font-mono text-slate-400">
            {filteredLessons.length} لە {currentUnit.lessons.length} بەش
          </span>
        </div>

        <div className="space-y-3">
          {filteredLessons.map((lesson) => {
            const isExpanded = expandedLessonId === lesson.id;
            return (
              <div
                key={lesson.id}
                className="bg-[#092238] border border-cyan-950 rounded-2xl overflow-hidden transition-all duration-200 hover:border-cyan-800/60"
              >
                {/* Header Row */}
                <button
                  type="button"
                  onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-sky-950/80 border border-sky-800/50 text-sky-400 font-mono text-xs font-black flex items-center justify-center shrink-0">
                      {lesson.pageSB.split("-")[0].trim()}
                    </span>
                    <div className="min-w-0">
                      <h5 className="font-sans font-bold text-sm sm:text-base text-white truncate">
                        {lesson.title}
                      </h5>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] font-mono text-slate-400">
                        <span>SB: p.{lesson.pageSB}</span>
                        <span>•</span>
                        <span>AB: p.{lesson.pageAB}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectTopicForStudy) {
                          onSelectTopicForStudy(
                            lesson.title,
                            `SB p.${lesson.pageSB} / AB p.${lesson.pageAB}`,
                            currentUnit.title
                          );
                        } else if (onNavigateToChat) {
                          onNavigateToChat();
                        }
                      }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>خوێندن لەگەڵ زانا</span>
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-sky-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-cyan-950/80 bg-[#071927]/60">
                    {/* Summary */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                        پوختە و ناوەڕۆکی فەرمی (Syllabus Summary):
                      </span>
                      <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#05131f] p-3.5 rounded-xl border border-cyan-950">
                        {lesson.summary}
                      </p>
                    </div>

                    {/* Grammar Focus Rules */}
                    {lesson.grammarFocus && lesson.grammarFocus.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" />
                          <span>یاسا سەرەکییەکانی ڕێزمان (Grammar Focus):</span>
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {lesson.grammarFocus.map((rule, idx) => (
                            <div
                              key={idx}
                              className="font-sans text-xs text-emerald-200 bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-xl flex items-start gap-2"
                              dir="ltr"
                            >
                              <span className="text-emerald-400 font-bold shrink-0">•</span>
                              <span className="text-left w-full font-medium">{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vocabulary */}
                    {lesson.vocabularyKey && lesson.vocabularyKey.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>وشەسازی سەرەکی لەگەڵ واتای کوردی (Key Vocabulary):</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {lesson.vocabularyKey.map((vocab, idx) => (
                            <div
                              key={idx}
                              className="bg-[#051422] border border-cyan-950 p-2.5 rounded-xl flex items-center justify-between text-xs"
                            >
                              <span className="font-mono font-bold text-sky-300" dir="ltr">
                                {vocab.en}
                              </span>
                              <span className="font-sans text-slate-300">
                                {vocab.ku}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ministerial Points */}
                    {lesson.ministerialPoints && lesson.ministerialPoints.length > 0 && (
                      <div className="space-y-2 bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-xl">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>خاڵە وزارییە بەردەوامەکان (Ministerial Exam Focus):</span>
                        </span>
                        <ul className="space-y-1.5 pr-2">
                          {lesson.ministerialPoints.map((pt, idx) => (
                            <li
                              key={idx}
                              className="text-xs font-sans text-amber-200/90 list-disc list-inside leading-relaxed"
                            >
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mobile Action Button */}
                    <div className="pt-2 sm:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectTopicForStudy) {
                            onSelectTopicForStudy(
                              lesson.title,
                              `SB p.${lesson.pageSB} / AB p.${lesson.pageAB}`,
                              currentUnit.title
                            );
                          } else if (onNavigateToChat) {
                            onNavigateToChat();
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>خوێندن و تاقیکردنەوە لەسەر ئەم وانەیە لەگەڵ زانا</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Glossary Section (فەرهەنگۆکی فەرمی وشەکانی Sunrise 12) */}
      <div className="bg-[#0b243b] border border-cyan-950 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
          <div className="space-y-0.5">
            <h4 className="font-sans font-bold text-sm text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-sky-400" />
              <span>فەرهەنگۆکی فەرمی وشەکانی Sunrise 12 (ئینگلیزی - کوردی - عەرەبی)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              گرنگترین زاراوە و وشەکانی ناو کتێبی خوێندکار و چاڵاکی بۆ تاقیکردنەوەی وزاری.
            </p>
          </div>
          <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800/40">
            {GLOSSARY_TERMS.length} زاراوە
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
          {GLOSSARY_TERMS.map((term, idx) => (
            <div
              key={idx}
              className="bg-[#071927] border border-cyan-950/80 p-2.5 rounded-xl space-y-1 hover:border-cyan-800/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-sky-300" dir="ltr">
                  {term.en}
                </span>
                <span className="text-[10px] font-sans text-slate-400">
                  {term.ar}
                </span>
              </div>
              <p className="text-[11px] font-sans text-emerald-300/90 truncate">
                {term.ku}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
