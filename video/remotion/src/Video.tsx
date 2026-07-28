import {AbsoluteFill, Audio, Series, staticFile} from 'remotion';
import {SCENES} from './timing';
import {C} from './theme';
import {Captions} from './lib/Captions';

import {ColdOpen} from './scenes/ColdOpen';
import {Intro} from './scenes/Intro';
import {Demo} from './scenes/Demo';
import {Sepolia} from './scenes/Sepolia';
import {Trust} from './scenes/Trust';
import {SafeUntouched} from './scenes/SafeUntouched';
import {Close} from './scenes/Close';

const MAP: Record<string, React.FC> = {
  intro: Intro,
  demo: Demo,
  sepolia: Sepolia,
  trust: Trust,
  safe: SafeUntouched,
  close: Close,
};

/**
 * The voiceover starts at 6.8s, so the frames before it belong to the cold
 * open. That gap is derived from the audio rather than declared, which means a
 * re-record moves the open with it instead of desyncing everything after it.
 */
const OPEN_FRAMES = SCENES[0].startF;

export const Video: React.FC = () => (
  <AbsoluteFill style={{background: C.ink}}>
    <Series>
      <Series.Sequence durationInFrames={OPEN_FRAMES}>
        <ColdOpen />
      </Series.Sequence>
      {SCENES.map((s) => {
        const Comp = MAP[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.durF}>
            {Comp ? <Comp /> : <AbsoluteFill style={{background: C.ink}} />}
          </Series.Sequence>
        );
      })}
    </Series>
    <Audio src={staticFile('final_audio.wav')} />
    <Captions />
  </AbsoluteFill>
);
