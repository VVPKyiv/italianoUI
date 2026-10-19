type FormatKind = "mixed" | "matching" | "speech" | "sentence" | "listening" | "reading" | "crossword" | "together";

export function TrainingFormatArtwork({ kind }: { kind: FormatKind }) {
  const artwork = {
    mixed: <span className="token-icon"><i>IT</i><i>✦</i></span>,
    matching: <span className="token-icon"><i>IT</i><i>UA</i></span>,
    speech: <span className="wave-icon"><i /><i /><i /><i /><i /></span>,
    sentence: <span className="token-icon"><i>Io</i><i>sono</i></span>,
    listening: <span className="listen-icon">◖<i>)))</i></span>,
    reading: <span className="letter-icon">Aa</span>,
    crossword: <span className="crossword-icon"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>,
    together: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="23" cy="23" r="8" /><path d="M8 50v-4a15 15 0 0 1 30 0v4M41 16a8 8 0 0 1 0 16M46 38a13 13 0 0 1 10 13" /></svg>,
  };
  return <span className={`format-art format-art-${kind}`} aria-hidden="true">
    <span className="format-art-fire">
      {Array.from({ length: 16 }, (_, index) => <span className="format-art-flame" key={index} style={{
        "--flame-angle": `${index * 22.5}deg`,
        "--flame-hue": index * 22.5,
        "--flame-delay": `${index * -.37}s`,
      } as CSSProperties}><i /></span>)}
    </span>
    <span className="format-art-orb">
      <span className="format-art-face">{artwork[kind]}<span className="format-art-sheen" /></span>
      <span className="format-art-glint" />
    </span>
  </span>;
}
import type { CSSProperties } from "react";
