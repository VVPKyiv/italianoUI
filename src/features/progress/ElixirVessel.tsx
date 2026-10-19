import { useId } from "react";
import type { CSSProperties } from "react";

export function ElixirVessel({ fraction, active }: { fraction: number; active: boolean }) {
  const id = useId().replace(/:/g, "");
  const level = 267 - fraction * 160;
  const flask = "M113 43 L113 105 C113 126 55 149 55 211 C55 267 89 286 150 286 C211 286 245 267 245 211 C245 149 187 126 187 105 L187 43 Z";
  return <svg className="elixir-vessel" viewBox="0 0 300 340" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-glass`} x1="0" x2="1"><stop stopColor="#ace7dd" stopOpacity=".16"/><stop offset=".45" stopColor="#c8fff1" stopOpacity=".02"/><stop offset="1" stopColor="#ace7dd" stopOpacity=".13"/></linearGradient>
      <linearGradient id={`${id}-liquid`} x1="0" y1="0" x2=".25" y2="1"><stop stopColor="#8affd7"/><stop offset=".25" stopColor="#21cda3"/><stop offset="1" stopColor="#045c4e"/></linearGradient>
      <radialGradient id={`${id}-halo`}><stop stopColor="#39dbaa" stopOpacity={active ? ".24" : ".04"}/><stop offset="1" stopColor="#39dbaa" stopOpacity="0"/></radialGradient>
      <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
      <clipPath id={`${id}-flask`}><path d={flask}/></clipPath>
    </defs>
    <circle cx="150" cy="197" r="141" fill={`url(#${id}-halo)`}/>
    <g className="elixir-orbit"><ellipse cx="150" cy="204" rx="137" ry="47" fill="none" stroke="#d4b880" strokeOpacity=".24" strokeDasharray="2 9" transform="rotate(-24 150 204)"/>
      <circle cx="31" cy="256" r="3" fill="#ecd59c"/><path d="M268 140v12m-6-6h12" stroke="#d9c18b"/></g>
    <ellipse cx="150" cy="301" rx="92" ry="10" fill="#020c09"/>
    <ellipse cx="150" cy="299" rx="80" ry="5" fill="none" stroke="#b69a62" strokeOpacity=".4"/>
    <path d={flask} fill={`url(#${id}-glass)`} stroke="#a9d2c3" strokeOpacity=".48" strokeWidth="1.5"/>
    {active && <g clipPath={`url(#${id}-flask)`}>
      <rect x="53" y={level + 5} width="194" height={289 - level} fill={`url(#${id}-liquid)`}/>
      <g className="elixir-wave"><path d={`M-140 ${level + 6} Q-65 ${level - 7} 10 ${level + 6} T160 ${level + 6} T310 ${level + 6} T460 ${level + 6} L460 ${level + 22} H-140Z`} fill="#75f8cc" fillOpacity=".7"/></g>
      <g className="elixir-wave elixir-wave-back"><path d={`M-140 ${level + 8} Q-65 ${level + 20} 10 ${level + 8} T160 ${level + 8} T310 ${level + 8} T460 ${level + 8} L460 290 H-140Z`} fill={`url(#${id}-liquid)`}/></g>
      {[0, 1, 2, 3, 4, 5, 6].map((bubble) => <circle key={bubble} className="elixir-bubble" cx={88 + (bubble * 31) % 132} cy="273" r={2 + bubble % 3} fill="#b1ffe4" fillOpacity=".65" style={{ "--bubble-rise": `${Math.max(12, 265 - level)}px`, "--delay": `${bubble * -.9}s`, "--duration": `${3 + bubble % 3}s` } as CSSProperties}/>)}
      <ellipse cx="150" cy={level + 7} rx="84" ry="5" fill="#9bffe2" opacity=".4" filter={`url(#${id}-glow)`}/>
    </g>}
    <path d="M96 154 C75 179 68 210 78 239" fill="none" stroke="#d4f7ed" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round"/>
    <path d="M204 165 C218 186 224 208 220 226" fill="none" stroke="#d4f7ed" strokeOpacity=".18" strokeWidth="6" strokeLinecap="round"/>
    <rect x="106" y="40" width="88" height="12" rx="5" fill="#77613c" stroke="#d0b679"/>
    <path d="M112 44h76m-70 4h64" stroke="#edd59d" strokeOpacity=".5"/>
    <rect x="117" y="22" width="66" height="19" rx="5" fill="#28382e" stroke="#a78e60"/>
    <path d="M126 29h48" stroke="#c4a56c" strokeOpacity=".55"/>
    <circle cx="150" cy="192" r="24" fill="#072d26" fillOpacity=".72" stroke="#ddc08a" strokeOpacity=".7"/>
    <path d="M150 177l5 10 11 5-11 5-5 10-5-10-11-5 11-5Z" fill="#e7cc91"/>
    <path d="M148 94h4m-2-2v4M211 93h8m-4-4v8M74 111h6m-3-3v6" stroke="#d7bf87" opacity=".65"/>
  </svg>;
}
