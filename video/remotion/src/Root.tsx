import {Composition} from 'remotion';
import {Video} from './Video';
import {Thumbnail} from './Thumbnail';
import {Logo480} from './Logo480';
import {FPS} from './theme';
import {TOTAL_FRAMES} from './timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Video"
      component={Video}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {/* Authored at delivery size, not downscaled from a 1920 frame: a platform
        renders this as small as 168px wide in a sidebar. */}
    <Composition
      id="Thumbnail"
      component={Thumbnail}
      durationInFrames={1}
      fps={FPS}
      width={1280}
      height={720}
    />
    <Composition
      id="Logo480"
      component={Logo480}
      durationInFrames={1}
      fps={FPS}
      width={480}
      height={480}
    />
  </>
);
