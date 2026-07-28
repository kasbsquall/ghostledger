import {loadFont as loadDisplay} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as loadText} from '@remotion/google-fonts/InstrumentSans';

// Type system: a display face with real character + a quieter companion for UI/body.
// Everything in one font at one weight is the #1 "template" tell.
//
// Both faces are OFL (safe to redistribute) and deliberately NOT the AI-default stack:
// Inter, Roboto, Arial, Open Sans, Helvetica, system fonts and the Space Grotesk +
// Instrument Serif + Geist combo are banned. Bricolage Grotesque additionally carries an
// optical-size axis. Swap per film to match the brand — any @remotion/google-fonts/*
// import works, or use @remotion/fonts to load a licensed local file.
const display = loadDisplay('normal', {weights: ['500', '700', '800']});
const text = loadText('normal', {weights: ['400', '500', '600', '700']});

export const FONT = {
  display: display.fontFamily, // headlines, section headers, the building sentence
  text: text.fontFamily, // UI, chips, captions, body
};

/** @deprecated legacy alias — use FONT.text. Named INTER for backwards compatibility
 *  with older scenes; it no longer loads Inter, which is a banned face. */
export const INTER = FONT.text;

// System monospace stack for hashes / code (guaranteed in headless Chrome).
export const MONO = "'JetBrains Mono', 'SF Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace";

export const C = {
  navy: '#09285C',
  navyDeep: '#061A3D',
  blue: '#126CEB',
  blueLite: '#4DA2FF',
  white: '#FFFFFF',
  paper: '#F3F6FC',
  ink: '#08152E',
  red: '#E5484D',
  amber: '#F5A623',
  green: '#22B36B',
  slate: '#61729140',
  slateText: '#5B6B85',
  line: '#E4EAF5',
};

export const FPS = 30;
