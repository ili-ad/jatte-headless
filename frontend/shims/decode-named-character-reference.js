//  frontend/shims/decode-named-character-reference.js
import { characterEntities } from 'character-entities';

/** RFC character-reference decoder compatible with micromark */
export function decodeNamedCharacterReference(name) {
  return characterEntities[name]
    ? [characterEntities[name], name.length] // [char, bytesConsumed]
    : [undefined, 0];
}

export { characterEntities };           // <-- what micromark expects
export default { characterEntities, decodeNamedCharacterReference };
