/** Customizer tab "Profile": who am I? */
import { DownloadSimple, ShieldCheck, UserCircle } from '@phosphor-icons/react';
import { auth, profiles } from '../../index.js';
import { download } from '../themeFile.js';
import { MusicSection, TopFriends } from './editors.jsx';
import { FilePick, Group, Section, Segmented, Select, Switch, TextField } from './primitives.jsx';

/** Who am I — identity, privacy, top friends, music. */
export default function ProfileTab({ ctx }) {
  const { draft, setField, locs, run, busy, reload, notify } = ctx;
  return (
    <>
      <Section title="Basics" icon={UserCircle}>
        <Group label="Avatar">
          <FilePick disabled={busy} block onFiles={(fs) => run(async () => { await profiles.setAvatar(fs[0]); await reload(); notify('Avatar updated'); })}>Change avatar</FilePick>
          <p className="cz-hint">Updates right away.</p>
        </Group>
        <TextField label="Display name" max={50} value={draft.fields.display_name} onChange={(v) => setField('display_name', v)} />
        <TextField label="Mood or headline" max={80} value={draft.fields.headline || ''} onChange={(v) => setField('headline', v)} />
        <Select label="Locality" value={draft.fields.locality_id ?? ''} onChange={(e) => setField('locality_id', e.target.value ? +e.target.value : null)}>
          <option value="">Not set</option>
          {locs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>
      </Section>

      <Section title="Privacy" icon={ShieldCheck}>
        <Segmented label="Who can write on my wall" value={draft.fields.wall_policy} options={['everyone', 'friends', 'nobody']} onChange={(v) => setField('wall_policy', v)} />
        <Switch checked={!!draft.fields.show_on_map} onChange={(v) => setField('show_on_map', v)}>Show me on my friends’ map</Switch>
        <Group label="Your data">
          <button type="button" className="cz-btn cz-btn--block" disabled={busy}
            onClick={() => run(async () => { download('fiiyou-data.json', await auth.exportMyData()); notify('Data exported'); })}>
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />Export my data
          </button>
          <p className="cz-hint">A copy of everything you have on fiiyou, as one file.</p>
        </Group>
      </Section>

      <TopFriends ctx={ctx} />
      <MusicSection ctx={ctx} />
    </>
  );
}
