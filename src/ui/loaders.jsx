/* Loading kit. Every section of the app loads on its own and shows its own tile,
 * so one slow or failed request never makes the whole page look broken.
 * Colours come from the theme tokens (--g1..--g4, --accent-fg), so it follows each person's theme. */

/** 3x3 squares that ripple diagonally. Pure CSS animation. */
export const Squares = ({ size = 28 }) => (
  <span className="ld-sq" style={{ '--sz': `${size}px` }} aria-hidden="true">
    {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--d': `${((i % 3) + Math.floor(i / 3)) * 0.11}s` }} />)}
  </span>
);

/** A shimmering placeholder block. */
export const Bone = ({ w = '100%', h = 12, r = 8, className = '' }) => (
  <span className={`bone ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />
);

/** One independent loading section. Pass label={null} for repeated tiles so a screen reader announces only one. */
export function Tile({ as: As = 'div', label = 'Loading', spin = false, className = '', children }) {
  return (
    <As className={`ld ld-tile ${className}`} {...(label ? { role: 'status', 'aria-live': 'polite', 'aria-busy': 'true' } : { 'aria-hidden': 'true' })}>
      {label && <span className="ld-sr">{label}…</span>}
      <div className="ld-inner">
        {spin && <span className="ld-corner"><Squares size={22} /></span>}
        <div className="ld-body" aria-hidden="true">{children}</div>
      </div>
    </As>
  );
}

/** Small inline loader for places with no room for a tile (buttons, lightbox, one line). */
export const Loading = ({ label = 'Loading', size = 18, className = '' }) => (
  <span className={`ld ld-inline ${className}`} role="status" aria-live="polite"><Squares size={size} /><span>{label}…</span></span>
);

const Lines = ({ n = 3, last = '60%' }) => <>{Array.from({ length: n }, (_, i) => <Bone key={i} h={12} w={i === n - 1 ? last : '100%'} />)}</>;

/* ---------- sections ---------- */

/** Feed posts. */
export const PostSkeleton = ({ n = 2, label = 'Loading posts' }) => (
  <div className="ld-stack">
    {Array.from({ length: n }, (_, i) => (
      <Tile key={i} className="ld-post" label={i === 0 ? label : null} spin={i === 0}>
        <div className="ld-row"><Bone w={40} h={40} r="50%" /><div className="ld-col"><Bone w="36%" h={13} /><Bone w="20%" h={10} /></div></div>
        <Lines n={i % 2 ? 2 : 3} />
        {i % 2 === 0 && <Bone h={150} r={14} />}
      </Tile>
    ))}
  </div>
);

/** The home sidebar card. Keeps the real .snap layout so nothing jumps when it fills in. */
export const SnapshotSkeleton = ({ label = 'Loading your summary' }) => (
  <Tile as="aside" className="snap panel" label={label} spin>
    <div className="ld-row"><Bone w={64} h={64} r="50%" /><div className="ld-col"><Bone w="70%" h={15} /><Bone w="45%" h={10} /></div></div>
    <div className="ld-three"><Bone h={46} r={12} /><Bone h={46} r={12} /><Bone h={46} r={12} /></div>
    <Bone h={40} r={12} />
  </Tile>
);

/** Rows with an avatar: people, notifications, likes, blocked list, admin lists. */
export const RowsSkeleton = ({ n = 4, label = 'Loading', className = '' }) => (
  <Tile className={`ld-rows ${className}`} label={label} spin>
    {Array.from({ length: n }, (_, i) => (
      <div className="ld-row" key={i}><Bone w={40} h={40} r="50%" /><div className="ld-col"><Bone w={`${55 - (i % 3) * 8}%`} h={13} /><Bone w={`${32 + (i % 2) * 14}%`} h={10} /></div></div>
    ))}
  </Tile>
);

/** Chat messages. */
export const ChatSkeleton = () => (
  <div className="ld ld-chat" role="status" aria-live="polite" aria-busy="true">
    <span className="ld-sr">Loading messages…</span>
    {[['58%', 'l'], ['40%', 'r'], ['66%', 'l'], ['34%', 'r'], ['50%', 'l']].map(([w, side], i) => <Bone key={i} className={`ld-bub ${side}`} w={w} h={i % 2 ? 38 : 50} r={18} />)}
  </div>
);

/** A whole profile while it loads, as separate tiles. Neutral on purpose: the person's own theme is not known yet. */
export const ProfileSkeleton = () => (
  <div className="ld-profile" role="status" aria-live="polite" aria-busy="true">
    <span className="ld-sr">Loading profile…</span>
    <Tile label={null} className="ld-side" spin>
      <Bone w={150} h={150} r={22} className="ld-avatar" />
      <Bone w="60%" h={22} /><Bone w="36%" h={12} />
      <Bone h={42} r={12} /><Bone h={42} r={12} />
    </Tile>
    <div className="ld-cards">
      {[4, 3, 2].map((n, i) => (
        <Tile key={i} label={null} className="ld-card">
          <Bone w="30%" h={18} /><Lines n={n} />
          {i === 1 && <div className="ld-three"><Bone h={90} r={12} /><Bone h={90} r={12} /><Bone h={90} r={12} /></div>}
        </Tile>
      ))}
    </div>
  </div>
);

/** Page-level fallback (lazy routes): a header plus one tile of rows. */
export const PageSkeleton = ({ label = 'Loading page' }) => (
  <div className="plain wide view">
    <Tile label={label} className="ld-head" spin><Bone w="28%" h={24} /><Bone w="52%" h={12} /></Tile>
    <RowsSkeleton n={4} label={null} />
  </div>
);

/** First paint while the session is being checked: the real nav shell with the page body filling in as tiles. */
export const AppBoot = () => (
  <div className="app" role="status" aria-live="polite" aria-busy="true">
    <span className="ld-sr">Loading fiiyou…</span>
    <nav className="nav" aria-hidden="true">
      <span className="logo">fiiyou</span>
      <div className="navlinks">{Array.from({ length: 5 }, (_, i) => <Bone key={i} w={44} h={34} r={10} />)}</div>
      <div className="more"><Bone w={34} h={34} r="50%" /></div>
    </nav>
    <div className="plain wide view"><div className="homegrid">
      <SnapshotSkeleton label={null} />
      <div className="homemain">
        <Tile label={null} className="ld-composer"><Bone h={16} w="40%" /><Bone h={64} r={12} /></Tile>
        <PostSkeleton n={2} label={null} />
      </div>
    </div></div>
  </div>
);
