/** Customizer tab "Media": my photos and stickers. */
import { ArrowLineDown, ArrowLineUp, Images, Sticker } from '@phosphor-icons/react';
import { cards as cardsApi, social } from '../../index.js';
import { pinTo, stickerModel, withModel } from '../stickerAnchor.js';
import { isFlow } from './constants.js';
import { PhotoGrid } from './editors.jsx';
import { DangerButton, Empty, FilePick, Range, Section, Select } from './primitives.jsx';

function StickersSection({ ctx }) {
  const { stickers, s, sel, setSel, setCard, drop, topZ, img, run, busy, addSticker, th, draft } = ctx;
  const anchors = [['avatar', 'Avatar'], ['nameplate', 'Name box'], ['player', 'Music player'], ['actions', 'Buttons (Message / Report)'], ['frame', 'Page (outside the border)'], ...draft.cards.filter((x) => x.visible && isFlow(x)).map((x) => [x.id, x.title || x.type])];
  const m = s ? stickerModel(s, th) : null;
  return (
    // key re-opens this section whenever a sticker gets selected on the page
    <Section key={sel ? 'sel' : 'idle'} title="Stickers" icon={Sticker} meta={stickers.length || undefined}>
      <FilePick disabled={busy} block onFiles={(fs) => addSticker(fs[0])}>Add a sticker</FilePick>
      {stickers.length === 0 && <Empty icon={Sticker}>Stickers are small images you can place anywhere on your profile.</Empty>}
      {stickers.length > 0 && (
        <>
          <p className="cz-hint">Drag a sticker to move it, drag its corner dot to resize. It gets pinned to the card or avatar highlighted while you drag, so it keeps its spot on phones and laptops.</p>
          <div className="cz-thumbs">
            {stickers.map((c, n) => (
              <button key={c.id} type="button" className="cz-thumb" aria-pressed={c.id === sel} aria-label={`Select sticker ${n + 1}`} onClick={() => setSel(c.id)}>
                {img[c.content.images?.[0]] && <img src={img[c.content.images[0]]} alt="" />}
              </button>
            ))}
          </div>
        </>
      )}
      {s ? (
        <div className="cz-item">
          <Select label="Pinned to" value={m.card && anchors.some(([id]) => id === m.card) ? m.card : ''} onChange={(e) => { const at = e.target.value && pinTo(s, e.target.value, th); if (at) setCard(s.id, withModel(s, th, at)); }}>
            {!(m.card && anchors.some(([id]) => id === m.card)) && <option value="">Top of the cards</option>}
            {anchors.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </Select>
          <Range label="Rotate" display={`${s.rotation}°`} min={-180} max={180} value={s.rotation} onChange={(n) => setCard(s.id, { rotation: n })} />
          <Range label="Size" display={`${Math.round(m.w / 10)}%`} min={40} max={600} value={m.w} onChange={(n) => setCard(s.id, withModel(s, th, { w: n, h: Math.round((n * m.h) / m.w) }))} />
          <div className="cz-item-bar">
            <span className="cz-actions">
              <button type="button" className="cz-btn cz-btn--sm" onClick={() => setCard(s.id, { z: topZ + 1 })}><ArrowLineUp size={14} weight="bold" aria-hidden="true" />Front</button>
              <button type="button" className="cz-btn cz-btn--sm" onClick={() => setCard(s.id, { z: 0 })}><ArrowLineDown size={14} weight="bold" aria-hidden="true" />Back</button>
            </span>
            <DangerButton label="Delete sticker" disabled={busy} onConfirm={() => run(async () => { await cardsApi.deleteCard(s); drop(s.id); setSel(null); })} />
          </div>
        </div>
      ) : stickers.length > 0 && <p className="cz-hint">Select a sticker to edit it.</p>}
    </Section>
  );
}

/** Stickers (decoration on the page) and the photo gallery. */
export default function MediaTab({ ctx }) {
  const { photos, run, reload, notify, busy } = ctx;
  return (
    <>
      <StickersSection ctx={ctx} />
      <Section title="Photos" icon={Images} meta={photos.length || undefined} hint="Drag to reorder, or use the arrows. Captions appear in the pop-up. Changes here save immediately.">
        <FilePick multiple disabled={busy} block onFiles={(fs) => run(async () => { for (const f of fs) await social.addPhoto(f); await reload(); notify('Photos added'); })}>Add photos</FilePick>
        {photos.length === 0 ? <Empty icon={Images}>No photos yet. Large photos are compressed automatically.</Empty> : <PhotoGrid ctx={ctx} />}
      </Section>
    </>
  );
}
