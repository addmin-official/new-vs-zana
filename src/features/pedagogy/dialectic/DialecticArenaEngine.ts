import { MisconceptionItem, DialecticEvaluation } from './dialecticTypes';

export const CURRICULUM_MISCONCEPTIONS: MisconceptionItem[] = [
  {
    id: 'chem_bases_caustic',
    title: 'مەترسی و سوتێنەری تفتەکان',
    subject: 'chemistry',
    subjectKurdish: 'کیمیا',
    grade: '12',
    fallacyStatement: 'تەنها ترشەکان توانای سوتاندنی پێستیان هەیە، تفتەکان بێ زیان و سابوونین!',
    devilsAdvocateArgument:
      'ڕۆژانە ئێمە سابوون و پاککەرەوە بەکاردەهێنین کە تفتن و هیچمان لێ نایەت، بەڵام هەموومان دەزانین ئەگەر ترشی هایدرۆکلۆریک بەر پێست بکەوێت دەیسوتێنێت. کەواتە تفت هیچ مەترسییەکی سوتێنەری نییە!',
    scientificTruth:
      'تفتە بەهێزەکان وەک هایدرۆکسیدی سۆدیۆم (NaOH) بە هەمان ئەندازەی ترشەکان و بگرە قووڵتریش شانەکانی پێست و پرۆتینەکان دەسوتێنن و هەڵدەوەشێننەوە لە ڕێگەی کارلێکی سابوونی (Saponification).',
    curriculumEvidenceKeywords: [
      'سوتێنەر',
      'کاوستیک',
      'هایدرۆکسید',
      'پرۆتین',
      'چەوری',
      'شانەکان',
      'سۆدیۆم',
      'naoh',
      'صابون'
    ],
    commonFallacies: ['بەڵگاندن بە ئەزموونی ڕۆژانەی لاواز', 'پشتگوێخستنی خەستی'],
    curriculumReference: 'کیمیای پۆلی ١٢ - بەشی پێنجەم (ترش و تفتەکان)'
  },
  {
    id: 'phys_mass_vs_weight',
    title: 'جیاوازی بارستە و کێش',
    subject: 'physics',
    subjectKurdish: 'فیزیا',
    grade: '10',
    fallacyStatement: 'بارستە و کێش یەک شتن و هەردووکیان بە کیلۆگرام (kg) دەپێورێن!',
    devilsAdvocateArgument:
      'کاتێک دەچینە سەر تەرازوو دەڵێین کێشم ٧٠ کیلۆگرامە، هەموو خەڵک و تەرازووەکانیش ئەمە دەڵێن، جیاوازی چییە کاتێک هەمان ژمارە و یەکە دەبینین؟',
    scientificTruth:
      'بارستە (Mass) بڕی ئەو ماددەیەیە کە لە لەش یان تەنێکدایە و بە کیلۆگرام دەپێورێت و نەگۆڕە. کێش (Weight) بریتییە لە هێزی کێشکردنی زەوی بۆ سەر تەنەکە (w = m * g) و بە نیوتن (N) دەپێورێت و لە مانگدا کەمدەبێتەوە.',
    curriculumEvidenceKeywords: [
      'نیوتن',
      'بارستە',
      'هێز',
      'کێشکردن',
      'نەگۆڕ',
      'مانگ',
      'تەرازوو',
      'تاودان',
      'w=mg'
    ],
    commonFallacies: ['تێکەڵکردنی زمانی گشتی لەگەڵ زاراوەی فیزیکی'],
    curriculumReference: 'فیزیا - بەشی دووەم (یاساکانی جووڵەی نیوتن)'
  },
  {
    id: 'math_critical_points',
    title: 'داتاشراوی سفر و ئەوپەڕی نەخشە',
    subject: 'math',
    subjectKurdish: 'بیرکاری',
    grade: '12',
    fallacyStatement: 'ئەگەر f\'(x) = 0 بێت لە خاڵێکدا، ئەوا بە دڵنیاییەوە ئەو خاڵە یا گەورەترینە یا بچووکترین بەهای نەخشەکەیە!',
    devilsAdvocateArgument:
      'بەپێی یاساکانی بیرکاری دەستنیشانکردنی ئەوپەڕەکان بە یەکسانکردنی داتاشراو بە سفر دەکرێت، کەواتە هەرکات داتاشراو سفر بوو بێگومان لووتکە یان قووڵایی چەماوەکەیە!',
    scientificTruth:
      'مەرجی f\'(x) = 0 مەرجێکی پێویستە بەڵام بەس نییە، دەشێت ئەو خاڵە خاڵی وەستانی ئاسۆیی بێت بێ ئەوەی هێمای داتاشراو بگۆڕێت، وەک لە نەخشەی f(x) = x³ لە خاڵی (0,0)دا.',
    curriculumEvidenceKeywords: [
      'هێما',
      'گۆڕان',
      'خاڵی وەرگەڕان',
      'پێویستە بەڵام بەس نییە',
      'تاقیکردنەوەی داتاشراو',
      'x^3',
      'وەستاو'
    ],
    commonFallacies: ['پشتگوێخستنی تاقیکردنەوەی هێمای داتاشراوی یەکەم'],
    curriculumReference: 'بیرکاری پۆلی ١٢ زانستی - بەشی سێیەم (بەکاربەرییەکانی داتاشراو)'
  },
  {
    id: 'phys_centrifugal_force',
    title: 'هێزی دەرباز لە چەق (Centrifugal)',
    subject: 'physics',
    subjectKurdish: 'فیزیا',
    grade: '11',
    fallacyStatement: 'هێزی دەرباز لە چەق (Centrifugal Force) هێزێکی ڕاستەقینەیە کە دەتباتە دەرەوەی بازنە!',
    devilsAdvocateArgument:
      'کاتێک لەناو ئۆتۆمبێلێکداین و پێچێکی تیژ دەکاتەوە، لەشمان بە ئاشکرا پاڵ دەنرێت بەرەو لای دەرەوەی ئۆتۆمبێلەکە، ئەم هێزە فیزیکییە هەستی پێدەکرێت کەواتە هێزێکی ڕاستەقینەیە!',
    scientificTruth:
      'هێزی دەرباز لە چەق هێزێکی خەیاڵییە (Fictitious force) و بەهۆی سڕییەوە (Inertia) دروست دەبێت، چونکە لەشی مرۆڤ دەیەوێت لەسەر هێڵی ڕاست بەردەوام بێت بەپێی یاسای یەکەمی نیوتن لەکاتێکدا ئۆتۆمبێلەکە ئاڕاستەی دەگۆڕێت بەهۆی هێزی بەرەو چەق (Centripetal).',
    curriculumEvidenceKeywords: [
      'سڕی',
      'خەیاڵی',
      'هێڵی ڕاست',
      'بەرەو چەق',
      'نیوتن',
      'تەوەرەی نەسرکەوتوو',
      'inertia'
    ],
    commonFallacies: ['تەفسیرکردنی سڕی وەک هێزی دەرەکی پاڵنەر'],
    curriculumReference: 'فیزیا - بەشی جووڵەی بازنەیی'
  },
  {
    id: 'chem_catalyst_equilibrium',
    title: 'کاریگەری هاندەر (کاتالیست) لەسەر هاوسەنگی',
    subject: 'chemistry',
    subjectKurdish: 'کیمیا',
    grade: '12',
    fallacyStatement: 'زیادکردنی کاتالیست بۆ کارلێکی هاوسەنگ بڕی بەرهەمەکان (Yield) زیاتر دەکات!',
    devilsAdvocateArgument:
      'کاتالیست کارلێک خێرا دەکات و بەربەستی وزە دەشکێنێت، بۆیە کارگەکان هەمیشە کاتالیست بەکاردەهێنن تا مەوادی زیاتریان دەستبکەوێت!',
    scientificTruth:
      'کاتالیست تەنها کاتی گەیشتن بە هاوسەنگی خێراتر دەکات لە ڕێگەی کەمکردنەوەی وزەی چالاککردن (Activation Energy) بۆ هەردوو کارلێکی پێشەوە و پاشەوە بە یەکسانی، بەڵام بڕی بەرهەمەکان و نەگۆڕی هاوسەنگی (Keq) بە هیچ شێوەیەک ناگۆڕێت.',
    curriculumEvidenceKeywords: [
      'وزەی چالاککردن',
      'پێشەوە و پاشەوە',
      'نەگۆڕی هاوسەنگی',
      'keq',
      'کاتی هاوسەنگی',
      'یەکسان',
      'ناگۆڕێت'
    ],
    commonFallacies: ['تێکەڵکردنی خێرایی کارلێک لەگەڵ شوێنی هاوسەنگی'],
    curriculumReference: 'کیمیای پۆلی ١٢ - بەشی حەوتەم (هاوسەنگیی کیمیایی)'
  },
  {
    id: 'bio_plant_respiration',
    title: 'هەناسەدانی ڕووەک لە ڕۆژدا',
    subject: 'biology',
    subjectKurdish: 'زیندەوەرزانی',
    grade: '11',
    fallacyStatement: 'ڕووەکەکان تەنها لە شەودا هەناسە دەدەن، لە ڕۆژدا تەنها ڕۆشنەپێکهاتن دەکەن!',
    devilsAdvocateArgument:
      'لە ڕۆژدا ڕووەک گازی ئۆکسجین بەرهەمدەهێنێت و دوانەئۆکسیدی کاربۆن وەردەگرێت، کەواتە پێویستی بە هەناسەدان نییە و هەناسەدان تایبەتە بە تاریکی شەو!',
    scientificTruth:
      'ڕووەک خانەی زیندووە و بە بەردەوامی (٢٤ کاتژمێر بێ وەستان) هەناسەدانی خانەیی ئەنجام دەدات بۆ بەرهەمهێنانی وزەی ATP. لە ڕۆژدا خێرایی ڕۆشنەپێکهاتن زۆرترە لە هەناسەدان بۆیە دەرچوونی ئۆکسجین دەردەکەوێت.',
    curriculumEvidenceKeywords: [
      'بەردەوام',
      'atp',
      'هەناسەدانی خانەیی',
      'مایتۆکۆندریا',
      'خێرایی',
      'وزە',
      'تاریکی و ڕۆژ'
    ],
    commonFallacies: ['پێوانەکردنی پرۆسەی ناوخۆیی بە گازی بەرهەمهاتوو'],
    curriculumReference: 'زیندەوەرزانی - زیندەچالاکییەکانی خانە'
  },
  {
    id: 'phys_vacuum_fall',
    title: 'کەوتنی ئازاد لە بۆشاییدا',
    subject: 'physics',
    subjectKurdish: 'فیزیا',
    grade: '10',
    fallacyStatement: 'لە بۆشاییدا تەنی قورستر خێراتر لە تەنی سووک دەکەوێتە خوارەوە چونکە کێشکردنی زۆرترە!',
    devilsAdvocateArgument:
      'هێزی کێشکردن ڕاستەوانە دەگۆڕێت لەگەڵ بارستە (F = G*M*m/r²)، کەواتە هێزەکە لەسەر تەنی قورستر گەورەترە و بە دڵنیاییەوە زووتر دەگاتە زەوی!',
    scientificTruth:
      'هەرچەندە هێزی کێشکردن لەسەر تەنی قورستر گەورەترە، بەڵام سڕی (بارستەی بەرگری)یش بە هەمان ڕێژە گەورەترە. کاتێک تاودان دەدۆزینەوە a = F/m، بارستەکە لادەچێت و تاودانی هەردوو تەنەکە دەبێتە g = 9.8 m/s² و لە یەک کاتدا دەگەن.',
    curriculumEvidenceKeywords: [
      'تاودان',
      'سڕی',
      'g = 9.8',
      'بەرگری هەوا',
      'گالیلۆ',
      'بارستە لادەچێت',
      'یەکسان'
    ],
    commonFallacies: ['پشتگوێخستنی یاسای دووەمی نیوتن (a = F/m)'],
    curriculumReference: 'فیزیا - بەشی کەوتنی ئازاد'
  },
  {
    id: 'chem_neutral_ph',
    title: 'پێوەری pH لە گیراوەی بێلایەندا',
    subject: 'chemistry',
    subjectKurdish: 'کیمیا',
    grade: '12',
    fallacyStatement: 'گیراوەی بێلایەن (Neutral) هەمیشە pHەکەی دەبێت ٧ بێت لە هەموو پلەیەکی گەرمیدا!',
    devilsAdvocateArgument:
      'هەر لە پۆلی ٩وە فێربووین کە ٧ بێلایەنە، ژێر ٧ ترشە، سەرووی ٧ تفتە. ئەم ژمارەیە نەگۆڕە چونکە ئاو هەمیشە بێلایەنە کەواتە هەمیشە ٧ە!',
    scientificTruth:
      'پێناسەی بێلایەنی بریتییە لە یەکسانبوونی [H₃O⁺] = [OH⁻]. بەهای pH = 7 تەنها لە پلەی گەرمی 25°C دایە کە Kw = 10⁻¹⁴ دەبێت. لە پلەی گەرمی بەرزتردا کارلێکی خۆبەخۆ هەڵوەشانی ئاو گەرمیمژە و Kw زیاد دەکات، بۆیە لە 60°C بێلایەنی دەبێتە pH = 6.5.',
    curriculumEvidenceKeywords: [
      'kw',
      'پلەی گەرمی',
      '25 پلە',
      'گەرمیمژ',
      '[h3o+] = [oh-]',
      'لۆچاتلیە',
      'خۆبەخۆ'
    ],
    commonFallacies: ['ڕەچاونەکردنی گۆڕانی نەگۆڕی هاوسەنگی بە گەرمی'],
    curriculumReference: 'کیمیای پۆلی ١٢ - بەشی پێنجەم (خۆبەخۆ ئایۆنینی ئاو)'
  },
  {
    id: 'math_division_by_zero',
    title: 'دابەشکردن لەسەر سفر',
    subject: 'math',
    subjectKurdish: 'بیرکاری',
    grade: '11',
    fallacyStatement: 'هەر ژمارەیەک دابەشی سفر بکەیت ئەنجامەکەی دەبێتە بێکۆتا (Infinity)!',
    devilsAdvocateArgument:
      'کاتێک ژمارەی ژێرەوە بچووک دەبێتەوە ئەنجام گەورە دەبێتەوە، بۆیە کاتێک دەبێتە سفر وەڵام دەبێتە مەزنترین شت کە بێکۆتایە!',
    scientificTruth:
      'لە ژمێریاریدا دابەشکردن لەسەر سفر بەهایەکی نەناسێنراوە (Undefined). چەمکی بێکۆتا تەنها لە لیمیت (Limit) کاتێک لە ژێرەوە بەرەو سفر دەچێت دەردەکەوێت، بەڵام دابەشکردنی ڕاستەوخۆ پێناسە نەکراوە چونکە بەپێچەوانەی یاساکانی لێکدان و کێڵگەی ژمارەییەکانە.',
    curriculumEvidenceKeywords: [
      'نەناسێنراو',
      'پێناسەنەکراو',
      'لیمیت',
      'سفر لەسەر سفر',
      'دەستنیشان نەکراو',
      'undefined'
    ],
    commonFallacies: ['تێکەڵکردنی لیمیتی نەخشە لەگەڵ دابەشکردنی ڕاستەقینەی ژمارەیی'],
    curriculumReference: 'بیرکاری پۆلی ١١ و ١٢ - بەشی لیمیت و بەردەوامی'
  },
  {
    id: 'phys_electron_drift',
    title: 'خێرایی ڕۆیشتنی ئەلیکترۆن لە تەلی کارەبادا',
    subject: 'physics',
    subjectKurdish: 'فیزیا',
    grade: '12',
    fallacyStatement: 'کاتێک گڵۆپ دادەگیرسێنین، ئەلیکترۆنەکان بە خێرایی ڕووناکی لە کلیلەکەوە ڕادەکەن بۆ لای گڵۆپەکە!',
    devilsAdvocateArgument:
      'دەستبەجێ کاتێک پەنجە بە کلیلەکەدا دەنێیت گڵۆپەکە هەڵدەبێت بەبێ یەک چرکە دواکەوتن، ئەگەر ئەلیکترۆنەکە بەو خێراییە ڕانەکات چۆن دەستبەجێ ڕووناک دەبێتەوە؟',
    scientificTruth:
      'ئەوەی بە نزیکەی خێرایی ڕووناکی بڵاودەبێتەوە کێڵگەی کارەباییە (Electric Field) نەک ئەلیکترۆن. تێکڕای خێرایی کێشکرانی خودی ئەلیکترۆنەکان (Drift Velocity) زۆر هێواشە و چەند ملیمەترێکە لە چرکەیەکدا.',
    curriculumEvidenceKeywords: [
      'کێڵگەی کارەبایی',
      'خێرایی خلیسکین',
      'drift velocity',
      'بەرکەوتن',
      'تەزوو',
      'میلیمەتر',
      'هێواش'
    ],
    commonFallacies: ['تێکەڵکردنی خێرایی شەپۆلی کێڵگە لەگەڵ خێرایی تەنۆلکەکان'],
    curriculumReference: 'فیزیا - بەشی تەزووی کارەبایی و بەرگری'
  }
];

export class DialecticArenaEngine {
  public static getMisconceptionById(id: string): MisconceptionItem | undefined {
    return CURRICULUM_MISCONCEPTIONS.find((m) => m.id === id);
  }

  public static evaluateStudentArgument(
    misconception: MisconceptionItem,
    argumentText: string
  ): DialecticEvaluation {
    const text = argumentText.trim().toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // 1. Check for evidence keywords
    const detectedKeywords = misconception.curriculumEvidenceKeywords.filter((kw) =>
      text.includes(kw.toLowerCase())
    );

    const keywordRatio = detectedKeywords.length / Math.min(3, misconception.curriculumEvidenceKeywords.length);
    const keywordScore = Math.min(100, Math.round(keywordRatio * 100));

    // 2. Check for logical / causal connectors in Kurdish
    const causalConnectors = ['چونکە', 'لەبەر ئەوەی', 'لەبەرئەوەی', 'بەڵگە', 'یاسای', 'بەپێی', 'هاوکێشەی', 'هۆکار'];
    const foundConnectors = causalConnectors.filter((c) => text.includes(c));
    const connectorScore = Math.min(100, foundConnectors.length * 35);

    // 3. Fallacy free score
    let fallacyFreeScore = 80;
    if (wordCount < 6) {
      fallacyFreeScore -= 30; // too brief, likely just assertion
    }
    if (text.includes('هەر وایە') || text.includes('من وادەڵێم') || text.includes('دیارە ئیتر')) {
      fallacyFreeScore -= 25; // dogmatic assertion
    }
    if (foundConnectors.length > 0 && detectedKeywords.length > 0) {
      fallacyFreeScore = Math.min(100, fallacyFreeScore + 20);
    }

    // 4. Scientific validity score
    const scientificValidityScore = Math.round(keywordScore * 0.7 + (wordCount >= 10 ? 30 : wordCount * 3));

    // 5. Rhetorical clarity score
    const rhetoricalClarityScore = Math.min(
      100,
      Math.round(connectorScore * 0.5 + (wordCount >= 12 ? 50 : wordCount * 4))
    );

    // Overall
    const overallScore = Math.min(
      100,
      Math.round(scientificValidityScore * 0.45 + fallacyFreeScore * 0.25 + rhetoricalClarityScore * 0.3)
    );

    let verdict: 'CONVINCING' | 'PARTIALLY_CONVINCING' | 'UNCONVINCING' = 'UNCONVINCING';
    if (overallScore >= 75 && detectedKeywords.length >= 2) {
      verdict = 'CONVINCING';
    } else if (overallScore >= 50 || detectedKeywords.length >= 1) {
      verdict = 'PARTIALLY_CONVINCING';
    }

    // Feedback generation
    let counterFeedback = '';
    if (verdict === 'CONVINCING') {
      counterFeedback = `ئافەرم! بەڵگاندنێکی زانستی بێ خەوشت هێنایەوە. تۆ سەلماندت کە: "${misconception.scientificTruth}". بە بەکارهێنانی دەستەواژەکانی وەک (${detectedKeywords.join('، ')}) ڕەوایەتییەکی تەواوت بەخشی بە وتەکەت و دژبەری زانستی ناچار بوو دان بە ڕاستییەکەدا بنێت.`;
    } else if (verdict === 'PARTIALLY_CONVINCING') {
      counterFeedback = `بەڵگەکەت تا ڕادەیەک ئاڕاستەی دروستی گرتووە، بەڵام دژبەری زانستی هێشتا دەتوانێت کێشەت بۆ دروست بکات! پێویستە زیاتر تیشک بخەیتە سەر چەمکەکانی وەک (${misconception.curriculumEvidenceKeywords.slice(0, 3).join('، ')}) تا بەڵگەکەت پۆڵایین بێت.`;
    } else {
      counterFeedback = `بەڵگەکەت هێشتا لاوازە و تەنها وتەی گشتی تێدایە. بیرت نەچێت ئێمە لە دیبەیتی زانستیداین، دەبێت هۆکار و یاسای مەنهەج بهێنیتەوە. تکایە سەرنج بدە: "${misconception.scientificTruth}".`;
    }

    return {
      scientificValidityScore,
      fallacyFreeScore,
      rhetoricalClarityScore,
      overallScore,
      detectedKeywords,
      verdict,
      counterFeedback,
      curriculumReference: misconception.curriculumReference
    };
  }

  public static generateAdvocateRebuttal(
    misconception: MisconceptionItem,
    evaluation: DialecticEvaluation
  ): string {
    if (evaluation.verdict === 'CONVINCING') {
      return `مەیدانەکەت بردەوە! من وەک بەرەی دژبەر ناچارم دەستبەرداری ئەم بۆچوونە هەڵەیە بم، چونکە تۆ بە بەڵگەی سەلمێنراوی زانستی سەلماندت کە تیۆرییەکەم ناتەواوە.`;
    } else if (evaluation.verdict === 'PARTIALLY_CONVINCING') {
      return `قسەکەت لە ڕوویەکەوە جێگەی بایەخە، بەڵام هێشتا وەڵامی پرسیارە سەرەکییەکەت نەداوەتەوە! چۆن ئەمە لەگەڵ تاقیکردنەوە فەرمییەکان و مەنهەج دەگونجێنیت؟ داوات لێدەکەم بەڵگەی زیاترم بۆ بهێنیت.`;
    } else {
      return `هێشتا نەتوانیت لە ڕووی زانستییەوە بمبەزێنیت! ئەوەی وتت تەنها ڕای خۆتە و بەڵگەی یاسایی زانستیت نەهێناوەتەوە. من هێشتا لەسەر هەڵوێستەکەم بەردەوامم کە ${misconception.fallacyStatement}`;
    }
  }
}
