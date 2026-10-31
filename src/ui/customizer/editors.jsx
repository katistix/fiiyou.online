/** Customizer editors: tag/link inputs, card items, CSS rule editor, photo grid, top friends, music. Built from primitives.jsx. */
import { useRef, useState } from 'react';
import {
  ArrowDown, ArrowUp, CaretLeft, CaretRight, DotsSixVertical, Eye, EyeSlash, Heart, Image as ImageIcon,
  ImageSquare, MusicNote, MusicNotes, Plus, Trash, UsersThree, X,
} from '@phosphor-icons/react';
import { media, social } from '../../index.js';
import { PROPS, SELECTORS } from '../customCss.js';
import { OPTIONS } from '../theme.js';
import { MAX_INTERESTS, MAX_LINKS, MAX_PROPS, MAX_TOP, sentence, typeMeta } from './constants.js';
import {
  DangerButton, Field, FilePick, Group, IconButton, RangeInput, Section, Select, TextField,
} from './primitives.jsx';

/** Chips for a list of short strings. Enter or comma adds, Backspace on empty removes the last one. */
function TagInput({ tags, max, onChange, placeholder, label }) {
  const [text, setText] = useState('');
  const ref = useRef(null);
  const commit = (raw) => {
    const add = raw.split(',').map((x) => x.trim()).filter(Boolean).filter((t, i, a) => a.indexOf(t) === i && !tags.includes(t));
    if (add.length) onChange([...tags, ...add].slice(0, max));
    setText('');
  };
  return (
    <div className="cz-tags" onClick={() => ref.current?.focus()}>
      {tags.map((t) => (
        <span className="cz-chip" key={t}>{t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}><X size={11} weight="bold" aria-hidden="true" /></button>
        </span>
      ))}
      <input ref={ref} value={text} aria-label={label} disabled={tags.length >= max}
        placeholder={tags.length ? '' : placeholder}
        onChange={(e) => (e.target.value.includes(',') ? commit(e.target.value) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(text); }
          else if (e.key === 'Backspace' && !text && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={() => commit(text)} />
    </div>
  );
}

function LinksEditor({ links, onChange }) {
  const set = (i, patch) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div className="cz-list">
      {links.map((l, i) => (
        <div className="cz-link-row" key={i}>
          <input className="cz-input" placeholder="Label" aria-label={`Link ${i + 1} label`} value={l.label || ''} onChange={(e) => set(i, { label: e.target.value })} />
          <input className="cz-input" placeholder="https://…" inputMode="url" aria-label={`Link ${i + 1} address`} value={l.url || ''} onChange={(e) => set(i, { url: e.target.value })} />
          <IconButton icon={X} label="Remove link" onClick={() => onChange(links.filter((_, j) => j !== i))} />
        </div>
      ))}
      <button type="button" className="cz-btn cz-btn--sm cz-btn--dashed cz-btn--block" disabled={links.length >= MAX_LINKS} onClick={() => onChange([...links, { label: '', url: '' }])}>
        <Plus size={14} weight="bold" aria-hidden="true" />Add a link
      </button>
    </div>
  );
}

function CardBody({ c, setContent, goTab }) {
  switch (c.type) {
    case 'about':
    case 'text': {
      const body = c.content.body || '';
      return (
        <div className="cz-field">
          <textarea className="cz-textarea" rows={4} maxLength={3000} value={body} aria-label={`${c.title || 'Card'} text`}
            onChange={(e) => setContent({ ...c.content, body: e.target.value })} />
          <p className="cz-hint">Supports <code>**bold**</code>, <code>*italic*</code> and <code>[link text](https://…)</code>.</p>
        </div>
      );
    }
    case 'links':
      return <LinksEditor links={c.content.links || []} onChange={(links) => setContent({ links })} />;
    case 'interests':
      return (
        <div className="cz-field">
          <TagInput label="Add an interest" tags={c.content.interests || []} max={MAX_INTERESTS} placeholder="Type an interest and press Enter"
            onChange={(interests) => setContent({ interests })} />
          <p className="cz-hint">{(c.content.interests || []).length} of {MAX_INTERESTS}. Press Enter or comma to add.</p>
        </div>
      );
    case 'gallery':
      return <p className="cz-hint">Shows your photos. Add and arrange them in <button type="button" className="cz-link" onClick={() => goTab('Media')}>Media</button>.</p>;
    case 'guestbook':
      return <p className="cz-hint">Shows what visitors write. Choose who can write in <button type="button" className="cz-link" onClick={() => goTab('Profile')}>Profile</button>.</p>;
    case 'top_friends':
      return <p className="cz-hint">Shows your top friends. Choose them in <button type="button" className="cz-link" onClick={() => goTab('Profile')}>Profile</button>.</p>;
    default:
      return null;
  }
}

export function CardItem({ c, first, last, busy, onTitle, onMove, onToggle, onDelete, setContent, goTab }) {
  const { label, icon: Icon } = typeMeta(c.type);
  return (
    <li className="cz-item" data-hidden={!c.visible || undefined}>
      <div className="cz-item-top">
        <span className="cz-item-ico"><Icon size={20} weight="fill" aria-hidden="true" /></span>
        <input className="cz-input" value={c.title || ''} maxLength={60} placeholder="Card title" aria-label={`${label} card title`} onChange={(e) => onTitle(e.target.value)} />
      </div>
      <div className="cz-item-bar">
        <span className="cz-item-type">
          {label}
          {!c.visible && <span className="cz-badge"><EyeSlash size={12} weight="bold" aria-hidden="true" />Hidden</span>}
        </span>
        <span className="cz-actions">
          <IconButton icon={ArrowUp} label="Move up" disabled={first} onClick={() => onMove(-1)} />
          <IconButton icon={ArrowDown} label="Move down" disabled={last} onClick={() => onMove(1)} />
          <IconButton icon={c.visible ? Eye : EyeSlash} label={c.visible ? 'Hide card' : 'Show card'} onClick={onToggle} />
          <DangerButton label="Delete card" disabled={busy} onConfirm={onDelete} />
        </span>
      </div>
      <div className="cz-item-main"><CardBody c={c} setContent={setContent} goTab={goTab} /></div>
    </li>
  );
}

/** One control for one CSS property — picks the right input from the property's spec. */
function PropControl({ k, v, onChange }) {
  const sp = PROPS[k];
  if (sp.type === 'color') {
    return <span className="cz-swatch"><input type="color" aria-label={sp.label} value={v.slice(0, 7)} onChange={(e) => onChange(e.target.value)} /></span>;
  }
  if (sp.type === 'enum') {
    return <Select ariaLabel={sp.label} value={v} onChange={(e) => onChange(e.target.value)}>{sp.opts.map((o) => <option key={o}>{o}</option>)}</Select>;
  }
  const cfg = sp.type === 'px'
    ? { min: sp.min, max: sp.max, val: parseInt(v, 10), out: (n) => `${n}px`, show: (n) => `${n}px` }
    : sp.type === 'rotate'
      ? { min: -20, max: 20, val: parseInt(v.slice(7), 10), out: (n) => `rotate(${n}deg)`, show: (n) => `${n}°` }
      : { min: 0.1, max: 1, step: 0.1, val: Number(v), out: (n) => (n >= 1 ? '1' : n.toFixed(1)), show: (n) => `${Math.round(n * 100)}%` };
  const val = Number.isNaN(cfg.val) ? cfg.min : cfg.val;
  return (
    <span className="cz-prop-range">
      <RangeInput label={sp.label} min={cfg.min} max={cfg.max} step={cfg.step || 1} value={val} onChange={(n) => onChange(cfg.out(n))} />
      <span className="cz-val">{cfg.show(val)}</span>
    </span>
  );
}

export function RuleEditor({ r, i, ctx }) {
  const { setRule, setProp, dropProp, setDraft } = ctx;
  const entries = Object.entries(r.p);
  return (
    <li className="cz-item">
      <div className="cz-item-top">
        <Select ariaLabel="Element" value={r.s} onChange={(e) => setRule(i, { s: e.target.value })}>
          {Object.entries(SELECTORS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <IconButton icon={Trash} danger label="Delete rule" onClick={() => setDraft((d) => ({ ...d, css: d.css.filter((_, j) => j !== i) }))} />
      </div>
      {entries.map(([k, v]) => (
        <div className="cz-prop" key={k}>
          <span className="cz-prop-label">{PROPS[k].label}</span>
          <PropControl k={k} v={v} onChange={(nv) => setProp(i, k, nv)} />
          <IconButton icon={X} label={`Remove ${PROPS[k].label}`} onClick={() => dropProp(i, k)} />
        </div>
      ))}
      {entries.length < MAX_PROPS && (
        <Select lead={Plus} ariaLabel="Add a property" value="" onChange={(e) => e.target.value && setProp(i, e.target.value, PROPS[e.target.value].def)}>
          <option value="">Add a property…</option>
          {Object.keys(PROPS).filter((k) => !(k in r.p)).map((k) => <option key={k} value={k}>{PROPS[k].label}</option>)}
        </Select>
      )}
    </li>
  );
}

export function PhotoGrid({ ctx }) {
  const { photos, img, run, reload, movePhoto } = ctx;
  const [dragI, setDragI] = useState(null);
  const [overI, setOverI] = useState(null);
  const end = () => { setDragI(null); setOverI(null); };
  return (
    <ul className="cz-pgrid">
      {photos.map((p, i) => (
        <li key={p.id} className="cz-photo" data-drag={dragI === i || undefined} data-over={(overI === i && dragI !== i) || undefined}
          onDragEnter={() => dragI != null && setOverI(i)} onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (dragI != null && dragI !== i) movePhoto(dragI, i); end(); }}>
          <div className="cz-photo-tile" draggable onDragStart={() => setDragI(i)} onDragEnd={end}>
            {img[p.path] ? <img src={img[p.path]} alt="" draggable={false} /> : <ImageIcon size={28} weight="duotone" aria-hidden="true" />}
            <span className="cz-photo-grip" aria-hidden="true"><DotsSixVertical size={14} weight="bold" /></span>
            <span className="cz-photo-likes"><Heart size={11} weight="fill" aria-hidden="true" />{p.like_count ?? 0}<span className="cz-vh"> likes</span></span>
          </div>
          <input className="cz-input" defaultValue={p.caption || ''} placeholder="Add a caption" maxLength={300} aria-label={`Caption for photo ${i + 1}`}
            onBlur={(e) => e.target.value !== (p.caption || '') && run(async () => { await social.setCaption(p.id, e.target.value); await reload(); })} />
          <div className="cz-photo-bar">
            <span className="cz-actions">
              <IconButton icon={CaretLeft} label="Move earlier" disabled={i === 0} onClick={() => movePhoto(i, i - 1)} />
              <IconButton icon={CaretRight} label="Move later" disabled={i === photos.length - 1} onClick={() => movePhoto(i, i + 1)} />
            </span>
            <DangerButton label="Delete photo" onConfirm={() => run(async () => { await social.deletePhoto(p); await reload(); })} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TopFriends({ ctx }) {
  const { draft, setDraft, fl, moveTop } = ctx;
  const available = fl.filter((f) => !draft.top.includes(f.id));
  return (
    <Section title="Top friends" icon={UsersThree} meta={`${draft.top.length}/${MAX_TOP}`}>
      {!fl.length && <p className="cz-hint">Add some friends first, then pick your top {MAX_TOP} here.</p>}
      {draft.top.length > 0 && (
        <ul className="cz-list">
          {draft.top.map((id, i) => {
            const f = fl.find((x) => x.id === id);
            return f && (
              <li className="cz-friend" key={id}>
                <span className="cz-rank">{i + 1}</span>
                <span className="cz-ava" aria-hidden="true">{(f.display_name || '?').charAt(0).toUpperCase()}</span>
                <span className="cz-friend-name">{f.display_name}</span>
                <span className="cz-actions">
                  <IconButton icon={ArrowUp} label={`Move ${f.display_name} up`} disabled={i === 0} onClick={() => moveTop(i, -1)} />
                  <IconButton icon={ArrowDown} label={`Move ${f.display_name} down`} disabled={i === draft.top.length - 1} onClick={() => moveTop(i, 1)} />
                  <IconButton icon={X} label={`Remove ${f.display_name}`} onClick={() => setDraft((d) => ({ ...d, top: d.top.filter((x) => x !== id) }))} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {draft.top.length < MAX_TOP && available.length > 0 && (
        <Select lead={Plus} ariaLabel="Add a friend" value="" onChange={(e) => e.target.value && setDraft((d) => ({ ...d, top: [...d.top, e.target.value] }))}>
          <option value="">Add a friend…</option>
          {available.map((f) => <option key={f.id} value={f.id}>{f.display_name}</option>)}
        </Select>
      )}
      {draft.top.length >= MAX_TOP && <p className="cz-hint">Your top {MAX_TOP} is full. Remove someone to add another.</p>}
    </Section>
  );
}

export function FileChip({ icon: Icon, children, onRemove, removeLabel }) {
  return (
    <div className="cz-file-chip">
      <Icon size={18} weight="duotone" aria-hidden="true" />
      <span>{children}</span>
      <IconButton icon={X} label={removeLabel} onClick={onRemove} />
    </div>
  );
}

export function MusicSection({ ctx }) {
  const { draft, setMusic, run, busy } = ctx;
  const m = draft.fields.music || {};
  const orig = draft.origMusic || {};
  const del = { audio: media.deleteAudio, cover: media.deleteImage };

  // Files uploaded during this edit session (not the saved ones) are deleted as soon as they're replaced or removed.
  const dropFile = (kind) => { if (m[kind] && m[kind] !== orig[kind]) del[kind](m[kind]).catch(() => {}); };
  const upload = (kind, file) => run(async () => {
    const path = kind === 'audio' ? await media.uploadAudio(file) : await media.uploadImage(file, 'cover');
    dropFile(kind);
    setMusic(kind === 'audio' ? { audio: path, url: '' } : { cover: path });
  });
  const remove = (kind) => { dropFile(kind); setMusic({ [kind]: '' }); };

  return (
    <Section title="Music" icon={MusicNotes} defaultOpen={!!(m.audio || m.url)}>
      {m.audio ? (
        <FileChip icon={MusicNote} removeLabel="Remove audio" onRemove={() => remove('audio')}>Audio file added</FileChip>
      ) : (
        <>
          <FilePick accept="audio/*" icon={MusicNote} disabled={busy} block onFiles={(fs) => upload('audio', fs[0])}>Upload audio</FilePick>
          <p className="cz-hint">mp3, m4a or ogg, up to 8 MB. Plays on its own, with no video. Only upload music you have the right to share.</p>
          <Field label="Or paste a link">
            <input className="cz-input" placeholder="YouTube or direct .mp3 link" value={m.url || ''} onChange={(e) => setMusic({ url: e.target.value.trim() })} />
          </Field>
          <p className="cz-hint">YouTube links show their video.</p>
        </>
      )}
      <div className="cz-grid2">
        <TextField label="Title" max={80} value={m.title || ''} onChange={(v) => setMusic({ title: v })} />
        <TextField label="Artist" max={80} value={m.artist || ''} onChange={(v) => setMusic({ artist: v })} />
      </div>
      <Group label="Cover image">
        {m.cover ? (
          <FileChip icon={ImageSquare} removeLabel="Remove cover image" onRemove={() => remove('cover')}>Cover image added</FileChip>
        ) : (
          <FilePick disabled={busy} block onFiles={(fs) => upload('cover', fs[0])}>Choose cover image</FilePick>
        )}
      </Group>
    </Section>
  );
}

export function ThemeSelect({ k, th, setTheme }) {
  return (
    <Select label={sentence(k)} value={th[k]} onChange={(e) => setTheme(k, e.target.value)}>
      {OPTIONS[k].filter((o) => o !== 'custom' || th.font_file).map((o) => <option key={o}>{o}</option>)}
    </Select>
  );
}
