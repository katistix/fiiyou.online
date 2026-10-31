/** Customizer UI primitives: Section, Field, Select, Switch, Range, FilePick, buttons. No state of their own beyond what the control needs. */
import { useEffect, useId, useState } from 'react';
import { CaretDown, Check, Trash, UploadSimple } from '@phosphor-icons/react';
import { clamp, cx, sentence } from './constants.js';

/** Collapsible group. Re-mount it (change `key`) to re-open it. */
export function Section({ title, icon: Icon, hint, meta, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="cz-sec" data-open={open}>
      <h3 className="cz-sec-h">
        <button type="button" className="cz-sec-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          {Icon && <Icon className="cz-sec-ico" size={20} weight="fill" aria-hidden="true" />}
          <span className="cz-sec-title">{title}</span>
          {meta != null && <span className="cz-sec-meta">{meta}</span>}
          <CaretDown className="cz-chev" size={14} weight="bold" aria-hidden="true" />
        </button>
      </h3>
      <div id={id} className="cz-sec-panel" role="region" aria-label={title}>
        <div className="cz-sec-inner">
          <div className="cz-stack">
            {hint && <p className="cz-hint">{hint}</p>}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Field({ label, count, max, children }) {
  return (
    <label className="cz-field">
      <span className="cz-label">
        <span>{label}</span>
        {max != null && <span className="cz-count" data-warn={count >= max * 0.9 || undefined}>{count}/{max}</span>}
      </span>
      {children}
    </label>
  );
}

export function Group({ label, children }) {
  return (
    <div className="cz-field" role="group" aria-label={label}>
      <span className="cz-label">{label}</span>
      {children}
    </div>
  );
}

export function TextField({ label, value = '', onChange, max, placeholder }) {
  return (
    <Field label={label} count={value.length} max={max}>
      <input className="cz-input" value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Select({ label, ariaLabel, value, onChange, lead: Lead, disabled, children }) {
  const control = (
    <span className="cz-select-wrap" data-lead={Lead ? '' : undefined}>
      {Lead && <Lead className="cz-lead" size={14} weight="bold" aria-hidden="true" />}
      <select className="cz-select" value={value} onChange={onChange} disabled={disabled} aria-label={label ? undefined : ariaLabel}>{children}</select>
      <CaretDown className="cz-caret" size={14} weight="bold" aria-hidden="true" />
    </span>
  );
  return label ? <Field label={label}>{control}</Field> : control;
}

export function Segmented({ label, value, options, onChange }) {
  const name = useId();
  return (
    <div className="cz-field" role="radiogroup" aria-label={label}>
      <span className="cz-label">{label}</span>
      <div className="cz-seg">
        {options.map((o) => (
          <label key={o} className="cz-seg-opt">
            <input className="cz-vh" type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} />
            <span>{sentence(o)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, children }) {
  return (
    <label className="cz-switch">
      <span>{children}</span>
      <input className="cz-vh" type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="cz-track" aria-hidden="true" />
    </label>
  );
}

export function RangeInput({ value, min, max, step = 1, onChange, label }) {
  const pct = clamp(((value - min) / (max - min)) * 100, 0, 100);
  return (
    <input className="cz-range" type="range" min={min} max={max} step={step} value={value} aria-label={label}
      style={{ '--pct': `${pct}%` }} onChange={(e) => onChange(Number(e.target.value))} />
  );
}

export function Range({ label, display, ...rest }) {
  return (
    <label className="cz-field">
      <span className="cz-label"><span>{label}</span><span className="cz-val">{display}</span></span>
      <RangeInput label={label} {...rest} />
    </label>
  );
}

export function ColorField({ label, value, onChange }) {
  return (
    <label className="cz-color">
      <span className="cz-swatch"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} /></span>
      <span className="cz-color-name">{label}</span>
      <span className="cz-color-hex">{String(value).toUpperCase()}</span>
    </label>
  );
}

/** Styled file picker. Hands back a plain array of Files and resets itself so the same file can be chosen twice. */
export function FilePick({ children, icon: Icon = UploadSimple, accept = 'image/*', multiple, disabled, block, onFiles }) {
  return (
    <label className={cx('cz-btn cz-file', block && 'cz-btn--block')} aria-disabled={disabled || undefined}>
      <Icon size={16} weight="bold" aria-hidden="true" />
      {children}
      <input className="cz-vh" type="file" accept={accept} multiple={multiple} disabled={disabled}
        onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) onFiles(fs); }} />
    </label>
  );
}

export function IconButton({ icon: Icon, label, onClick, disabled, danger }) {
  return (
    <button type="button" className={cx('cz-ibtn', danger && 'cz-ibtn--danger')} title={label} aria-label={label} disabled={disabled} onClick={onClick}>
      <Icon size={16} weight="bold" aria-hidden="true" />
    </button>
  );
}

/** Two-step delete: first click arms it, second click confirms. Disarms on blur or after 4s. */
export function DangerButton({ label = 'Delete', onConfirm, disabled }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  const text = armed ? `Confirm: ${label.toLowerCase()}` : label;
  return (
    <button type="button" className="cz-ibtn cz-ibtn--danger" data-armed={armed || undefined} disabled={disabled}
      title={text} aria-label={text} onBlur={() => setArmed(false)}
      onClick={() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}>
      {armed ? <><Check size={14} weight="bold" aria-hidden="true" />Delete?</> : <Trash size={16} weight="bold" aria-hidden="true" />}
    </button>
  );
}

export function Empty({ icon: Icon, children }) {
  return (
    <div className="cz-empty">
      <Icon size={24} weight="duotone" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
