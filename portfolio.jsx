/* global React, ReactDOM, HeroHelix, SpineHelix, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, useT, useLang, setLang, SUPPORTED_LANGS */
const { useState, useEffect, useRef, useCallback } = React;

const CALENDLY_URL = "https://calendly.com/"; // user can swap
// Set this once the recognition film cut is ready in videos/.
const RECOGNITION_VIDEO_SRC = "videos/endgame.mp4";

// ─── Lightbox context ─────────────────────────────────────────────
// One shared opener lets every clickable image/video tile request a
// fullscreen view + ←/→ keyboard nav + click-to-close. items is a list
// of { type: 'image'|'video', src } and index is the starting position.
const LightboxContext = React.createContext(() => {});

// ─── Lightbox ─────────────────────────────────────────────────────
function Lightbox({ items, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex || 0);
  const total = items.length;

  // Keyboard nav + body scroll lock
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + total) % total);
      else if (e.key === "ArrowRight") setIdx((i) => (i + 1) % total);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [total, onClose]);

  const prev = (e) => { e && e.stopPropagation(); setIdx((i) => (i - 1 + total) % total); };
  const next = (e) => { e && e.stopPropagation(); setIdx((i) => (i + 1) % total); };
  const cur = items[idx];

  return (
    <div className="lb" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lb__close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M5 5 L19 19 M19 5 L5 19" />
        </svg>
      </button>
      {total > 1 && (
        <button className="lb__nav lb__nav--prev" onClick={prev} aria-label="Previous">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5 L8 12 L15 19" />
          </svg>
        </button>
      )}
      {total > 1 && (
        <button className="lb__nav lb__nav--next" onClick={next} aria-label="Next">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5 L16 12 L9 19" />
          </svg>
        </button>
      )}
      <div className="lb__stage" onClick={(e) => e.stopPropagation()}>
        {cur.type === "video" ? (
          <video
            key={cur.src}
            className="lb__media"
            src={cur.src}
            controls
            autoPlay
            loop
            playsInline
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            key={cur.src}
            className="lb__media"
            src={cur.src}
            alt=""
            onClick={onClose}
          />
        )}
      </div>
      {total > 1 && (
        <div className="lb__counter">
          {String(idx + 1).padStart(2, "0")} <span>/</span> {String(total).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}

// ─── Sentence-break helper ────────────────────────────────────────
// and renders each sentence on its own line via <br/>. Conversational
// rhythm — every sentence breathes.
function br(text) {
  if (!text) return null;
  const parts = String(text).split(/(?<=[.!?])\s+(?=\S)/);
  return parts.map((p, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {p}
    </React.Fragment>
  ));
}

// ─── Hook: scroll progress ─────────────────────────────────────────
function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return p;
}

// ─── Hook: reveal-on-scroll ────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── Flag icons ───────────────────────────────────────────────────
function Flag({ code }) {
  // Compact 60×40 (3:2) SVG flags. Drawn at the size of the wrapper.
  const sw = 60, sh = 40;
  if (code === "en") {
    // Union Jack — simplified but recognizable
    return (
      <svg viewBox={`0 0 ${sw} ${sh}`} className="flag__svg" aria-hidden="true">
        <rect width={sw} height={sh} fill="#012169" />
        {/* White diagonals */}
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
        {/* Red diagonals — split via clip so only half visible per cross */}
        <path d="M0,0 L60,40" stroke="#C8102E" strokeWidth="3" clipPath="inset(0 50% 0 0)" />
        <path d="M60,0 L0,40"  stroke="#C8102E" strokeWidth="3" clipPath="inset(0 0 0 50%)" />
        {/* White cross */}
        <rect x="0" y="15" width={sw} height="10" fill="#fff" />
        <rect x="25" y="0" width="10" height={sh} fill="#fff" />
        {/* Red cross */}
        <rect x="0" y="17" width={sw} height="6" fill="#C8102E" />
        <rect x="27" y="0" width="6" height={sh} fill="#C8102E" />
      </svg>
    );
  }
  if (code === "de") {
    return (
      <svg viewBox={`0 0 ${sw} ${sh}`} className="flag__svg" aria-hidden="true">
        <rect width={sw} height={sh / 3}             y="0"          fill="#000" />
        <rect width={sw} height={sh / 3}             y={sh / 3}     fill="#DD0000" />
        <rect width={sw} height={sh - (sh / 3) * 2}  y={(sh / 3) * 2} fill="#FFCE00" />
      </svg>
    );
  }
  if (code === "ru") {
    return (
      <svg viewBox={`0 0 ${sw} ${sh}`} className="flag__svg" aria-hidden="true">
        <rect width={sw} height={sh / 3}             y="0"          fill="#FFFFFF" />
        <rect width={sw} height={sh / 3}             y={sh / 3}     fill="#0039A6" />
        <rect width={sw} height={sh - (sh / 3) * 2}  y={(sh / 3) * 2} fill="#D52B1E" />
      </svg>
    );
  }
  return null;
}

// ─── Language picker ──────────────────────────────────────────────
function LanguagePicker() {
  const [lang, setLng] = useLang();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const langs = [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
    { code: "ru", label: "Русский" },
  ];
  const active = langs.find((l) => l.code === lang) || langs[0];

  // Close the mobile dropdown on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current || !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lang" ref={wrapRef} aria-label="Language">
      {/* Inline three-flag picker — desktop. */}
      <div className="lang__inline" role="radiogroup" aria-label="Language">
        {langs.map((l) => (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={lang === l.code}
            aria-label={l.label}
            title={l.label}
            className={`lang__flag ${lang === l.code ? "is-active" : ""}`}
            onClick={() => setLng(l.code)}
          >
            <Flag code={l.code} />
          </button>
        ))}
      </div>

      {/* Compact dropdown — mobile. */}
      <button
        type="button"
        className={`lang__trigger ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${active.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="lang__trigger-flag" aria-hidden="true"><Flag code={active.code} /></span>
        <span className="lang__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9 L12 15 L18 9" />
          </svg>
        </span>
      </button>
      {open && (
        <ul className="lang__menu" role="listbox" aria-label="Language">
          {langs.map((l) => (
            <li key={l.code} role="option" aria-selected={lang === l.code}>
              <button
                type="button"
                className={`lang__menu-item ${lang === l.code ? "is-active" : ""}`}
                onClick={() => { setLng(l.code); setOpen(false); }}
              >
                <span className="lang__menu-flag" aria-hidden="true"><Flag code={l.code} /></span>
                <span className="lang__menu-label">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Top nav ───────────────────────────────────────────────────────
// SectionDropdown — mobile-only compact dropdown that shows the current
// in-view section and lets the user jump to others. The active section
// is tracked via IntersectionObserver so the label updates as the user
// scrolls. On desktop the regular .nav__links shows instead.
function SectionDropdown() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("services");
  const wrapRef = useRef(null);

  // Re-evaluate the active section as the user scrolls. We use a
  // "horizon" of 35% from the top of the viewport: whichever section
  // crosses that horizon most recently is treated as current.
  useEffect(() => {
    const sections = ["services", "work", "approach", "testimonials"];
    const els = sections.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const compute = () => {
      const horizon = window.innerHeight * 0.35;
      let current = "services";
      for (const el of els) {
        if (el.getBoundingClientRect().top <= horizon) current = el.id;
      }
      setActive(current);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current || !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sectionItems = [
    { id: "services", label: t("nav.services") },
    { id: "work", label: t("nav.work") },
    { id: "approach", label: t("nav.approach") },
    { id: "testimonials", label: t("nav.voices") },
  ];
  const activeItem = sectionItems.find((s) => s.id === active) || sectionItems[0];

  return (
    <div className="section-dd" ref={wrapRef}>
      <button
        type="button"
        className={`section-dd__trigger ${open ? "is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Section: ${activeItem.label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="section-dd__label">{activeItem.label}</span>
        <span className="section-dd__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9 L12 15 L18 9" />
          </svg>
        </span>
      </button>
      {open && (
        <ul className="section-dd__menu" role="menu">
          {sectionItems.map((s) => (
            <li key={s.id} role="none">
              <a
                href={`#${s.id}`}
                role="menuitem"
                className={`section-dd__item ${s.id === active ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Nav({ onChat }) {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <a href="#top" className="nav__logo" data-comment-anchor="logo">
        <span className="nav__logo-mark">
          <img src="logos/druids-mark.webp" alt="" />
        </span>
        <span className="nav__logo-text">Druids</span>
      </a>
      <ul className="nav__links">
        <li><a href="#services">{t("nav.services")}</a></li>
        <li><a href="#work">{t("nav.work")}</a></li>
        <li><a href="#approach">{t("nav.approach")}</a></li>
        <li><a href="#testimonials">{t("nav.voices")}</a></li>
      </ul>
      <SectionDropdown />
      <div className="nav__right">
        <LanguagePicker />
        <button className="btn btn--ghost" onClick={onChat}>
          {t("nav.cta")} <span className="btn__arrow">→</span>
        </button>
      </div>
    </nav>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────
function Hero({ progress, onChat }) {
  const t = useT();
  const headline = t("hero.headline");
  const [textVisible, setTextVisible] = useState(true);
  const bgRef = useRef(null);

  // Defensive mute lock — if anything (browser autoplay heuristics, an
  // extension, a stray fullscreen handoff) flips the hero's muted flag,
  // snap it back. The hero is ambient atmosphere; it must never speak.
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    // defaultMuted is the property the browser checks before autoplay; React
    // doesn't accept it as a JSX prop, so we set it imperatively here.
    el.defaultMuted = true;
    const lock = () => {
      if (!el.muted) el.muted = true;
      if (el.volume !== 0) el.volume = 0;
    };
    lock();
    el.addEventListener("play", lock);
    el.addEventListener("volumechange", lock);
    return () => {
      el.removeEventListener("play", lock);
      el.removeEventListener("volumechange", lock);
    };
  }, []);

  return (
    <header className={`hero ${textVisible ? "" : "hero--text-hidden"}`} id="top" data-screen-label="01 Hero">
      <div className="hero__media">
        <video
          ref={bgRef}
          className="hero__bg-video"
          src="videos/hero-bg.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        <div className="hero__veil" />
        <div className="hero__vignette" />
      </div>

      <div className="hero__helix">
        <HeroHelix progress={progress} />
      </div>

      <div className="hero__inner">
        <div className="hero__title-row">
          <h1 className="hero__title" key={headline /* re-trigger word-fade on lang switch */}>
            {headline.split(" ").map((w, i) => (
              <span key={i} className="hero__word" style={{ animationDelay: `${0.4 + i * 0.08}s` }}>{w}</span>
            ))}
          </h1>
          <button
            type="button"
            className="hero__toggle"
            onClick={() => setTextVisible((v) => !v)}
            aria-label={textVisible ? "Hide overlay text" : "Show overlay text"}
            title={textVisible ? "Hide text" : "Show text"}
          >
            {textVisible ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12 C5 7, 9 5, 12 5 S19 7, 21 12 C19 17, 15 19, 12 19 S5 17, 3 12 Z" />
                <circle cx="12" cy="12" r="2.5" />
                <path d="M4 4 L20 20" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12 C5 7, 9 5, 12 5 S19 7, 21 12 C19 17, 15 19, 12 19 S5 17, 3 12 Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            )}
          </button>
        </div>

        <p className="hero__sub">{br(t("hero.sub"))}</p>

        <div className="hero__portrait hero__portrait--inline">
          <image-slot id="hero-portrait-mobile" shape="circle" placeholder="Portrait" src="images/portrait.webp"></image-slot>
          <div className="hero__portrait-ring" />
          <div className="hero__portrait-meta">
            <div className="hero__portrait-name">{t("hero.portraitName")}</div>
            <div className="hero__portrait-role">{t("hero.portraitRole")}</div>
          </div>
        </div>

        <div className="hero__row">
          <button className="btn btn--solid" onClick={onChat}>
            {t("hero.cta")} <span className="btn__arrow">→</span>
          </button>
          <a className="btn btn--link" href="#work">{t("hero.seeWork")}</a>
        </div>
      </div>

      <div className="hero__portrait hero__portrait--floating">
        <image-slot id="hero-portrait" shape="circle" placeholder="Portrait" src="images/portrait.webp"></image-slot>
        <div className="hero__portrait-ring" />
        <div className="hero__portrait-meta">
          <div className="hero__portrait-name">{t("hero.portraitName")}</div>
          <div className="hero__portrait-role">{t("hero.portraitRole")}</div>
        </div>
      </div>
    </header>
  );
}

// ─── Worked for ────────────────────────────────────────────────────
function WorkedFor() {
  const t = useT();
  const logos = [
    { name: "Accenture",        href: "https://www.accenture.com/",          src: "logos/accenture.webp",         h: 26 },
    { name: "Siemens",          href: "https://www.siemens.com/",            src: "logos/siemens.webp",           h: 26 },
    { name: "VW Kraftwerk",     href: "https://www.vw-kraftwerk.de/",        src: "logos/vw-kraftwerk.webp",      h: 28 },
    { name: "ETAS",             href: "https://www.etas.com/",               src: "logos/etas.webp",              h: 30 },
    { name: "BWS Consulting",   href: "https://bws-group.de/",               src: "logos/bws.webp",               h: 38 },
    { name: "Koramis · telent", href: "https://www.telent.de/de/",           src: "logos/koramis.webp",           h: 28 },
    { name: "Tokiphy",          href: "https://www.tokiphy.com/",            src: "logos/tokiphy.webp",           h: 26 },
    { name: "Responsive Fashion Institute", href: "https://www.responsivefashion.institute/", src: "logos/responsive-fashion.webp", h: 28 },
  ];
  const renderRow = (prefix) => logos.map((l) => (
    <li key={`${prefix}-${l.name}`} className="worked__logo">
      <a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.name} title={l.name}>
        <img src={`${l.src}?v=5`} alt={l.name} style={{ height: `${l.h}px` }} />
      </a>
    </li>
  ));
  return (
    <section className="worked" aria-label={t("worked.label")}>
      <div className="worked__head">
        <h2 className="worked__title">{t("worked.label")}</h2>
        <div className="worked__rule" />
      </div>
      <div className="worked__marquee">
        <ul className="worked__track">{renderRow("a")}</ul>
        <ul className="worked__track" aria-hidden="true">{renderRow("b")}</ul>
      </div>
    </section>
  );
}

// ─── Selected work ────────────────────────────────────────────────
// Each piece can be either:
//   videoSrc: "videos/foo.mp4" — autoplays muted in loop
//   poster:   "videos/foo-poster.jpg" — optional first-frame still
// or it falls back to the drop slot.
const WORK_MEDIA = [
  // aspect set per file's real dimensions so the tile sizes correctly
  // without having to load the video first (lazy-load below).
  { id: "work-1", videoSrc: "videos/work-1.mp4", poster: null, aspect: "1 / 1"  }, // Brand · 1440×1440
  { id: "work-2", videoSrc: "videos/work-2.mp4", poster: null, aspect: "16 / 9" }, // Personal brand · 1280×720
  { id: "work-3", videoSrc: "videos/andrej_best_of.mp4", poster: null, aspect: "16 / 9" }, // Private memory · 1920×1080
  { id: "work-4", videoSrc: "videos/work-4.mp4", poster: null, aspect: "16 / 9" }, // Reactions · 1920×1080
];

// VideoPlayer — lazy-load video with a play overlay and custom controls.
// By default the <video> element is NOT mounted until the user clicks
// the play button — no bytes hit the wire until they opt in. Once
// activated, the clip plays end-to-end with sound, two controls show
// (play/pause and maximize), and the seek bar is intentionally hidden
// so visitors can't scrub past the privacy-protected cuts.
//
// preview={true} opts into a different mode: the video mounts in the
// background and silently loops the first PREVIEW_SECS seconds, muted,
// behind the play overlay. Click play → switches to full activated
// playback (unmuted, no time cap). The element doesn't reload; we just
// swap mute/loop state on the same element.
const PREVIEW_SECS = 10;

function VideoPlayer({ src, poster, t, preview = false, playLabelKey = "work.playFull" }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  // Where the wrap normally lives so we can return it after pseudo-fs.
  const originRef = useRef(null);
  const [activated, setActivated] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Tracks whether we entered the JS-driven pseudo-fullscreen fallback
  // (used when the real Fullscreen API is blocked, e.g. in iframes
  // without allow="fullscreen"). Distinct from isFullscreen so we know
  // which exit path to take.
  const pseudoFsRef = useRef(false);
  const showVideo = activated || preview;

  // Mirror the browser's REAL fullscreen state into local React state so
  // the maximize icon flips correctly (enter ↔ exit) when the user uses
  // the native API. Pseudo-fullscreen state is set imperatively below.
  useEffect(() => {
    const sync = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || null;
      const onUs = fsEl === wrapRef.current;
      if (onUs) setIsFullscreen(true);
      else if (!pseudoFsRef.current) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  useEffect(() => {
    if (!showVideo) return;
    const el = videoRef.current;
    if (!el) return;

    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    // Cap playback to PREVIEW_SECS while still in preview mode (i.e.
    // before activation). Once activated we let the full clip run.
    const onTime = () => {
      if (preview && !activated && el.currentTime >= PREVIEW_SECS) {
        el.currentTime = 0;
      }
    };
    el.addEventListener("timeupdate", onTime);

    // Audio safety: pause when scrolled out of view (unless we're in
    // any flavor of fullscreen — the tile is necessarily off-viewport
    // in that mode and we want to keep playing).
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const anyFs = !!(document.fullscreenElement || document.webkitFullscreenElement) || pseudoFsRef.current;
        if (e.isIntersecting && preview && !activated && !anyFs) {
          el.play().catch(() => {});
        } else if (!e.isIntersecting && !anyFs) {
          el.pause();
        }
      });
    }, { threshold: 0.25 });
    io.observe(el);

    return () => {
      io.disconnect();
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
    };
  }, [showVideo, preview, activated]);

  // Escape key exits pseudo-fullscreen (the real Fullscreen API handles
  // Escape itself).
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && pseudoFsRef.current) {
        exitPseudoFs();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  // Enter pseudo-fullscreen: imperatively move the wrap to document.body
  // and apply inline position:fixed styles. The SAME <video> stays
  // playing (it's a child of the wrap we're moving). React doesn't
  // re-render the wrap during the move because its JSX doesn't change.
  const enterPseudoFs = () => {
    const wrap = wrapRef.current;
    if (!wrap || pseudoFsRef.current) return;
    originRef.current = wrap.parentElement;
    document.body.appendChild(wrap);
    wrap.classList.add("media-wrap--pseudo-fs");
    pseudoFsRef.current = true;
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  };

  const exitPseudoFs = () => {
    const wrap = wrapRef.current;
    if (!wrap || !pseudoFsRef.current) return;
    wrap.classList.remove("media-wrap--pseudo-fs");
    if (originRef.current) originRef.current.appendChild(wrap);
    pseudoFsRef.current = false;
    setIsFullscreen(false);
    document.body.style.overflow = "";
  };

  const activate = (e) => {
    if (e) e.stopPropagation();
    const el = videoRef.current;
    // Preview-mode element already exists; flip it to full-playback in
    // place so we don't reload bytes. Non-preview mode mounts the
    // element fresh via the activated guard in the JSX below.
    if (el && preview) {
      el.currentTime = 0;
      el.muted = false;
      el.play().catch(() => {});
    }
    setActivated(true);
  };

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  // Fullscreen toggle. We try the real Fullscreen API first (cleanest
  // UX, native exit affordances). If the request rejects — typical in
  // iframes without allow="fullscreen" — we fall back to a JS-driven
  // pseudo-fullscreen that moves the wrap to <body> and pins it.
  const maximize = (e) => {
    if (e) e.stopPropagation();
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (isFullscreen) {
      if (pseudoFsRef.current) {
        exitPseudoFs();
        return;
      }
      const exit = document.exitFullscreen
        || document.webkitExitFullscreen
        || document.msExitFullscreen;
      if (exit) {
        Promise.resolve(exit.call(document)).catch(() => {});
      }
    } else {
      const req = wrap.requestFullscreen
        || wrap.webkitRequestFullscreen
        || wrap.msRequestFullscreen;
      if (!req) {
        enterPseudoFs();
        return;
      }
      try {
        Promise.resolve(req.call(wrap)).catch(() => {
          // Real API rejected (commonly: iframe without allow="fullscreen")
          // — fall back to the JS-driven pseudo-fullscreen.
          enterPseudoFs();
        });
      } catch (_) {
        enterPseudoFs();
      }
    }
  };

  return (
    <div ref={wrapRef} className="media-wrap">
      {showVideo ? (
        <video
          ref={videoRef}
          className="media__video"
          src={src}
          poster={poster || undefined}
          autoPlay
          loop
          muted={preview && !activated}
          playsInline
          preload={preview ? "auto" : "metadata"}
        />
      ) : (
        poster ? <img className="media__poster" src={poster} alt="" /> : null
      )}
      {!activated && (
        <button
          type="button"
          className="media__play"
          onClick={activate}
          aria-label={(t && t(playLabelKey)) || "Play video"}
        >
          <span className="media__play-circle" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5 L19 12 L8 19 Z" />
            </svg>
          </span>
        </button>
      )}
      {activated && (
        <div className="media__controls" aria-label="Video controls">
          <button
            type="button"
            className="media__ctrl media__ctrl--play"
            onClick={togglePlay}
            aria-label={paused ? ((t && t("work.play")) || "Play") : ((t && t("work.pause")) || "Pause")}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M8 5 L19 12 L8 19 Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="media__ctrl media__ctrl--max"
            onClick={maximize}
            aria-label={isFullscreen ? ((t && t("work.exitFullscreen")) || "Exit fullscreen") : ((t && t("work.fullscreen")) || "Fullscreen")}
          >
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 4 V9 H4 M15 4 V9 H20 M9 20 V15 H4 M15 20 V15 H20" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9 V4 H9 M20 9 V4 H15 M4 15 V20 H9 M20 15 V20 H15" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function WorkMedia({ id, videoSrc, poster, n, t }) {
  if (!videoSrc) {
    return <image-slot id={id} shape="rounded" radius="4" fit="contain" placeholder={`Film 0${n}`}></image-slot>;
  }
  // preview enables the silent 10-second loop behind the play button.
  return <VideoPlayer src={videoSrc} poster={poster} t={t} preview />;
}

function Work() {
  const t = useT();
  // 1..6 — render all configured tiles, not just hard-coded count
  return (
    <section className="work" id="work" data-screen-label="02 Work">
      <div className="section-head section-head--row" data-reveal>
        <div>
          <span className="eyebrow"><span className="eyebrow__dot"/> {t("work.eyebrow")}</span>
          <h2 className="display">{t("work.title")}</h2>
        </div>
        <p className="work__note">{br(t("work.note"))}</p>
      </div>
      <p className="work__disclaimer" data-reveal>
        <span className="work__disclaimer-mark" aria-hidden="true" />
        <span>{br(t("work.disclaimer"))}</span>
      </p>
      <div className="work__grid" data-reveal>
        {WORK_MEDIA.map((m, i) => {
          const n = i + 1;
          return (
            <figure key={m.id} className={`work__item work__item--${n}`}>
              <div
                className="work__media"
                style={m.aspect ? { aspectRatio: m.aspect } : undefined}
              >
                <WorkMedia id={m.id} videoSrc={m.videoSrc} poster={m.poster} n={n} t={t} />
              </div>
              <figcaption className="work__cap">
                <span className="work__tag">{t(`work.${n}.tag`)}</span>
                <h3 className="work__title">{t(`work.${n}.title`)}</h3>
                <p className="work__body">{br(t(`work.${n}.body`))}</p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

// ─── Approach ─────────────────────────────────────────────────────
function Approach() {
  const t = useT();
  return (
    <section className="approach" id="approach" data-screen-label="03 Approach">
      <div className="section-head" data-reveal>
        <span className="eyebrow"><span className="eyebrow__dot"/> {t("approach.eyebrow")}</span>
        <h2 className="display">
          {t("approach.title.a")}<em>{t("approach.title.laugh")}</em>{t("approach.title.and")}<em>{t("approach.title.cry")}</em>{t("approach.title.dot")}
        </h2>
        <p className="lede">{br(t("approach.lede"))}</p>
      </div>
      <ol className="approach__grid">
        {[1, 2, 3, 4].map((n, i) => (
          <li key={n} className="approach__step" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="approach__num">{String(n).padStart(2, "0")}</div>
            <h3 className="approach__title">{t(`approach.${n}.title`)}</h3>
            <p className="approach__body">{br(t(`approach.${n}.body`))}</p>
          </li>
        ))}
      </ol>
      <p className="approach__coda" data-reveal>{br(t("approach.coda"))}</p>
    </section>
  );
}

// ─── Services ─────────────────────────────────────────────────────
function Services() {
  const t = useT();
  const cards = [1, 2, 3, 4, 5].map((n) => ({
    n,
    title: t(`services.${n}.title`),
    lede: t(`services.${n}.lede`),
    bullets: [1, 2, 3, 4].map((b) => t(`services.${n}.b${b}`)),
  }));
  const roman = ["I.", "II.", "III.", "IV.", "V."];
  const renderCard = (c, i) => (
    <article key={c.n} className="service" data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
      <header className="service__head">
        <span className="service__index">{roman[i]}</span>
        <h3 className="service__title">{c.title}</h3>
      </header>
      <p className="service__lede">{br(c.lede)}</p>
      <ul className="service__list">
        {c.bullets.filter((b) => b && b.trim()).map((b, j) => <li key={j}>{b}</li>)}
      </ul>
    </article>
  );
  // The label sits as the first grid item, spanning cols 2-3 of row 1.
  // Cards 1-3 occupy row 2 — all three top borders align because they live
  // in the same grid row.
  return (
    <section className="services" id="services" data-screen-label="04 Services">
      <div className="section-head" data-reveal>
        <span className="eyebrow"><span className="eyebrow__dot"/> {t("services.eyebrow")}</span>
        <h2 className="display">{t("services.title")}</h2>
      </div>

      <div className="services__grid">
        <div
          className="services__animations-label"
          aria-hidden="false"
        >
          <span className="services__animations-rule" aria-hidden="true" />
          <span className="services__animations-text">{t("services.animationsLabel")}</span>
          <span className="services__animations-rule" aria-hidden="true" />
        </div>
        {cards.map(renderCard)}
      </div>
    </section>
  );
}

// Shared panel body — renders the media, bars, headline, body. Used by
// both the inline accordion panel (mobile) and the aside panel (desktop).
function ToolPanelInner({ tool, visibleEx, exampleIdx, setExampleIdx, openLightbox, t }) {
  const isVideo = !!visibleEx.videoSrc;
  // Image examples still open in the lightbox gallery on click. Video
  // examples use the VideoPlayer (lazy-load + custom controls) so we drop
  // the outer click so the play button can take the tap.
  const openGallery = isVideo
    ? undefined
    : () => {
        const items = tool.examples
          .map((e) => {
            if (e.videoSrc) return { type: "video", src: e.videoSrc };
            if (e.src) return { type: "image", src: e.src };
            return null;
          })
          .filter(Boolean);
        if (items.length) openLightbox(items, Math.min(exampleIdx, items.length - 1));
      };
  const total = tool.examples.length;
  const goPrev = (ev) => {
    if (ev) ev.stopPropagation();
    setExampleIdx((idx) => (idx - 1 + total) % total);
  };
  const goNext = (ev) => {
    if (ev) ev.stopPropagation();
    setExampleIdx((idx) => (idx + 1) % total);
  };
  return (
    <>
      <div
        className="tools__panel-media"
        key={`${tool.key}-${visibleEx.id}`}
        onClick={openGallery}
        style={openGallery ? { cursor: "zoom-in" } : undefined}
      >
        {isVideo ? (
          <VideoPlayer src={visibleEx.videoSrc} t={t} preview />
        ) : (
          <image-slot
            id={`tool-${tool.key}-${visibleEx.id}`}
            shape="rounded"
            radius="4"
            fit="contain"
            placeholder={`${tool.name}`}
            {...(visibleEx.src ? { src: visibleEx.src } : {})}
          ></image-slot>
        )}
        <span className="tools__panel-tag">{t(`tools.${tool.key}.role`)}</span>
        {total > 1 && (
          <>
            <button
              type="button"
              className="tools__nav tools__nav--prev"
              onClick={goPrev}
              aria-label="Previous example"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5 L8 12 L15 19" />
              </svg>
            </button>
            <button
              type="button"
              className="tools__nav tools__nav--next"
              onClick={goNext}
              aria-label="Next example"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5 L16 12 L9 19" />
              </svg>
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="tools__thumbs" role="tablist" aria-label="Examples">
          {tool.examples.map((e, j) => {
            const on = j === exampleIdx;
            const isExVideo = !!e.videoSrc;
            return (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={on}
                className={`tools__thumb ${on ? "is-active" : ""}`}
                onClick={(ev) => { ev.stopPropagation(); setExampleIdx(j); }}
                aria-label={`Example ${j + 1} of ${total}`}
              >
                {isExVideo ? (
                  <span className="tools__thumb-video" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M8 5 L19 12 L8 19 Z" />
                    </svg>
                  </span>
                ) : e.src ? (
                  <img src={e.src} alt="" loading="lazy" />
                ) : (
                  <span className="tools__thumb-empty" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="tools__panel-copy">
        <h3 className="tools__panel-title">{t(`tools.${tool.key}.headline`)}</h3>
        <p className="tools__panel-body">{br(t(`tools.${tool.key}.body`))}</p>
      </div>
    </>
  );
}

// ─── Tools ─────────────────────────────────────────────────────────
function Tools() {
  const t = useT();
  const openLightbox = React.useContext(LightboxContext);
  const TOOL_DEFS = [
    { key: "nano-banana",  name: "Nano Banana & Flux",   examples: [
      { id: "nano-01", src: "images/nb-01.webp" },
      { id: "nano-02", src: "images/nb-02.webp" },
      { id: "nano-03", src: "images/nb-03.webp" },
      { id: "nano-04", src: "images/nb-04.webp" },
      { id: "nano-05", src: "images/nb-05.webp" },
      { id: "nano-06", src: "images/nb-06.webp" },
      { id: "nano-07", src: "images/nb-07.webp" },
      { id: "flux-01", src: "images/nb-08.webp" },
      { id: "flux-02", src: "images/nb-09.webp" },
      { id: "flux-03", src: "images/nb-10.webp" },
    ] },
    { key: "chatgpt-img",  name: "ChatGPT Image 2",      examples: [
      { id: "gpt-01", src: "images/gpt-01.webp" },
      { id: "gpt-02", src: "images/gpt-02.webp" },
      { id: "gpt-03", src: "images/gpt-03.webp" },
      { id: "gpt-04", src: "images/gpt-04.webp" },
      { id: "gpt-05", src: "images/gpt-05.webp" },
      { id: "gpt-06", src: "images/gpt-06.webp" },
      { id: "gpt-07", src: "images/gpt-07.webp" },
      { id: "gpt-08", src: "images/gpt-08.webp" },
      { id: "gpt-09", src: "images/gpt-09.webp" },
    ] },
    { key: "kling",        name: "Kling",                examples: [{ id: "kling-01", videoSrc: "videos/kling.mp4" }] },
    { key: "seedance",     name: "Seedance",             examples: [{ id: "seedance-01", videoSrc: "videos/seedance.mp4" }] },
    { key: "elevenlabs",   name: "ElevenLabs",           examples: [{ id: "11-01", videoSrc: "videos/elevenlabs.mp4" }] },
    { key: "comfyui",      name: "ComfyUI",              examples: [{ id: "comfy-01", src: "logos/comfyui-mark.webp" }] },
    { key: "n8n",          name: "Automations",          examples: [{ id: "n8n-01", src: "logos/n8n.webp" }] },
    { key: "agents",       name: "Custom AI Assistants", examples: [{ id: "agents-01", src: "logos/nous-research.webp" }] },
  ];
  const [active, setActive] = useState(0);
  const [exampleIdx, setExampleIdx] = useState(0);
  const cur = TOOL_DEFS[active];
  const ex = cur.examples[Math.min(exampleIdx, cur.examples.length - 1)];

  const selectTool = (i) => { setActive(i); setExampleIdx(0); };

  return (
    <section className="tools" id="tools" data-screen-label="05 Tools">
      <div className="tools__head" data-reveal>
        <span className="eyebrow"><span className="eyebrow__dot"/> {t("tools.eyebrow")}</span>
        <h2 className="display tools__display">{t("tools.title")}</h2>
        <p className="lede">{t("tools.lede")}</p>
      </div>

      <div className="tools__layout">
        <ol className="tools__accordion" role="tablist">
          {TOOL_DEFS.map((tool, i) => {
            const on = i === active;
            const visibleEx = on ? tool.examples[Math.min(exampleIdx, tool.examples.length - 1)] : null;
            return (
              <li key={tool.key} className={`tools__item ${on ? "is-open" : ""}`}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={`tools__row ${on ? "is-active" : ""}`}
                  onClick={() => selectTool(i)}
                >
                  <span className="tools__row-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="tools__row-name">{tool.name}</span>
                  <span className="tools__row-role">{t(`tools.${tool.key}.role`)}</span>
                  <span className="tools__row-toggle" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M6 9 L12 15 L18 9" />
                    </svg>
                  </span>
                </button>

                {on && visibleEx && (
                  <div className="tools__panel tools__panel--inline" role="tabpanel">
                    <ToolPanelInner tool={tool} visibleEx={visibleEx} exampleIdx={exampleIdx} setExampleIdx={setExampleIdx} openLightbox={openLightbox} t={t} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <aside className="tools__panel tools__panel--aside" role="tabpanel">
          <ToolPanelInner tool={cur} visibleEx={ex} exampleIdx={exampleIdx} setExampleIdx={setExampleIdx} openLightbox={openLightbox} t={t} />
        </aside>
      </div>
    </section>
  );
}

// ─── Builder ───────────────────────────────────────────────────────
function Builder() {
  const t = useT();
  const openLightbox = React.useContext(LightboxContext);
  const ENKI_IMG = "images/enki-marketplace.webp";
  return (
    <section className="builder" data-screen-label="06 Builder">
      <div className="builder__grid">
        <div className="builder__left" data-reveal>
          <div className="builder__copy">
            <span className="eyebrow"><span className="eyebrow__dot"/> {t("builder.eyebrow")}</span>
            <h2 className="display">
              {t("builder.title.a")}<em>{t("builder.title.em")}</em>
            </h2>
            <p className="lede">{br(t("builder.lede1"))}</p>
            <p className="lede">{br(t("builder.lede2"))}</p>
          </div>
          <div className="builder__rails">
            <div className="builder__rails-label">{t("builder.railsLabel")}</div>
            <div className="builder__rails-list">
              {[1, 2, 3, 4].map((n, i) => (
                <div className="rail" key={n} style={{ transitionDelay: `${i * 70}ms` }}>
                  <span className="rail__k">{t(`builder.rail${n}.k`)}</span>
                  <span className="rail__dots" />
                  <span className="rail__v">{t(`builder.rail${n}.v`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <figure className="builder__media" data-reveal>
          <img
            className="builder__media-img"
            src={ENKI_IMG}
            alt={t("builder.showcase.placeholder")}
          />
          <figcaption className="builder__media-cap">{t("builder.showcase.caption")}</figcaption>
        </figure>
      </div>
    </section>
  );
}

// ─── Testimonials + Award ─────────────────────────────────────────
function Testimonials() {
  const t = useT();
  const openLightbox = React.useContext(LightboxContext);
  const quotes = [
    { q: t("voices.q1"), a: "Accenture · Industry X" },
    { q: t("voices.q2"), a: "ETAS", r: "industry leader in automotive cyber security" },
    { q: t("voices.q3"), a: "Natasha L. Fawn", r: "LUKSO" },
    { q: t("voices.q4"), a: "Natalie Rodic Marsan", r: "CMO Alvara Protocol" },
  ];
  return (
    <section className="quotes" id="testimonials" data-screen-label="07 Voices">
      <div className="section-head" data-reveal>
        <span className="eyebrow"><span className="eyebrow__dot"/> {t("voices.eyebrow")}</span>
        <h2 className="display">{t("voices.title")}</h2>
      </div>

      <div className="quotes__grid">
        {quotes.map((q, i) => (
          <figure key={i} className="quote" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
            <span className="quote__mark" aria-hidden="true">&ldquo;</span>
            <blockquote className="quote__body">{br(q.q)}</blockquote>
            <figcaption className="quote__cite">
              <span className="quote__name">{q.a}</span>
              {q.r && <span className="quote__role">— {q.r}</span>}
            </figcaption>
          </figure>
        ))}
      </div>

      <article className="award" data-reveal style={{ transitionDelay: "320ms" }}>
        <div className="award__main">
          <div className="award__rank">
            <span className="award__rank-num">10%</span>
            <span className="award__rank-of">{t("award.of")}</span>
          </div>
          <div className="award__copy">
            <span className="award__eyebrow">
              <span className="eyebrow__dot" /> {t("award.eyebrow")}
            </span>
            <h3 className="award__title">{t("award.title")}</h3>
            <p className="award__body">{br(t("award.body"))}</p>
            <p className="award__handle">{t("award.handle")}</p>
            <a
              className="award__cta"
              href="https://x.com/PsyopAnime/status/2032348791093776736"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="award__x" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.53 3H20.5l-6.5 7.43L21.5 21h-6.06l-4.74-6.2L5.3 21H2.34l6.96-7.96L2.5 3h6.2l4.28 5.66L17.53 3Zm-1.06 16.2h1.66L7.6 4.7H5.83l10.64 14.5Z"/>
                </svg>
              </span>
              <span className="award__cta-text">{t("award.cta")}</span>
              <span className="award__cta-arrow">→</span>
            </a>
          </div>
        </div>
        <figure className="award__video">
          {RECOGNITION_VIDEO_SRC ? (
            <VideoPlayer src={RECOGNITION_VIDEO_SRC} t={t} preview />
          ) : (
            <div className="award__video-empty">
              <span className="award__video-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="24" cy="24" r="22" />
                  <path d="M20 16 L34 24 L20 32 Z" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="award__video-label">{t("award.videoLabel")}</span>
              <span className="award__video-hint">{t("award.videoPlaceholder")}</span>
            </div>
          )}
        </figure>
      </article>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────
function CTA({ onChat }) {
  const t = useT();
  return (
    <section className="cta" id="contact" data-screen-label="08 Contact">
      <div className="cta__inner" data-reveal>
        <span className="eyebrow eyebrow--center"><span className="eyebrow__dot"/> {t("cta.eyebrow")}</span>
        <h2 className="cta__title">
          {t("cta.title.a")}<em>{t("cta.title.em")}</em>
        </h2>
        <p className="cta__priceNote">{br(t("cta.priceNote"))}</p>
        <button className="btn btn--solid btn--lg" onClick={onChat}>
          {t("cta.button")} <span className="btn__arrow">→</span>
        </button>
        <div className="cta__meta">
          <span>{t("cta.meta1")}</span>
          <span className="cta__dot" />
          <span>{t("cta.meta2")}</span>
          <span className="cta__dot" />
          <span>{t("cta.meta3")}</span>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  const t = useT();
  const socials = [
    {
      name: "Instagram", href: "https://www.instagram.com/kiri.biz/",
      svg: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none"/>
        </svg>
      ),
    },
    {
      name: "X", href: "https://x.com/0xkirikev",
      svg: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M17.53 3H20.5l-6.5 7.43L21.5 21h-6.06l-4.74-6.2L5.3 21H2.34l6.96-7.96L2.5 3h6.2l4.28 5.66L17.53 3Zm-1.06 16.2h1.66L7.6 4.7H5.83l10.64 14.5Z"/>
        </svg>
      ),
    },
    {
      name: "Telegram", href: "https://t.me/kev4ik",
      svg: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42Z"/>
        </svg>
      ),
    },
    {
      name: "Email", href: "mailto:kgermin@tuta.io",
      svg: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <path d="m3.5 6.5 8.5 6 8.5-6"/>
        </svg>
      ),
    },
  ];
  return (
    <footer className="footer">
      <div className="footer__row">
        <div className="footer__brand">
          <span className="footer__mark"><img src="logos/druids-mark.webp" alt="" /></span>
          <div className="footer__brand-text">
            <span className="footer__name">{t("footer.name")}</span>
            <span className="footer__role">{t("footer.role")}</span>
          </div>
        </div>
        <ul className="footer__socials">
          {socials.map((s) => (
            <li key={s.name}>
              <a href={s.href} aria-label={s.name} title={s.name} target="_blank" rel="noopener noreferrer">
                {s.svg}
              </a>
            </li>
          ))}
        </ul>
        <div className="footer__year">© {new Date().getFullYear()}</div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
function Page() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "palette": "teal-gold",
    "showSpine": true,
    "grain": true
  }/*EDITMODE-END*/;

  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const progress = useScrollProgress();
  useReveal();

  // Lightbox state — shared across the page via context
  const [lb, setLb] = useState(null); // { items, startIndex } | null
  const openLightbox = useCallback((items, startIndex = 0) => {
    setLb({ items, startIndex });
  }, []);
  const closeLightbox = useCallback(() => setLb(null), []);

  useEffect(() => {
    const root = document.documentElement;
    if (tw.palette === "teal-gold") {
      root.style.setProperty("--teal", "#0d4d4a");
      root.style.setProperty("--teal-glow", "#5fb3aa");
      root.style.setProperty("--gold", "#c9a35c");
      root.style.setProperty("--gold-glow", "#e7c885");
      root.style.setProperty("--ink", "#070d0c");
      root.style.setProperty("--ink-2", "#0c1614");
      root.style.setProperty("--cream", "#f3ead8");
      root.style.setProperty("--cream-dim", "#bcb29c");
    } else if (tw.palette === "obsidian") {
      root.style.setProperty("--teal", "#1f3f3c");
      root.style.setProperty("--teal-glow", "#8fd1c7");
      root.style.setProperty("--gold", "#b88a3f");
      root.style.setProperty("--gold-glow", "#e0b465");
      root.style.setProperty("--ink", "#040605");
      root.style.setProperty("--ink-2", "#080d0c");
      root.style.setProperty("--cream", "#ede4d0");
      root.style.setProperty("--cream-dim", "#9b9381");
    } else if (tw.palette === "moss") {
      root.style.setProperty("--teal", "#2a5450");
      root.style.setProperty("--teal-glow", "#7bc4b8");
      root.style.setProperty("--gold", "#d4b06a");
      root.style.setProperty("--gold-glow", "#f1d295");
      root.style.setProperty("--ink", "#0a1110");
      root.style.setProperty("--ink-2", "#101a18");
      root.style.setProperty("--cream", "#f6efdd");
      root.style.setProperty("--cream-dim", "#c2b89f");
    }
  }, [tw.palette]);

  const onChat = () => { window.open(CALENDLY_URL, "_blank", "noopener"); };

  return (
    <LightboxContext.Provider value={openLightbox}>
      {tw.showSpine && (
        <div className="spine-wrap" aria-hidden="true">
          <SpineHelix progress={progress} />
        </div>
      )}
      {tw.grain && <div className="grain" aria-hidden="true" />}

      <Nav onChat={onChat} />
      <main>
        <Hero progress={progress} onChat={onChat} />
        <WorkedFor />
        <Services />
        <Work />
        <Approach />
        <Testimonials />
        <Tools />
        <Builder />
        <CTA onChat={onChat} />
      </main>
      <Footer />

      {lb && <Lightbox items={lb.items} startIndex={lb.startIndex} onClose={closeLightbox} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Look">
          <TweakRadio
            label="Palette"
            value={tw.palette}
            options={[
              { value: "teal-gold", label: "Teal·Gold" },
              { value: "obsidian", label: "Obsidian" },
              { value: "moss", label: "Moss" },
            ]}
            onChange={(v) => setTweak("palette", v)}
          />
          <TweakToggle label="Helix spine" value={tw.showSpine} onChange={(v) => setTweak("showSpine", v)} />
          <TweakToggle label="Film grain" value={tw.grain} onChange={(v) => setTweak("grain", v)} />
        </TweakSection>
      </TweaksPanel>
    </LightboxContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Page />);
