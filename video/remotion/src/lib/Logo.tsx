import {Mark} from '../parts';
import {C} from '../theme';

export const PRODUCT = 'GhostLedger';

/** The film's mark, exposed under the name the template's own layers import. */
export const Logo: React.FC<{size?: number; color?: string; bg?: string}> = ({size = 40, color = C.bone}) => (
  <Mark size={size} color={color} />
);
