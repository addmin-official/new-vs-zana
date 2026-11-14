import {
  LeitnerBoxNumber,
  LeitnerFlashCard,
  LeitnerQueueSummary
} from "./leitnerTypes.ts";

export const LEITNER_INTERVALS_DAYS: Record<LeitnerBoxNumber, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 16,
  5: 35,
};

const DEFAULT_LEITNER_CARDS: LeitnerFlashCard[] = [
  {
    id: "leitner-chem-ph",
    grade: "12",
    subject: "chemistry",
    topicKu: "پێوەری pH بۆ گیراوەی ترش و تفتەکان",
    questionKu: "ئەگەر [H₃O⁺] = 1 × 10⁻⁴ M بێت، نرخی pH ی گیراوەکە چەندە و گیراوەکە ترشە یان تفت؟",
    optionsKu: ["pH = 4 (ترشە)", "pH = 10 (تفتە)", "pH = 4 (تفتە)", "pH = 7 (بێلایەنە)"],
    correctAnswer: "pH = 4 (ترشە)",
    explanationKu: "pH = -log[H₃O⁺] = -log(10⁻⁴) = 4. لەبەر ئەوەی pH کەمترە لە 7، گیراوەکە ترشە.",
    box: 1,
    lastReviewedAt: Date.now() - 2 * 86400000, // 2 days ago (due for Box 1)
    stabilityDays: 1,
  },
  {
    id: "leitner-phys-centripetal",
    grade: "12",
    subject: "physics",
    topicKu: "تاودانی ناوەکی لە بزووتنی بازنەیی",
    questionKu: "ئاڕاستەی تاودانی ناوەکی (a_c) لە بزووتنی بازنەیی یەکساندا بەرەو کوێیە؟",
    optionsKu: ["بەرەو چەقی بازنەکە", "لەگەڵ لێکەوتی چەماوەکە", "بەرەو دەرەوەی بازنەکە", "بەپێی خێرایی دەگۆڕێت"],
    correctAnswer: "بەرەو چەقی بازنەکە",
    explanationKu: "تاودانی ناوەکی هەمیشە ئەستوونە لەسەر خێرایی لێکەوت و بەرەو سەنتەر (چەق) ئاڕاستە کراوە.",
    box: 2,
    lastReviewedAt: Date.now() - 4 * 86400000, // 4 days ago (due for Box 2: interval 3)
    stabilityDays: 3,
  },
  {
    id: "leitner-math-limit",
    grade: "12",
    subject: "math",
    topicKu: "سنووری نەخشەکان لە بیرکاری",
    questionKu: "نرخی lim (x→0) sin(x)/x چەندە؟",
    optionsKu: ["1", "0", "بێ کۆتا (∞)", "بوونی نییە"],
    correctAnswer: "1",
    explanationKu: "ئەمە یەکێکە لە بنەما سەرەکییەکانی سنووری سێگۆشەیی لە بەندی دووەمی بیرکاری ١٢دا.",
    box: 3,
    lastReviewedAt: Date.now() - 8 * 86400000, // 8 days ago (due for Box 3: interval 7)
    stabilityDays: 7,
  },
  {
    id: "leitner-chem-kw",
    grade: "12",
    subject: "chemistry",
    topicKu: "نەگۆڕی خۆئایۆنینی ئاو (Kw)",
    questionKu: "لە پلەی گەرمی 25°C دا، نرخی نەگۆڕی خۆئایۆنینی ئاو Kw یەکسانە بە چەند؟",
    optionsKu: ["1.0 × 10⁻¹⁴", "1.0 × 10⁻⁷", "1.0 × 10⁷", "14.0"],
    correctAnswer: "1.0 × 10⁻¹⁴",
    explanationKu: "Kw = [H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴ لە 25°C.",
    box: 4,
    lastReviewedAt: Date.now() - 10 * 86400000,
    stabilityDays: 16,
  },
  {
    id: "leitner-bio-dna",
    grade: "12",
    subject: "biology",
    topicKu: "پەیوەندی بازە نایترۆجینییەکان لە DNA",
    questionKu: "لە پێکهاتەی گەردی DNAدا، ئەدینین (A) هەمیشە بە چەند بۆندی هایدرۆجینی دەبەسترێتەوە بە تایمین (T)؟",
    optionsKu: ["دوو بۆندی هایدرۆجینی", "سێ بۆندی هایدرۆجینی", "یەک بۆندی کۆڤالێنت", "چوار بۆند"],
    correctAnswer: "دوو بۆندی هایدرۆجینی",
    explanationKu: "A و T بە ٢ بۆندی هایدرۆجینی دەبەسترێنەوە، لە کاتێکدا G و C بە ٣ بۆند بەستراونەتەوە.",
    box: 5,
    lastReviewedAt: Date.now() - 15 * 86400000,
    stabilityDays: 35,
  }
];

const LEITNER_STORAGE_KEY = "zana_leitner_cards_v1";

export class LeitnerScheduleEngine {
  static getCards(): LeitnerFlashCard[] {
    if (typeof window === "undefined") return DEFAULT_LEITNER_CARDS;
    try {
      const data = localStorage.getItem(LEITNER_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    this.saveCards(DEFAULT_LEITNER_CARDS);
    return DEFAULT_LEITNER_CARDS;
  }

  static saveCards(cards: LeitnerFlashCard[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(cards));
    } catch {}
  }

  /**
   * Calculates retention probability R = e^(-t/S)
   */
  static calculateRetention(card: LeitnerFlashCard): number {
    const elapsedDays = (Date.now() - card.lastReviewedAt) / 86400000;
    const stability = Math.max(card.stabilityDays, 1);
    const retention = Math.exp(-elapsedDays / stability);
    return Math.round(Math.min(Math.max(retention, 0.05), 1.0) * 100);
  }

  /**
   * Identifies cards that are due for review (elapsed time exceeds interval or retention < 75%)
   */
  static getDueCards(limit = 3): LeitnerFlashCard[] {
    const cards = this.getCards();
    const now = Date.now();

    const dueCards = cards.filter((card) => {
      const elapsedDays = (now - card.lastReviewedAt) / 86400000;
      const targetInterval = LEITNER_INTERVALS_DAYS[card.box];
      return elapsedDays >= targetInterval || this.calculateRetention(card) < 70;
    });

    // Sort by lowest retention first
    dueCards.sort((a, b) => this.calculateRetention(a) - this.calculateRetention(b));

    return dueCards.slice(0, limit);
  }

  /**
   * Promotes card to next box on success, or demotes to Box 1 on error.
   */
  static answerCard(cardId: string, isCorrect: boolean): LeitnerFlashCard | null {
    const cards = this.getCards();
    const index = cards.findIndex((c) => c.id === cardId);
    if (index === -1) return null;

    const card = cards[index];
    let nextBox: LeitnerBoxNumber = card.box;

    if (isCorrect) {
      nextBox = Math.min(card.box + 1, 5) as LeitnerBoxNumber;
    } else {
      nextBox = 1; // Demote to box 1 on failure to reset Ebbinghaus consolidation
    }

    const updatedCard: LeitnerFlashCard = {
      ...card,
      box: nextBox,
      lastReviewedAt: Date.now(),
      stabilityDays: LEITNER_INTERVALS_DAYS[nextBox],
    };

    cards[index] = updatedCard;
    this.saveCards(cards);
    return updatedCard;
  }

  static getSummary(): LeitnerQueueSummary {
    const cards = this.getCards();
    const due = this.getDueCards(100).length;

    const boxCounts: Record<LeitnerBoxNumber, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let totalRetention = 0;
    cards.forEach((c) => {
      boxCounts[c.box] = (boxCounts[c.box] || 0) + 1;
      totalRetention += this.calculateRetention(c);
    });

    const avgRetention = cards.length > 0 ? Math.round(totalRetention / cards.length) : 100;

    return {
      dueCardsCount: due,
      boxCounts,
      averageRetentionRate: avgRetention,
      consolidatedLongTermCount: boxCounts[5] || 0,
    };
  }
}
