export interface VirtualLabExperiment {
  id: string;
  subject: string;
  grade: number;
  title_ku: string;
  description_ku: string;
  simulation_type: "ph_titration" | "circular_motion" | "ohms_law" | "lens_optics";
  parameters_config: Record<string, unknown>;
  safety_warnings_ku: string;
  real_world_application_ku: string;
}

export const REAL_VIRTUAL_LAB_EXPERIMENTS: VirtualLabExperiment[] = [
  {
    id: "lab-chem-01",
    subject: "chemistry",
    grade: 12,
    title_ku: "تاقیکردنەوەی پێوانەکاری و دۆزینەوەی پێوەری pH",
    description_ku: "سیمولەیشنی کارلێکی بێلایەنکردنی ترشی هایدرۆکلۆریک (HCl) لەگەڵ تفتی سۆدیۆم هایدرۆکساید (NaOH) بە بەکارهێنانی پێوانە و بێورێت.",
    simulation_type: "ph_titration",
    parameters_config: {
      acid: "HCl",
      base: "NaOH",
      acid_concentration_initial: 0.1,
      acid_volume_ml: 25.0,
      base_concentration: 0.1,
      indicator: "phenolphthalein",
      equivalence_ph: 7.0
    },
    safety_warnings_ku: "پێویستە چاویلکەی پارێزەر و دەستکێش لەبەر بکرێت چونکە ترش و تفتە بەهێزەکان ماددەی خورێنەرن.",
    real_world_application_ku: "لە پیشەسازی دەرمان و تاقیگەکانی کوالیتی کۆنترۆڵ بۆ دڵنیابوونەوە لە پاکی و ڕادەی ترشێتی بەرهەمەکان بەکاردێت."
  },
  {
    id: "lab-phys-01",
    subject: "physics",
    grade: 12,
    title_ku: "سیمولەیشنی بزووتنی خولاو و تاودانی چەقەهێز",
    description_ku: "تاقیکردنەوەی جووڵەی تەنێک بە دەوری چەقێکدا لەسەر ڕێڕەوی بازنەیی و چاودێریکردنی گۆڕانکارییەکانی تاودانی چەقەهێز و هێز بە گۆڕینی نیوەتیرە و خێرایی.",
    simulation_type: "circular_motion",
    parameters_config: {
      mass_kg: 2.0,
      radius_m_min: 1.0,
      radius_m_max: 10.0,
      radius_m_default: 4.0,
      velocity_mps_min: 1.0,
      velocity_mps_max: 30.0,
      velocity_mps_default: 12.0
    },
    safety_warnings_ku: "لە جیهانی ڕاستەقینەدا گۆڕانی لەپڕی ئاڕاستە بە خێرایی بەرز دەبێتە هۆی وەرگەڕانی تەنەکە بەهۆی بێتوانایی هێزی لێکخشاندن لە دابینکردنی هێزی چەقەهێز.",
    real_world_application_ku: "ئەندازیارانی ڕێگاوبان ئەم یاسایانە بەکاردەهێنن بۆ لێژکردنی پێچەکانی شەقام و هێڵی شەمەندەفەر بۆ سەلامەتی شۆفێران."
  },
  {
    id: "lab-phys-02",
    subject: "physics",
    grade: 12,
    title_ku: "سیمولەیشنی یاسای ئۆم و بازنەی کارەبایی کارلێککار",
    description_ku: "تاقیکردنەوەی ڕاستەوخۆی پەیوەندی نێوان جیاوازی پۆتانسێل (V)، تەزووی کارەبایی (I)، و بەرگری (R) لەگەڵ ئەگەری بەستنی بەرگرییەکان بە هاوتەریب و بەدوای یەک.",
    simulation_type: "ohms_law",
    parameters_config: {
      voltage_v_min: 1,
      voltage_v_max: 24,
      voltage_v_default: 12,
      resistance_ohm_min: 1,
      resistance_ohm_max: 100,
      resistance_ohm_default: 10,
      circuit_modes: ["single", "series", "parallel"]
    },
    safety_warnings_ku: "خۆت بەدوور بگرە لە کورتە هێڵ (Short circuit) کە تێیدا بەرگری سفر دەبێت و تەزووی کارەبا دەگاتە ئەوپەڕی بڕ و دەبێتە هۆی سووتانی ئامێرەکان.",
    real_world_application_ku: "داڕشتنی بۆردی ئەلیکترۆنی، ئامێرەکانی ماڵ، و سیستەمی دابەشکردنی کارەبای نیشتمانی."
  }
];
