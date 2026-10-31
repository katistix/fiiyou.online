/** Customizer constants and small pure helpers (no React, no styles). */
import {
  BookOpenText, Cards, Hash, IdentificationCard, Images, LinkSimple, Palette, TextAlignLeft, UserCircle,
  UsersThree,
} from '@phosphor-icons/react';
import { GROUPS } from '../theme.js';

// Four tabs, one question each.
export const TABS = [
  { id: 'Profile', label: 'Profile', icon: UserCircle },   // who am I?
  { id: 'Theme',   label: 'Theme',   icon: Palette },      // how does it look?
  { id: 'Content', label: 'Content', icon: Cards },        // what's on the page?
  { id: 'Media',   label: 'Media',   icon: Images },       // my photos & stickers
];

export const CARD_TYPES = {
  about:       { label: 'About me',    icon: IdentificationCard, empty: { body: '' } },
  text:        { label: 'Text',        icon: TextAlignLeft,      empty: { body: '' } },
  gallery:     { label: 'Gallery',     icon: Images,             empty: { images: [] } },
  links:       { label: 'Links',       icon: LinkSimple,         empty: { links: [] } },
  interests:   { label: 'Interests',   icon: Hash,               empty: { interests: [] } },
  guestbook:   { label: 'Guestbook',   icon: BookOpenText,       empty: {} },
  top_friends: { label: 'Top friends', icon: UsersThree,         empty: {} },
};

export const MAX_TOP = 8;

export const MAX_LINKS = 20;

export const MAX_INTERESTS = 30;

export const MAX_RULES = 40;

export const MAX_PROPS = 12;

export const sentence = (k) => { const s = String(k).replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); };

export const colorLabel = (k) => ({ bg: 'Background' }[k.replace(/_color$/, '')] || sentence(k.replace(/_color$/, '')));

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const cx = (...a) => a.filter(Boolean).join(' ');

export const groupKeys = (g) => GROUPS.find((x) => x[0] === g)?.[1] || [];

export const isFlow = (c) => c.type !== 'sticker' && c.type !== 'music';

export const typeMeta = (t) => CARD_TYPES[t] || { label: sentence(t), icon: Cards, empty: {} };

// Blank link rows are allowed while editing; they're cleaned up on save.
export const cleanLinks = (ls) => (ls || [])
  .map((l) => ({ label: (l.label || '').trim(), url: (l.url || '').trim() }))
  .filter((l) => l.label || l.url)
  .slice(0, MAX_LINKS)
  .map((l) => ({ label: l.label || l.url, url: l.url || l.label }));
