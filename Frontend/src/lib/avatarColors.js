export const AVATAR_BG_CLASSES = [
  'bg-[rgb(141,233,113)]', // R141 G233 B113
  'bg-[rgb(173,150,220)]', // R173 G150 B220
  'bg-[rgb(246,242,244)]', // R246 G242 B244
];

export function avatarBg(seed = '') {
  const source = String(seed || '');
  if (!source) {
    return AVATAR_BG_CLASSES[Math.floor(Math.random() * AVATAR_BG_CLASSES.length)];
  }
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  const index = hash % AVATAR_BG_CLASSES.length;
  return AVATAR_BG_CLASSES[index];
}