/**
 * Customizer — the edit panel for a profile page: state, draft updaters, save/cancel and the shell.
 * Everything else lives in ./customizer/ (loaded together with this file when the panel opens, except the three tabs marked lazy below):
 *   constants.js    tab list, card types, limits, tiny helpers
 *   styles.js       the panel stylesheet (scoped under .cz / .cz-pill)
 *   primitives.jsx  Section, Field, Select, Switch, Range, FilePick, buttons
 *   editors.jsx     TagInput, LinksEditor, CardItem, RuleEditor, PhotoGrid, TopFriends, MusicSection, ThemeSelect
 *   ProfileTab.jsx  ThemeTab.jsx  ContentTab.jsx  MediaTab.jsx   one file per tab; each takes the shared `ctx` built below
 *
 * Requires: @phosphor-icons/react
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { CaretDoubleRight, CircleNotch, FloppyDisk, PencilSimple, WarningCircle, X } from '@phosphor-icons/react';
import { cards as cardsApi, discover, friends, media, profiles, social } from '../index.js';
import { clamp, cleanLinks, isFlow, TABS, typeMeta } from './customizer/constants.js';
import { Empty, IconButton } from './customizer/primitives.jsx';
import ProfileTab from './customizer/ProfileTab.jsx';   // first tab: loads with the panel
import { CSS } from './customizer/styles.js';
import { radii, THEME_DEFAULTS } from './theme.js';

// The other tabs are separate chunks, fetched the first time you open them.
const ThemeTab = lazy(() => import('./customizer/ThemeTab.jsx'));
const ContentTab = lazy(() => import('./customizer/ContentTab.jsx'));
const MediaTab = lazy(() => import('./customizer/MediaTab.jsx'));
const PANELS = { Profile: ProfileTab, Theme: ThemeTab, Content: ContentTab, Media: MediaTab };

export default function Customizer({ draft, setDraft, onClose, reload, sel, setSel, notify, photos, img, collapsed, setCollapsed }) {
  // ── state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('Profile');
  const [job, setJob] = useState(null);          // null | 'work' | 'save'
  const [err, setErr] = useState('');
  const [fl, setFl] = useState([]);
  const [locs, setLocs] = useState([]);
  const [asking, setAsking] = useState(false);   // "Discard your changes?" prompt
  const bodyRef = useRef(null);
  const startRef = useRef(null);
  if (startRef.current === null) startRef.current = JSON.stringify(draft);

  const busy = job !== null;
  const saving = job === 'save';
  const dirty = useMemo(() => JSON.stringify(draft) !== startRef.current, [draft]);

  useEffect(() => { friends.listFriends().then(setFl).catch(() => {}); }, []);
  useEffect(() => { discover.listLocalities().then(setLocs).catch(() => {}); }, []);
  useEffect(() => { if (sel) setTab('Media'); }, [sel]);                      // selecting a sticker on the page jumps to its controls
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [tab]);        // every tab starts at the top

  // ── derived ────────────────────────────────────────────────────────────
  const th = { ...THEME_DEFAULTS, ...draft.theme };
  const r = radii(draft.theme);
  const stickers = draft.cards.filter((c) => c.type === 'sticker');
  const s = stickers.find((c) => c.id === sel);
  const topZ = Math.max(0, ...stickers.map((c) => c.z));

  // ── draft updaters ─────────────────────────────────────────────────────
  const setTheme = (k, v) => setDraft((d) => ({ ...d, theme: { ...d.theme, [k]: v } }));
  const setField = (k, v) => setDraft((d) => ({ ...d, fields: { ...d.fields, [k]: v } }));
  const setMusic = (p) => setDraft((d) => ({ ...d, fields: { ...d.fields, music: Object.fromEntries(Object.entries({ ...d.fields.music, ...p }).filter(([, v]) => v)) } }));
  const setCard = (id, p) => setDraft((d) => ({ ...d, cards: d.cards.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const drop = (id) => setDraft((d) => ({ ...d, cards: d.cards.filter((x) => x.id !== id) }));
  const move = (i, dir) => setDraft((d) => {
    const c = [...d.cards];
    const f = c.map((x, k) => (isFlow(x) ? k : -1)).filter((k) => k >= 0);
    const a = f.indexOf(i), b = a + dir;
    if (b < 0 || b >= f.length) return d;
    [c[f[a]], c[f[b]]] = [c[f[b]], c[f[a]]];
    return { ...d, cards: c };
  });
  const moveTop = (i, dir) => setDraft((d) => {
    const t = [...d.top]; const j = i + dir;
    if (j < 0 || j >= t.length) return d;
    [t[i], t[j]] = [t[j], t[i]];
    return { ...d, top: t };
  });
  const setRule = (i, patch) => setDraft((d) => ({ ...d, css: d.css.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const setProp = (i, k, v) => setDraft((d) => ({ ...d, css: d.css.map((x, j) => (j === i ? { ...x, p: { ...x.p, [k]: v } } : x)) }));
  const dropProp = (i, k) => setDraft((d) => ({ ...d, css: d.css.map((x, j) => { if (j !== i) return x; const p = { ...x.p }; delete p[k]; return { ...x, p }; }) }));

  // ── async actions ──────────────────────────────────────────────────────
  const run = async (fn, kind = 'work') => {
    setJob(kind); setErr('');
    try { await fn(); } catch (e) { setErr(e?.message || 'Something went wrong'); }
    setJob(null);
  };

  const cancel = () => {
    const b = draft.theme.bg_image;
    if (b && b !== draft.origBg) media.deleteImage(b).catch(() => {});
    const f = draft.theme.font_file;
    if (f && f !== draft.origFont) media.deleteFont(f).catch(() => {});
    const o = draft.origMusic || {}, n = draft.fields.music || {};
    if (n.cover && n.cover !== o.cover) media.deleteImage(n.cover).catch(() => {});
    if (n.audio && n.audio !== o.audio) media.deleteAudio(n.audio).catch(() => {});
    setAsking(false);
    onClose();
  };
  const requestCancel = () => (dirty ? setAsking(true) : cancel());

  const save = () => run(async () => {
    await profiles.updateMyProfile({ ...draft.fields, theme: draft.theme, custom_css: draft.css });
    await friends.setTopFriends(draft.top);
    if (draft.origBg && draft.origBg !== draft.theme.bg_image) media.deleteImage(draft.origBg).catch(() => {});
    if (draft.origFont && draft.origFont !== draft.theme.font_file) media.deleteFont(draft.origFont).catch(() => {});
    { // files replaced or removed while editing are deleted now
      const o = draft.origMusic || {}, n = draft.fields.music || {};
      if (o.cover && o.cover !== n.cover) media.deleteImage(o.cover).catch(() => {});
      if (o.audio && o.audio !== n.audio) media.deleteAudio(o.audio).catch(() => {});
    }
    const flow = draft.cards.filter((c) => c.type !== 'sticker');
    const res = await Promise.allSettled(draft.cards.map((c) => (c.type === 'sticker'
      ? cardsApi.updateCard(c.id, { x: c.x, y: c.y, w: c.w, h: c.h, z: c.z, rotation: c.rotation, visible: c.visible, content: c.content })
      : cardsApi.updateCard(c.id, {
        y: flow.indexOf(c) * 10,
        title: c.title,
        content: c.type === 'links' ? { links: cleanLinks(c.content.links) } : c.content,
        visible: c.visible,
      }))));
    const bad = res.filter((x) => x.status === 'rejected');
    if (bad.length) throw new Error(`${bad.length} card(s) failed to save: ${bad[0].reason?.message || 'unknown error'}`);
    await reload(); notify('Saved'); onClose();
  }, 'save');

  const addCard = (type) => run(async () => {
    const meta = typeMeta(type);
    const c = await cardsApi.createCard({ type, title: meta.label, content: meta.empty, y: draft.cards.length * 10 });
    setDraft((d) => ({ ...d, cards: [...d.cards, c] }));
  });
  const addSticker = (file) => run(async () => {
    const bmp = await createImageBitmap(file);
    const w = 150, h = clamp(Math.round((w * bmp.height) / bmp.width), 40, 2000);   // units: 150 = 15% of the cards column
    const first = draft.cards.find((x) => x.visible && isFlow(x));                  // new stickers start pinned to the first card
    const path = await media.uploadImage(file, 'sticker');
    const c = await cardsApi.createCard({ type: 'sticker', content: { images: [path], at: { card: first?.id || null, v: 't' } }, x: 40, y: 40, w, h, z: topZ + 1 });
    setDraft((d) => ({ ...d, cards: [...d.cards, c] }));
    setSel(c.id);
  });
  const movePhoto = (i, to) => {
    if (to < 0 || to >= photos.length) return;
    const ids = photos.map((p) => p.id); const [moved] = ids.splice(i, 1); ids.splice(to, 0, moved);
    run(async () => { await social.reorderPhotos(ids); await reload(); });
  };

  // Everything the tabs need, in one bundle.
  const ctx = {
    draft, setDraft, th, r, stickers, s, sel, setSel, topZ, photos, img, fl, locs, busy,
    setTheme, setField, setMusic, setCard, drop, move, moveTop, setRule, setProp, dropProp,
    run, reload, notify, addCard, addSticker, movePhoto, goTab: setTab, onClose,
  };

  // ── tabs: arrow keys move between them ─────────────────────────────────
  const onTabKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const n = { ArrowRight: (i + 1) % TABS.length, ArrowLeft: (i + TABS.length - 1) % TABS.length, Home: 0, End: TABS.length - 1 }[e.key];
    if (n == null) return;
    e.preventDefault();
    setTab(TABS[n].id);
    e.currentTarget.querySelectorAll('[role="tab"]')[n]?.focus();
  };

  // ── shell ──────────────────────────────────────────────────────────────
  const stop = (e) => e.stopPropagation();
  const Panel = PANELS[tab];

  if (collapsed) {
    return (
      <>
        <style>{CSS}</style>
        <aside className="cz-pill" aria-label="Customize" onPointerDown={stop}>
          <button type="button" className="cz-btn" onClick={() => setCollapsed(false)}><PencilSimple size={16} weight="bold" aria-hidden="true" />Edit</button>
          <button type="button" className="cz-btn cz-btn--primary" disabled={busy} onClick={save}>
            {saving ? <CircleNotch className="cz-spin" size={16} weight="bold" aria-hidden="true" /> : <FloppyDisk size={16} weight="bold" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </aside>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <aside className="cz" aria-label="Customize" onPointerDown={stop}>
        {busy && <div className="cz-busy" role="progressbar" aria-label={saving ? 'Saving' : 'Working'}><i /></div>}

        <header className="cz-head">
          <h2 className="cz-title">Customize</h2>
          {dirty && <span className="cz-dirty">Unsaved changes</span>}
          <span className="cz-spacer" />
          <IconButton icon={CaretDoubleRight} label="Hide panel" onClick={() => setCollapsed(true)} />
          <IconButton icon={X} label="Close" disabled={saving} onClick={requestCancel} />
        </header>

        <div className="cz-tabs" role="tablist" aria-label="Customizer sections" style={{ '--i': TABS.findIndex((t) => t.id === tab) }} onKeyDown={onTabKey}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" id={`cz-tab-${id}`} className="cz-tab" aria-selected={tab === id} aria-controls="cz-panel" tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>
              <Icon size={18} weight="fill" aria-hidden="true" />{label}
            </button>
          ))}
          <span className="cz-tab-ind" aria-hidden="true" />
        </div>

        {err && (
          <div className="cz-err" role="alert">
            <WarningCircle size={18} weight="fill" aria-hidden="true" />
            <p>{err}</p>
            <IconButton icon={X} label="Dismiss" onClick={() => setErr('')} />
          </div>
        )}

        <div className="cz-body" ref={bodyRef}>
          <div role="tabpanel" id="cz-panel" aria-labelledby={`cz-tab-${tab}`}><Suspense fallback={<Empty icon={CircleNotch}>Loading…</Empty>}><Panel ctx={ctx} /></Suspense></div>
        </div>

        <footer className="cz-foot">
          {asking ? (
            <>
              <span className="cz-ask">Discard your changes?</span>
              <button type="button" className="cz-btn" autoFocus onClick={() => setAsking(false)}>Keep editing</button>
              <button type="button" className="cz-btn cz-btn--danger" onClick={cancel}>Discard</button>
            </>
          ) : (
            <>
              <button type="button" className="cz-btn" disabled={saving} onClick={requestCancel}>Cancel</button>
              <button type="button" className="cz-btn cz-btn--primary" disabled={busy} onClick={save}>
                {saving ? <CircleNotch className="cz-spin" size={16} weight="bold" aria-hidden="true" /> : <FloppyDisk size={16} weight="bold" aria-hidden="true" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}
        </footer>
      </aside>
    </>
  );
}
