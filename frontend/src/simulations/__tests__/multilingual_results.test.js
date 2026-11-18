import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_METADATA,
  localizeClientParamError,
  RESULT_SECTION_LABELS,
} from '../../i18n/translations';
import { LOCALE_MAP, stripMarkdownForSpeech } from '../../services/narration';

describe('LabXAI Frontend Multilingual Result & Voice Narration Helpers', () => {
  const langs = ['en', 'kn', 'hi', 'te', 'ta'];

  it('defines localized dynamic result section labels for all 5 supported languages', () => {
    expect(LANGUAGE_METADATA.map((l) => l.code)).toEqual(langs);
    for (const lang of langs) {
      const lbl = RESULT_SECTION_LABELS[lang];
      expect(lbl).toBeDefined();
      expect(lbl.panelTitle.length).toBeGreaterThan(3);
      expect(lbl.summary.length).toBeGreaterThan(2);
      expect(lbl.observation.length).toBeGreaterThan(2);
      expect(lbl.formula.length).toBeGreaterThan(2);
      expect(lbl.interpretation.length).toBeGreaterThan(2);
      expect(lbl.conclusion.length).toBeGreaterThan(2);
      expect(lbl.application.length).toBeGreaterThan(2);
      expect(lbl.showEnglish.length).toBeGreaterThan(2);
    }
    expect(RESULT_SECTION_LABELS.kn.panelTitle).toMatch(/[\u0C80-\u0CFF]/);
    expect(RESULT_SECTION_LABELS.hi.panelTitle).toMatch(/[\u0900-\u097F]/);
    expect(RESULT_SECTION_LABELS.te.panelTitle).toMatch(/[\u0C00-\u0C7F]/);
    expect(RESULT_SECTION_LABELS.ta.panelTitle).toMatch(/[\u0B80-\u0BFF]/);
  });

  it('localizes invalid parameter validation errors across all 5 languages', () => {
    expect(localizeClientParamError('Resistance must be greater than 0', 'kn')).toMatch(/[\u0C80-\u0CFF]/);
    expect(localizeClientParamError('Resistance must be greater than 0', 'hi')).toMatch(/[\u0900-\u097F]/);
    expect(localizeClientParamError('Resistance must be greater than 0', 'te')).toMatch(/[\u0C00-\u0C7F]/);
    expect(localizeClientParamError('Resistance must be greater than 0', 'ta')).toMatch(/[\u0B80-\u0BFF]/);
  });

  it('preserves Kannada, Hindi, Telugu, and Tamil scripts cleanly for Web SpeechSynthesis narration', () => {
    for (const lang of langs) {
      expect(LOCALE_MAP[lang]).toBeTruthy();
    }
    const knSample = '**ಓಮ್ ನಿಯಮ:** `I = V / R` = 3 A ಮತ್ತು ಶಕ್ತಿ 36 W.';
    const stripped = stripMarkdownForSpeech(knSample);
    expect(stripped).toContain('ಓಮ್ ನಿಯಮ');
    expect(stripped).toContain('I = V / R');
    expect(stripped).not.toContain('**');
    expect(stripped).not.toContain('`');
  });
});
