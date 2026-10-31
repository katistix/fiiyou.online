/** Customizer tab "Theme": how does it look? (presets, colours, background, font, shapes, custom styles, theme file) */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, DownloadSimple, Image as ImageIcon, ImageSquare, Palette, Plus, Shapes, SlidersHorizontal, Sparkle,
  Stack, TextAa, UploadSimple,
} from '@phosphor-icons/react';
import { cards as cardsApi, media, profiles } from '../../index.js';
import ImportModal from '../ImportModal.jsx';
import { COLOR_KEYS, THEME_DEFAULTS } from '../theme.js';
import { buildThemeExport, download } from '../themeFile.js';
import { PRESETS } from '../themes.js';
import { colorLabel, groupKeys, MAX_RULES } from './constants.js';
import { FileChip, RuleEditor, ThemeSelect } from './editors.jsx';
import { ColorField, FilePick, Group, Section } from './primitives.jsx';

function ThemeGroup({ name, icon, ctx, intro }) {
  return (
    <Section title={name} icon={icon} defaultOpen={false}>
      {intro}
      <div className="cz-grid2">{groupKeys(name).map((k) => <ThemeSelect key={k} k={k} th={ctx.th} setTheme={ctx.setTheme} />)}</div>
    </Section>
  );
}

function Presets({ ctx }) {
  const { th, setDraft } = ctx;
  return (
    <div className="cz-presets">
      {PRESETS.map((p) => {
        const active = Object.entries(p.theme).every(([k, v]) => th[k] === v);
        return (
          <button key={p.id} type="button" className="cz-preset" aria-pressed={active} title={p.name}
            onClick={() => setDraft((d) => ({ ...d, theme: { ...p.theme, ...(d.theme.bg_image ? { bg_image: d.theme.bg_image } : {}), ...(d.theme.font_file ? { font_file: d.theme.font_file } : {}) } }))}>
            <span className="cz-preset-tile" style={{ background: p.theme.bg_color }}>
              <span className="cz-pv-card" style={{ background: p.theme.card_color }}>
                <span className="cz-pv-line" style={{ background: p.theme.text_color }} />
                <span className="cz-pv-line" style={{ background: p.theme.text_color }} />
                <span className="cz-pv-pill" style={{ background: p.theme.accent_color }} />
              </span>
              {active && <span className="cz-preset-check"><Check size={11} weight="bold" aria-hidden="true" /></span>}
            </span>
            <span className="cz-preset-name">{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function BackgroundSection({ ctx }) {
  const { draft, setDraft, setTheme, th, run, busy } = ctx;
  const bg = draft.theme.bg_image;
  const dropOld = (old) => { if (old && old !== draft.origBg) media.deleteImage(old).catch(() => {}); };
  return (
    <Section title="Background" icon={ImageIcon} defaultOpen={false}>
      <div className="cz-grid2">{groupKeys('Background').map((k) => <ThemeSelect key={k} k={k} th={th} setTheme={setTheme} />)}</div>
      <Group label="Background image">
        {bg && (
          <FileChip icon={ImageSquare} removeLabel="Remove background image"
            onRemove={() => { dropOld(bg); setDraft((d) => { const t = { ...d.theme }; delete t.bg_image; return { ...d, theme: t }; }); }}>
            Background image added
          </FileChip>
        )}
        <FilePick disabled={busy} block onFiles={(fs) => run(async () => {
          const old = draft.theme.bg_image;
          const p = await media.uploadImage(fs[0], 'bg');
          dropOld(old);
          setTheme('bg_image', p);
        })}>{bg ? 'Replace image' : 'Upload image'}</FilePick>
        <p className="cz-hint">Large images are compressed automatically.</p>
      </Group>
    </Section>
  );
}

function FontSection({ ctx }) {
  const { draft, setDraft, run, busy } = ctx;
  const path = draft.theme.font_file;
  // a font uploaded during this edit session (not the saved one) is deleted as soon as it is replaced or removed
  const dropOld = (old) => { if (old && old !== draft.origFont) media.deleteFont(old).catch(() => {}); };
  const remove = () => {
    dropOld(path);
    setDraft((d) => {
      const t = { ...d.theme }; delete t.font_file;
      if (t.font === 'custom') t.font = THEME_DEFAULTS.font;
      if (t.name_font === 'custom') t.name_font = THEME_DEFAULTS.name_font;
      return { ...d, theme: t };
    });
  };
  return (
    <Section title="Custom font" icon={TextAa} defaultOpen={!!path}>
      {path && <FileChip icon={TextAa} removeLabel="Remove custom font" onRemove={remove}>Custom font added</FileChip>}
      <FilePick accept=".woff2,.woff,.otf,.ttf,font/woff2,font/woff,font/otf,font/ttf" icon={TextAa} disabled={busy} block
        onFiles={(fs) => run(async () => {
          const old = draft.theme.font_file;
          const p = await media.uploadFont(fs[0]);
          dropOld(old);
          setDraft((d) => ({ ...d, theme: { ...d.theme, font_file: p, font: 'custom' } }));
        })}>{path ? 'Replace font' : 'Upload font'}</FilePick>
      <p className="cz-hint">.woff2, .woff, .otf or .ttf, up to 300 KB. Applies to your body text right away. To use it for your name too, set <code>Name font</code> to custom under Type. Only upload fonts you have the right to use.</p>
    </Section>
  );
}

function ShapePreview({ r: [r1, r2, r3] }) {
  return (
    <div className="cz-radii">
      <div className="cz-radii-frame" style={{ borderRadius: r1 }} aria-hidden="true">
        <div className="cz-radii-card" style={{ borderRadius: r2 }}><div className="cz-radii-chip" style={{ borderRadius: r3 }} /></div>
      </div>
      <dl>
        <dt>Frame</dt><dd>{r1}px</dd>
        <dt>Cards</dt><dd>{r2}px</dd>
        <dt>Inner</dt><dd>{r3}px</dd>
      </dl>
    </div>
  );
}

/** Save the theme to a file or load one. Export uses the last saved version; import replaces the theme and closes the editor. */
function ThemeFileSection({ ctx }) {
  const { run, reload, notify, onClose, busy } = ctx;
  const [importing, setImporting] = useState(false);
  const exportTheme = () => run(async () => { download('fiiyou-theme.json', buildThemeExport(await profiles.getMyProfile(), await cardsApi.listMine())); notify('Theme exported'); });
  return (
    <Section title="Export & import" icon={DownloadSimple} defaultOpen={false}
      hint="Save your theme to a file, or load one. Export uses your last saved version. Importing replaces your current theme and closes this editor, so save or discard your changes first.">
      <div className="cz-grid2">
        <button type="button" className="cz-btn" disabled={busy} onClick={exportTheme}><DownloadSimple size={16} weight="bold" aria-hidden="true" />Export</button>
        <button type="button" className="cz-btn" disabled={busy} onClick={() => setImporting(true)}><UploadSimple size={16} weight="bold" aria-hidden="true" />Import</button>
      </div>
      {importing && createPortal(
        <ImportModal onClose={() => setImporting(false)} notify={notify} onDone={async () => { setImporting(false); await reload(); onClose(); }} />, document.body)}
    </Section>
  );
}

/** How does it look — easiest controls first, most advanced last. */
export default function ThemeTab({ ctx }) {
  const { draft, setDraft, th, setTheme, r, setRule } = ctx;
  return (
    <>
      <Section title="Themes" icon={Sparkle} hint="One tap sets colors, shape and fonts. You can still change anything after.">
        <Presets ctx={ctx} />
      </Section>

      <Section title="Colors" icon={Palette}>
        <div className="cz-colors">
          {COLOR_KEYS.map((k) => <ColorField key={k} label={colorLabel(k)} value={th[k]} onChange={(v) => setTheme(k, v)} />)}
        </div>
      </Section>

      <BackgroundSection ctx={ctx} />
      <ThemeGroup name="Shape" icon={Shapes} ctx={ctx} intro={<ShapePreview r={r} />} />
      <ThemeGroup name="Surface" icon={Stack} ctx={ctx} />
      <ThemeGroup name="Type" icon={TextAa} ctx={ctx} />
      <FontSection ctx={ctx} />

      <Section title="Fine-tune" icon={SlidersHorizontal} defaultOpen={false} meta={draft.css.length ? `${draft.css.length}` : undefined}
        hint="Style any part of your page. Only safe values are offered: no scripts, no outside images, nothing that can break the page.">
        {draft.css.length > 0 && (
          <ul className="cz-list">{draft.css.map((rule, i) => <RuleEditor key={i} r={rule} i={i} ctx={{ ...ctx, setRule }} />)}</ul>
        )}
        <button type="button" className="cz-btn cz-btn--dashed cz-btn--block" disabled={draft.css.length >= MAX_RULES}
          onClick={() => setDraft((d) => ({ ...d, css: [...d.css, { s: 'card', p: {} }] }))}>
          <Plus size={16} weight="bold" aria-hidden="true" />Add a style rule
        </button>
      </Section>

      <ThemeFileSection ctx={ctx} />
    </>
  );
}
