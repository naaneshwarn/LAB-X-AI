import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CLIENT_SIMULATION_REGISTRY } from '../engines/index.js';
import {
  EXPERIMENT_IMAGES,
  FALLBACK_EXPERIMENT_IMAGE,
  getExperimentImage,
} from '../../data/experimentImages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../../../public');

describe('Experiment Visual Illustrations and Asset Mapping', () => {
  const allIds = Object.keys(CLIENT_SIMULATION_REGISTRY);

  it('every experiment ID has an entry in EXPERIMENT_IMAGES', () => {
    expect(allIds.length).toBe(51);
    allIds.forEach((id) => {
      expect(EXPERIMENT_IMAGES[id], `Missing image entry for experiment: ${id}`).toBeDefined();
    });
  });

  it('every mapped image path physically exists as a file in public directory', () => {
    allIds.forEach((id) => {
      const entry = EXPERIMENT_IMAGES[id];
      const relPath = entry.image.startsWith('/') ? entry.image.slice(1) : entry.image;
      const fullPath = path.join(PUBLIC_DIR, relPath);
      expect(fs.existsSync(fullPath), `Image file does not exist: ${fullPath} for ID ${id}`).toBe(
        true
      );
    });
  });

  it('every image file is a valid non-empty SVG with proper XML/SVG tag', () => {
    allIds.forEach((id) => {
      const entry = EXPERIMENT_IMAGES[id];
      const relPath = entry.image.startsWith('/') ? entry.image.slice(1) : entry.image;
      const fullPath = path.join(PUBLIC_DIR, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content.length, `File is too small: ${fullPath}`).toBeGreaterThan(150);
      expect(content.trim().startsWith('<svg'), `File does not start with <svg: ${fullPath}`).toBe(
        true
      );
      expect(content.includes('</svg>'), `File does not close </svg>: ${fullPath}`).toBe(true);
    });
  });

  it('all experiment image paths are unique (no shared/repeated images across experiments)', () => {
    const paths = allIds.map((id) => EXPERIMENT_IMAGES[id].image);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it('every image entry has meaningful, educational descriptive alt text', () => {
    allIds.forEach((id) => {
      const entry = EXPERIMENT_IMAGES[id];
      expect(entry.alt).toBeDefined();
      expect(entry.alt.length, `Alt text too short for ${id}`).toBeGreaterThan(15);
    });
  });

  it('each entry provides fit property and subjectBg color', () => {
    allIds.forEach((id) => {
      const entry = EXPERIMENT_IMAGES[id];
      expect(['contain', 'cover']).toContain(entry.fit);
      expect(entry.subjectBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('fallback SVG exists and is valid', () => {
    const relPath = FALLBACK_EXPERIMENT_IMAGE.image.startsWith('/')
      ? FALLBACK_EXPERIMENT_IMAGE.image.slice(1)
      : FALLBACK_EXPERIMENT_IMAGE.image;
    const fullPath = path.join(PUBLIC_DIR, relPath);
    expect(fs.existsSync(fullPath)).toBe(true);
    const content = fs.readFileSync(fullPath, 'utf-8');
    expect(content.includes('<svg')).toBe(true);
  });

  it('getExperimentImage returns proper entry or graceful fallback', () => {
    const ohms = getExperimentImage('ohms-law');
    expect(ohms.image).toBe('/assets/experiments/physics/ohms-law.svg');

    const unknown = getExperimentImage('nonexistent-simulation-12345');
    expect(unknown).toEqual(FALLBACK_EXPERIMENT_IMAGE);

    const empty = getExperimentImage(null);
    expect(empty).toEqual(FALLBACK_EXPERIMENT_IMAGE);
  });
});
