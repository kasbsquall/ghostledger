import {loadFont as loadDisplay} from '@remotion/google-fonts/Archivo';
import {loadFont as loadMono} from '@remotion/google-fonts/MartianMono';

// Ported from the product, not invented for the film. A palette designed
// alongside an app that already has one is a mismatch a viewer feels without
// being able to name it. Source: frontend/src/styles/tokens.css.
const display = loadDisplay('normal', {weights: ['400', '500', '600']});
const mono = loadMono('normal', {weights: ['300', '400']});

export const FONT = {
  display: display.fontFamily,
  text: display.fontFamily,
};

/** @deprecated legacy alias kept for the template's own components. */
export const INTER = FONT.text;

export const MONO = mono.fontFamily;

// The product has no brand colour. Every drop of chroma is spent on the risk
// scale so a red badge has nothing to compete with, and the film keeps that
// discipline: greys carry the whole picture until a verdict lands.
export const C = {
  ink: '#0a0c0e',
  graphite: '#101418',
  slate: '#161c21',
  raised: '#1c2329',

  hair: 'rgba(232, 234, 231, 0.075)',
  hairStrong: 'rgba(232, 234, 231, 0.14)',

  bone: '#e8eae7',
  boneLift: '#f3f5f2',
  dim: '#99a3ab',
  mute: '#8b959d',
  faint: '#6f7b85',

  clear: '#4d9a72',
  watch: '#b8893c',
  flag: '#d4726a',
  clearWash: 'rgba(77, 154, 114, 0.12)',
  watchWash: 'rgba(184, 137, 60, 0.12)',
  flagWash: 'rgba(212, 114, 106, 0.13)',

  // Aliases the template's own primitives reach for.
  navy: '#0a0c0e',
  navyDeep: '#08090b',
  blue: '#99a3ab',
  blueLite: '#e8eae7',
  white: '#e8eae7',
  paper: '#f3f5f2',
  red: '#d4726a',
  amber: '#b8893c',
  green: '#4d9a72',
  slateText: '#8b959d',
  line: 'rgba(232, 234, 231, 0.075)',
  gold: '#b8893c',
  risk: '#d4726a',
};

export const FPS = 30;

/** Entrances decelerate to a genuine stop; exits accelerate past the frame. */
export const EASE_IN = [0.23, 1, 0.32, 1] as const;
export const EASE_MOVE = [0.5, 0, 0.25, 1] as const;
