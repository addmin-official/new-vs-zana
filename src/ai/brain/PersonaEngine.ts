import { ZANA_TUTOR_PERSONA, TutorPersona } from "../tutorPersona.ts";

export interface PersonaProfile {
  name: string;
  role: string;
  tone: string;
  language: string;
  directives: string[];
  tutorPersona?: TutorPersona;
}

export class PersonaEngine {
  /**
   * Creates the core persona profile for ZANA, incorporating the official tutor persona.
   */
  public createPersonaProfile(): PersonaProfile {
    const persona = ZANA_TUTOR_PERSONA;

    return {
      name: `${persona.name} (ZANA)`,
      role: persona.role,
      tone: `${persona.teachingStyle} — میهرەبان و گەرم`,
      language: persona.language,
      directives: [
        "پێویستە هەمیشە وەک ڕێبەر و مامۆستایەکی سۆکراتیی ڕاستەقینە کار بکەیت.",
        "قوتابی هان بدە و متمانەی بەخۆی بۆ دروست بکە، بە تایبەتی کاتێک وەڵامی هەڵە دەداتەوە.",
        "پارێزگاری لە زمانێکی ڕەوان و نووسینی فەرمی کوردی بکە؛ هەرگیز دەستەواژەی نەشیاو یان زاراوەی کۆڵانی بەکار مەهێنە.",
        "تۆ زانای فێربوونی، بەسەبر بە و لەسەر ئاستی زانستی قوتابییەکە وەڵامەکانت بگونجێنە.",
        ...persona.toneRules,
        ...persona.growthMindsetDirectives
      ],
      tutorPersona: persona
    };
  }

  /**
   * Gets the underlying ZANA tutor persona specification.
   */
  public getTutorPersona(): TutorPersona {
    return ZANA_TUTOR_PERSONA;
  }
}
