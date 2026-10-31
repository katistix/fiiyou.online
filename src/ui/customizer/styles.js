/** Customizer styles: one stylesheet, scoped under .cz / .cz-pill and injected through <style> by Customizer.jsx. */

// The panel is coloured from the app theme (see ui-theme.css / appTheme.js): no colours are defined here.
export const CSS = `
.cz,.cz-pill{
  --cz-font:var(--ui-font),ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --cz-bg:var(--g1);--cz-card:var(--g2);--cz-sunk:var(--g0);--cz-hover:var(--hover);
  --cz-ink:var(--ink);--cz-ink2:var(--ink2);--cz-ink3:var(--muted);
  --cz-line:var(--g3);--cz-line2:var(--g4);
  --cz-accent:var(--accent-fg);--cz-accent-ink:var(--on-accent-fg);--cz-accent-soft:color-mix(in srgb,var(--accent-fg) 16%,transparent);--cz-ring:color-mix(in srgb,var(--accent-fg) 38%,transparent);
  --cz-fill:var(--accent);--cz-fill-ink:var(--on-accent);
  --cz-danger:var(--red);--cz-danger-ink:var(--on-red);--cz-danger-soft:color-mix(in srgb,var(--red) 18%,transparent);
  --cz-shadow:0 4px 0 color-mix(in srgb,var(--shade) 55%,transparent),0 18px 44px -14px color-mix(in srgb,var(--shade) 80%,transparent);
  --cz-top:var(--header-h,60px);   /* height of your top bar; the panel sits right under it */
  color-scheme:var(--scheme,dark);
}

/* base */
.cz,.cz *,.cz *::before,.cz *::after,.cz-pill,.cz-pill *{box-sizing:border-box}
.cz,.cz-pill{font:500 14px/1.45 var(--cz-font);color:var(--cz-ink);-webkit-font-smoothing:antialiased}
/* :where() keeps these resets at zero specificity, so a button's own colour (e.g. text on the accent fill) always wins */
.cz :where(button,input,select,textarea),.cz-pill :where(button){font:inherit;color:inherit;margin:0}
.cz :where(button),.cz-pill :where(button){cursor:pointer}
.cz h2,.cz h3,.cz p,.cz ul,.cz dl,.cz dd{margin:0;padding:0}
.cz ul{list-style:none}
.cz :focus-visible,.cz-pill :focus-visible{outline:3px solid var(--cz-accent);outline-offset:2px}
.cz-vh{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;padding:0}

/* shell */
.cz{position:fixed;z-index:100;top:var(--cz-top);right:0;bottom:0;width:400px;max-width:100vw;
  display:flex;flex-direction:column;background:var(--cz-bg);border-left:1px solid var(--cz-line2);
  overflow:hidden;animation:cz-in .22s cubic-bezier(.2,.7,.2,1) both}
@keyframes cz-in{from{opacity:0;transform:translateX(14px)}}
.cz-head{display:flex;align-items:center;gap:8px;padding:12px 10px 8px 16px}
.cz-title{font-size:18px;font-weight:700;letter-spacing:-.01em}
.cz-dirty{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;background:var(--cz-accent-soft);font-size:12px;font-weight:600;color:var(--cz-ink)}
.cz-dirty::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--cz-accent)}
.cz-spacer{flex:1}

.cz-tabs{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:0 12px 4px;padding:4px;border-radius:12px;background:var(--cz-sunk);border:1px solid var(--cz-line)}
.cz-tab{display:flex;flex-direction:column;align-items:center;gap:4px;padding:7px 2px 6px;background:none;border:0;
  border-radius:9px;font-size:12px;font-weight:600;color:var(--cz-ink2);transition:color .15s,background .15s}
.cz-tab:hover{color:var(--cz-ink);background:var(--cz-card)}
.cz-tab[aria-selected=true]{background:var(--cz-fill);color:var(--cz-fill-ink)}
.cz-tab[aria-selected=true] svg{color:inherit}
.cz-tab-ind{display:none}

.cz-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:10px 12px 18px;scrollbar-width:thin}

.cz-err{display:flex;gap:8px;align-items:flex-start;margin:10px 12px 0;padding:11px 8px 11px 12px;border-radius:12px;border:1px solid var(--cz-danger);
  background:var(--cz-danger-soft);color:var(--cz-danger)}
.cz-err svg{flex:none;margin-top:1px}
.cz-err p{flex:1;font-weight:550}
.cz-busy{position:absolute;inset:0 0 auto 0;height:4px;overflow:hidden;z-index:2}
.cz-busy i{display:block;width:40%;height:100%;background:var(--cz-accent);animation:cz-slide 1s ease-in-out infinite}
@keyframes cz-slide{from{transform:translateX(-100%)}to{transform:translateX(250%)}}

.cz-foot{display:flex;align-items:center;gap:10px;padding:14px 12px 16px;border-top:1px solid var(--cz-line);background:var(--cz-bg)}
.cz-foot .cz-btn{min-height:40px;font-size:14px}
.cz-foot .cz-btn--primary{flex:1}
.cz-ask{flex:1;min-width:0;font-weight:600}

.cz-pill{position:fixed;z-index:1000;right:16px;bottom:16px;display:flex;gap:6px;padding:6px;background:var(--cz-bg);
  border:1px solid var(--cz-line2);border-radius:999px;box-shadow:var(--cz-shadow);animation:cz-in .2s ease-out both}
.cz-pill .cz-btn{border-radius:999px}

/* sections: each one is its own chunky card */
.cz-sec{margin-bottom:10px;border:1px solid var(--cz-line);border-radius:14px;background:var(--cz-card);transition:border-color .15s}
.cz-sec[data-open=true]{border-color:var(--cz-line2)}
.cz-sec-h{font-size:15px;font-weight:650}
.cz-sec-btn{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;background:none;border:0;text-align:left;border-radius:13px}
.cz-sec-btn:hover .cz-sec-title{color:var(--cz-accent)}
.cz-sec-ico{flex:none;width:28px;height:28px;padding:6px;border-radius:10px;background:var(--cz-accent-soft);color:var(--cz-accent)}
.cz-sec-title{flex:1;font-weight:650;font-size:15px}
.cz-sec-meta{padding:1px 9px;border-radius:999px;background:var(--cz-sunk);font-size:12px;font-weight:600;color:var(--cz-ink);font-variant-numeric:tabular-nums}
.cz-chev{flex:none;color:var(--cz-ink2);transition:transform .2s}
.cz-sec[data-open=true] .cz-chev{transform:rotate(180deg)}
.cz-sec-panel{display:grid;grid-template-rows:0fr;visibility:hidden;transition:grid-template-rows .24s ease,visibility 0s .24s}
.cz-sec[data-open=true] .cz-sec-panel{grid-template-rows:1fr;visibility:visible;transition:grid-template-rows .24s ease,visibility 0s}
.cz-sec-inner{min-height:0;overflow:hidden;margin:0 -4px;padding:0 18px}
.cz-stack{display:flex;flex-direction:column;gap:14px;padding:2px 0 14px}
.cz-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cz-row{display:flex;align-items:center;gap:8px}
.cz-hint{font-size:12.5px;line-height:1.5;font-weight:550;color:var(--cz-ink2)}
.cz-hint code{font:600 12px ui-monospace,SFMono-Regular,Menlo,monospace;padding:1px 5px;border-radius:5px;background:var(--cz-sunk);color:var(--cz-ink)}
.cz-link{padding:0;background:none;border:0;color:var(--cz-accent);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:2px}
.cz-sub{font-size:13px;font-weight:650;color:var(--cz-ink)}

/* fields */
.cz-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.cz-label{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:13px;font-weight:650}
.cz-count{font-weight:550;color:var(--cz-ink2);font-variant-numeric:tabular-nums}
.cz-count[data-warn]{color:var(--cz-danger)}
.cz-input,.cz-select,.cz-textarea{width:100%;min-height:38px;padding:9px 12px;border:1px solid var(--cz-line);border-radius:12px;
  background:var(--cz-sunk);font-weight:600;outline:0;transition:background .15s,border-color .15s,box-shadow .15s}
.cz-input::placeholder,.cz-textarea::placeholder{color:var(--cz-ink3);font-weight:550}
.cz-input:hover,.cz-select:hover,.cz-textarea:hover{border-color:var(--cz-line2)}
.cz .cz-input:focus,.cz .cz-select:focus,.cz .cz-textarea:focus{outline:0;border-color:var(--cz-accent);box-shadow:0 0 0 4px var(--cz-ring)}
.cz-textarea{min-height:104px;resize:vertical;line-height:1.5}
.cz-select-wrap{position:relative;display:block;min-width:0}
.cz-select{appearance:none;-webkit-appearance:none;padding-right:36px;text-overflow:ellipsis;cursor:pointer}
.cz-caret{position:absolute;right:12px;top:50%;margin-top:-7px;pointer-events:none;color:var(--cz-ink2)}
.cz-select-wrap[data-lead] .cz-select{padding-left:36px}
.cz-lead{position:absolute;left:13px;top:50%;margin-top:-7px;pointer-events:none;color:var(--cz-accent)}

/* buttons */
.cz-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:38px;padding:0 16px;border-radius:12px;
  border:1px solid var(--cz-line2);background:var(--cz-card);font-weight:650;white-space:nowrap;
  transition:background .15s,filter .15s,border-color .15s,color .15s,transform .08s,box-shadow .08s}
.cz-btn:hover{background:var(--cz-hover);border-color:var(--cz-ink3)}
.cz-btn:active:not(:disabled){transform:translateY(1px)}
.cz-btn--primary:active:not(:disabled),.cz-btn--danger:active:not(:disabled){transform:translateY(2px);box-shadow:0 1px 0 color-mix(in srgb,var(--shade) 60%,transparent)}

.cz-btn--primary{background:var(--cz-fill);border-color:var(--edge);color:var(--cz-fill-ink);font-weight:700;letter-spacing:.01em}
.cz-btn--primary:hover{background:var(--cz-fill);border-color:color-mix(in srgb,var(--shade) 40%,transparent);filter:brightness(1.08)}
.cz-btn--danger{background:var(--cz-danger);border-color:color-mix(in srgb,var(--shade) 40%,transparent);color:var(--cz-danger-ink)}
.cz-btn--danger:hover{background:var(--cz-danger);border-color:color-mix(in srgb,var(--shade) 40%,transparent);filter:brightness(1.08)}
.cz-btn--sm{min-height:38px;padding:0 12px;font-size:13px}
.cz-btn--block{width:100%}
.cz-btn--dashed{border-style:dashed;box-shadow:none;background:transparent;color:var(--cz-ink)}
.cz-btn--dashed:hover{border-color:var(--cz-accent);color:var(--cz-accent);background:var(--cz-accent-soft)}
.cz-btn:disabled{opacity:1;cursor:not-allowed;box-shadow:none;transform:none;filter:none;background:var(--cz-card);border-color:var(--cz-line);color:var(--cz-ink3)}
.cz-btn:disabled:hover{background:var(--cz-card);border-color:var(--cz-line);filter:none}
.cz-ibtn:disabled{opacity:.4;cursor:not-allowed}
.cz-file{position:relative;cursor:pointer}
.cz-file:has(input:focus-visible){outline:3px solid var(--cz-accent);outline-offset:2px}
.cz-file[aria-disabled=true]{opacity:.5;pointer-events:none}
.cz-ibtn{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:34px;height:34px;padding:0;
  border:0;border-radius:10px;background:transparent;color:var(--cz-ink2);font-size:12px;font-weight:650;transition:background .15s,color .15s}
.cz-ibtn:hover:not(:disabled){background:var(--cz-hover);color:var(--cz-ink)}
.cz-ibtn--danger:hover:not(:disabled){background:var(--cz-danger-soft);color:var(--cz-danger)}
.cz-ibtn[data-armed]{padding:0 12px;background:var(--cz-danger);color:var(--cz-danger-ink)}
.cz-ibtn[data-armed]:hover:not(:disabled){background:var(--cz-danger);color:var(--cz-danger-ink)}

/* segmented, switch */
.cz-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;padding:4px;background:var(--cz-sunk);border:1px solid var(--cz-line);border-radius:14px}
.cz-seg-opt{position:relative;display:block}
.cz-seg-opt span{display:block;padding:9px 8px;border-radius:10px;text-align:center;font-weight:650;color:var(--cz-ink2);cursor:pointer;transition:background .15s,color .15s}
.cz-seg-opt:hover span{color:var(--cz-ink);background:var(--cz-card)}
.cz-seg-opt input:checked + span{background:var(--cz-fill);color:var(--cz-fill-ink)}
.cz-seg-opt input:focus-visible + span{outline:3px solid var(--cz-accent);outline-offset:2px}
.cz-switch{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid var(--cz-line);background:var(--cz-sunk);cursor:pointer;font-weight:600}
.cz-track{flex:none;position:relative;width:50px;height:28px;border-radius:999px;background:var(--cz-line2);transition:background .18s}
.cz-track::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:var(--cz-ink);box-shadow:0 2px 0 color-mix(in srgb,var(--shade) 35%,transparent);transition:transform .18s}
.cz-switch input:checked ~ .cz-track::after{background:var(--cz-fill-ink)}
.cz-switch input:checked ~ .cz-track{background:var(--cz-fill)}
.cz-switch input:checked ~ .cz-track::after{transform:translateX(22px)}
.cz-switch input:focus-visible ~ .cz-track{outline:3px solid var(--cz-accent);outline-offset:2px}

/* range */
.cz-range{-webkit-appearance:none;appearance:none;width:100%;height:26px;margin:0;background:transparent;cursor:pointer;--pct:50%}
.cz-range::-webkit-slider-runnable-track{height:10px;border-radius:999px;background:linear-gradient(to right,var(--cz-accent) var(--pct),var(--cz-line2) var(--pct))}
.cz-range::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;margin-top:-7px;border-radius:50%;background:var(--cz-bg);border:4px solid var(--cz-accent);box-shadow:0 2px 0 color-mix(in srgb,var(--shade) 40%,transparent)}
.cz-range::-moz-range-track{height:10px;border-radius:999px;background:var(--cz-line2)}
.cz-range::-moz-range-progress{height:10px;border-radius:999px;background:var(--cz-accent)}
.cz-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--cz-bg);border:4px solid var(--cz-accent)}
.cz-val{min-width:48px;text-align:right;font-weight:600;color:var(--cz-ink);font-variant-numeric:tabular-nums}

/* colors */
.cz-swatch{position:relative;flex:none;display:block;width:36px;height:36px;border-radius:50%;overflow:hidden;border:3px solid var(--cz-ink);box-shadow:0 0 0 2px color-mix(in srgb,var(--shade) 50%,transparent)}
.cz-swatch:has(input:focus-visible){outline:3px solid var(--cz-accent);outline-offset:4px}
.cz-swatch input{position:absolute;inset:-8px;width:calc(100% + 16px);height:calc(100% + 16px);padding:0;border:0;background:none;cursor:pointer;-webkit-appearance:none;appearance:none}
.cz-swatch input::-webkit-color-swatch-wrapper{padding:0}
.cz-swatch input::-webkit-color-swatch{border:0}
.cz-swatch input::-moz-color-swatch{border:0}
.cz-colors{display:flex;flex-direction:column;gap:2px}
.cz-color{display:flex;align-items:center;gap:14px;padding:7px 8px;margin:0 -8px;border-radius:12px;cursor:pointer;transition:background .15s}
.cz-color:hover{background:var(--cz-hover)}
.cz-color-name{flex:1;font-weight:600}
.cz-color-hex{font:700 12.5px ui-monospace,SFMono-Regular,Menlo,monospace;padding:3px 8px;border-radius:7px;background:var(--cz-sunk);color:var(--cz-ink2)}

/* presets */
.cz-presets{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 10px}
.cz-preset{display:flex;flex-direction:column;gap:7px;min-width:0;padding:0;background:none;border:0;text-align:left;border-radius:14px}
.cz-preset-tile{position:relative;display:flex;flex-direction:column;justify-content:center;aspect-ratio:4/3;padding:10px;border-radius:14px;
  border:1px solid color-mix(in srgb,var(--cz-ink) 14%,transparent);transition:border-color .15s,transform .15s}
.cz-preset:hover .cz-preset-tile{transform:translateY(-2px);border-color:color-mix(in srgb,var(--cz-ink) 40%,transparent)}
.cz-preset[aria-pressed=true] .cz-preset-tile{border-color:var(--cz-ink);box-shadow:0 0 0 3px var(--cz-accent),0 3px 0 3px color-mix(in srgb,var(--shade) 55%,transparent)}
.cz-pv-card{display:flex;flex-direction:column;gap:5px;padding:8px;border-radius:8px}
.cz-pv-line{height:5px;border-radius:3px;opacity:.8}
.cz-pv-line:nth-child(2){width:64%}
.cz-pv-pill{width:40%;height:9px;margin-top:2px;border-radius:999px}
.cz-preset-check{position:absolute;top:-7px;right:-7px;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--cz-fill);color:var(--cz-fill-ink);border:1px solid var(--cz-bg)}
.cz-preset-name{font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* shape preview */
.cz-radii{display:flex;align-items:center;gap:18px;padding:14px;border-radius:14px;border:1px solid var(--cz-line);background:var(--cz-sunk)}
.cz-radii-frame{flex:none;display:grid;place-items:center;width:92px;height:72px;border:3px solid var(--cz-ink3);background:var(--cz-bg)}
.cz-radii-card{display:grid;place-items:center;width:64px;height:44px;border:3px solid var(--cz-accent);background:var(--cz-accent-soft)}
.cz-radii-chip{width:30px;height:16px;background:var(--cz-accent)}
.cz-radii dl{display:grid;grid-template-columns:auto auto;gap:3px 16px;font-variant-numeric:tabular-nums}
.cz-radii dt{color:var(--cz-ink2);font-weight:550}
.cz-radii dd{font-weight:650;text-align:right}

/* items (cards, rules, stickers) */
.cz-list{display:flex;flex-direction:column;gap:12px}
.cz-item{display:flex;flex-direction:column;gap:12px;padding:12px;border:1px solid var(--cz-line);border-radius:14px;background:var(--cz-bg)}
.cz-item-top{display:flex;align-items:center;gap:10px}
.cz-item-top .cz-input{flex:1;font-weight:600}
.cz-item-ico{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:var(--cz-fill);color:var(--cz-fill-ink)}
.cz-item-bar{display:flex;align-items:center;justify-content:space-between;gap:8px}
.cz-item-type{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--cz-ink2)}
.cz-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:999px;background:var(--cz-card);border:1px solid var(--cz-line);font-size:11.5px;font-weight:650;color:var(--cz-ink)}
.cz-item-main{display:flex;flex-direction:column;gap:10px;transition:opacity .15s}
.cz-item[data-hidden] .cz-item-main{opacity:.5}
.cz-actions{display:flex;align-items:center;gap:2px}
.cz-add-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cz-add-grid .cz-btn{justify-content:flex-start}
.cz-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 14px;border:1px dashed var(--cz-line2);border-radius:14px;color:var(--cz-ink2);text-align:center;font-weight:550}

/* css rules */
.cz-prop{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:8px}
.cz-prop-label{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cz-prop .cz-select-wrap{width:140px}
.cz-prop-range{display:flex;align-items:center;gap:4px;width:150px}
.cz-prop-range .cz-val{min-width:46px}

/* tags, links, chips */
.cz-tags{display:flex;flex-wrap:wrap;gap:7px;padding:8px;border:1px solid var(--cz-line);border-radius:12px;background:var(--cz-sunk);cursor:text;transition:border-color .15s,box-shadow .15s}
.cz-tags:focus-within{border-color:var(--cz-accent);box-shadow:0 0 0 4px var(--cz-ring)}
.cz-tags input{flex:1;min-width:90px;height:30px;padding:0 4px;background:none;border:0;outline:0;font-weight:600}
.cz .cz-tags input:focus-visible{outline:0}
.cz-chip{display:inline-flex;align-items:center;gap:2px;height:30px;padding:0 4px 0 12px;border:1px solid var(--cz-line2);border-radius:999px;background:var(--cz-card);font-size:13px;font-weight:600}
.cz-chip button{display:grid;place-items:center;width:22px;height:22px;padding:0;border:0;border-radius:50%;background:none;color:var(--cz-ink2)}
.cz-chip button:hover{background:var(--cz-danger-soft);color:var(--cz-danger)}
.cz-link-row{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr) auto;gap:6px;align-items:center}
.cz-file-chip{display:flex;align-items:center;gap:10px;padding:8px 6px 8px 12px;border-radius:12px;border:1px solid var(--cz-line);background:var(--cz-sunk);font-weight:600}
.cz-file-chip span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cz-file-chip svg:first-child{flex:none;color:var(--cz-accent)}

/* friends */
.cz-friend{display:flex;align-items:center;gap:10px;padding:7px 8px 7px 10px;border:1px solid var(--cz-line);border-radius:12px;background:var(--cz-bg)}
.cz-rank{width:18px;text-align:center;font-weight:700;color:var(--cz-accent);font-variant-numeric:tabular-nums}
.cz-ava{flex:none;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--cz-fill);color:var(--cz-fill-ink);font-size:14px;font-weight:700}
.cz-friend-name{flex:1;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* stickers & photos */
.cz-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:10px}
.cz-thumb{display:grid;place-items:center;aspect-ratio:1;padding:6px;border:1px solid var(--cz-line2);border-radius:12px;
  background-color:var(--cz-bg);background-image:conic-gradient(color-mix(in srgb,var(--cz-ink) 12%,transparent) 25%,transparent 0 50%,color-mix(in srgb,var(--cz-ink) 12%,transparent) 0 75%,transparent 0);background-size:12px 12px}
.cz-thumb img{max-width:100%;max-height:100%;object-fit:contain}
.cz-thumb[aria-pressed=true]{border-color:var(--cz-accent);box-shadow:0 0 0 3px var(--cz-ring)}
.cz-pgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cz-photo{display:flex;flex-direction:column;gap:8px;min-width:0;padding:8px;border:1px solid var(--cz-line);border-radius:14px;background:var(--cz-bg);transition:border-color .12s,opacity .12s}
.cz-photo[data-drag]{opacity:.45}
.cz-photo[data-over]{border-color:var(--cz-accent);box-shadow:0 0 0 3px var(--cz-ring)}
.cz-photo-tile{position:relative;display:grid;place-items:center;aspect-ratio:1;overflow:hidden;border-radius:9px;background:var(--cz-sunk);color:var(--cz-ink3);cursor:grab}
.cz-photo-tile:active{cursor:grabbing}
.cz-photo-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;-webkit-user-drag:none}
.cz-photo-grip,.cz-photo-likes{position:absolute;display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:color-mix(in srgb,var(--cz-sunk) 78%,transparent);color:var(--cz-ink);font-size:12px;font-weight:650;backdrop-filter:blur(4px)}
.cz-photo-grip{top:6px;left:6px;padding:4px}
.cz-photo-likes{left:6px;bottom:6px}
.cz-photo .cz-input{min-height:34px;padding:4px 9px;font-size:12.5px}
.cz-photo-bar{display:flex;align-items:center;justify-content:space-between}

/* spinner */
.cz-spin{animation:cz-spin .8s linear infinite}
@keyframes cz-spin{to{transform:rotate(360deg)}}

/* touch + small screens */
@media (pointer:coarse){
  .cz-ibtn{min-width:40px;height:40px}
  .cz-btn,.cz-input,.cz-select{min-height:46px}
  .cz-btn--sm{min-height:40px}
}
@media (max-width:640px){
  .cz{top:auto;left:0;right:0;bottom:0;width:auto;max-width:none;height:min(70vh,660px);height:min(70dvh,660px);
    border-left:0;border-top:1px solid var(--cz-line2);border-radius:20px 20px 0 0}
  .cz-pill{right:12px;bottom:12px}
}
@media (prefers-reduced-motion:reduce){
  .cz,.cz *,.cz-pill,.cz-pill *{animation:none!important;transition:none!important}
}
`;
