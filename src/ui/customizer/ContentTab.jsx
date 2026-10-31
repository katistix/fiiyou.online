/** Customizer tab "Content": what is on the page? */
import { Cards, Layout } from '@phosphor-icons/react';
import { cards as cardsApi } from '../../index.js';
import { CARD_TYPES, groupKeys, isFlow } from './constants.js';
import { CardItem, ThemeSelect } from './editors.jsx';
import { Empty, Section } from './primitives.jsx';

/** What's on the page — the cards, and how the page is laid out. */
export default function ContentTab({ ctx }) {
  const { draft, setCard, move, drop, addCard, run, busy, goTab } = ctx;
  const flow = draft.cards.map((c, i) => ({ c, i })).filter(({ c }) => isFlow(c));
  return (
    <>
      <Section title="Cards" icon={Cards} meta={flow.length} hint="Edit, reorder or hide the sections on your page.">
        {flow.length === 0 && <Empty icon={Cards}>No cards yet. Add one below.</Empty>}
        {flow.length > 0 && (
          <ul className="cz-list">
            {flow.map(({ c, i }, n) => (
              <CardItem key={c.id} c={c} busy={busy} first={n === 0} last={n === flow.length - 1} goTab={goTab}
                onTitle={(title) => setCard(c.id, { title })}
                onMove={(dir) => move(i, dir)}
                onToggle={() => setCard(c.id, { visible: !c.visible })}
                onDelete={() => run(async () => { await cardsApi.deleteCard(c); drop(c.id); })}
                setContent={(content) => setCard(c.id, { content })} />
            ))}
          </ul>
        )}
        <p className="cz-sub">Add a card</p>
        <div className="cz-add-grid">
          {Object.entries(CARD_TYPES).map(([t, { label, icon: Icon }]) => (
            <button key={t} type="button" className="cz-btn cz-btn--sm" disabled={busy} onClick={() => addCard(t)}>
              <Icon size={16} weight="duotone" aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Page layout" icon={Layout}>
        <div className="cz-grid2">{groupKeys('Layout').map((k) => <ThemeSelect key={k} k={k} th={ctx.th} setTheme={ctx.setTheme} />)}</div>
      </Section>
    </>
  );
}
