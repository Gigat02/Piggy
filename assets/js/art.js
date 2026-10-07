// Grafica disegnata a mano in SVG. Il maialino è inline (le sue parti si animano
// via CSS); il resto sono simboli riusati con <use>.

export const SPRITES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="s-apple" viewBox="0 0 40 40">
  <ellipse cx="20" cy="36.5" rx="11" ry="2.5" fill="#000" opacity=".16"/>
  <path d="M20 12c-4-3-13-3-14 7-1 9 6 16 10 16 2 0 3-1 4-1s2 1 4 1c4 0 11-7 10-16-1-10-10-10-14-7z" fill="#ec4a3f" stroke="#a3271f" stroke-width="2"/>
  <path d="M11 19c1-3 4-4.5 6-3.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".8"/>
  <path d="M20 12c0-3 1-6 3-8" stroke="#6b3d1f" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <path d="M22.5 7.5c3-4 9-4.5 11.5-2.5-3 4-8.5 4.5-11.5 2.5z" fill="#62c05a" stroke="#2f7a32" stroke-width="1.5"/>
</symbol>
<symbol id="s-gold" viewBox="0 0 40 40">
  <ellipse cx="20" cy="36.5" rx="11" ry="2.5" fill="#000" opacity=".16"/>
  <path d="M20 12c-4-3-13-3-14 7-1 9 6 16 10 16 2 0 3-1 4-1s2 1 4 1c4 0 11-7 10-16-1-10-10-10-14-7z" fill="#ffcc33" stroke="#b97f00" stroke-width="2"/>
  <path d="M11 19c1-3 4-4.5 6-3.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <path d="M20 12c0-3 1-6 3-8" stroke="#6b3d1f" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <path d="M22.5 7.5c3-4 9-4.5 11.5-2.5-3 4-8.5 4.5-11.5 2.5z" fill="#62c05a" stroke="#2f7a32" stroke-width="1.5"/>
  <path d="M31 22l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#fff"/>
</symbol>
<symbol id="s-tree" viewBox="0 0 60 60">
  <ellipse cx="30" cy="55" rx="21" ry="4.5" fill="#000" opacity=".18"/>
  <path d="M26 36h8l1 18h-10z" fill="#8a5a33" stroke="#5e3b1f" stroke-width="2" stroke-linejoin="round"/>
  <g fill="#3f9a45" stroke="#2a6e2f" stroke-width="5"><circle cx="17" cy="28" r="12"/><circle cx="43" cy="28" r="12"/><circle cx="30" cy="17" r="14"/><circle cx="30" cy="33" r="12"/></g>
  <g fill="#5bbd52"><circle cx="17" cy="28" r="12"/><circle cx="43" cy="28" r="12"/><circle cx="30" cy="17" r="14"/><circle cx="30" cy="33" r="12"/></g>
  <circle cx="23" cy="12" r="5" fill="#86d97a" opacity=".85"/>
  <g fill="#ec4a3f" stroke="#a3271f" stroke-width="1"><circle cx="18" cy="29" r="3.2"/><circle cx="39" cy="21" r="3.2"/><circle cx="33" cy="35" r="3.2"/><circle cx="27" cy="22" r="2.6"/></g>
</symbol>
<symbol id="s-rock" viewBox="0 0 50 50">
  <ellipse cx="25" cy="44" rx="19" ry="4" fill="#000" opacity=".16"/>
  <path d="M8 38c-3-9 3-20 13-23 9-3 18 1 21 9 3 7 1 14-5 16-9 3-23 4-29-2z" fill="#a7a9b5" stroke="#6b6d7a" stroke-width="2.4"/>
  <path d="M15 22c3-3 8-5 12-4" stroke="#d6d8e0" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M30 33c3 0 6-1 8-3" stroke="#8a8c98" stroke-width="2" stroke-linecap="round" fill="none"/>
</symbol>
<symbol id="s-bush" viewBox="0 0 50 50">
  <ellipse cx="25" cy="44" rx="20" ry="4" fill="#000" opacity=".16"/>
  <g fill="#3e8f43" stroke="#2a6e2f" stroke-width="4"><circle cx="14" cy="32" r="10"/><circle cx="36" cy="32" r="10"/><circle cx="25" cy="24" r="12"/></g>
  <g fill="#4fae4c"><circle cx="14" cy="32" r="10"/><circle cx="36" cy="32" r="10"/><circle cx="25" cy="24" r="12"/></g>
  <g fill="#7b5cd6"><circle cx="18" cy="27" r="2.2"/><circle cx="31" cy="21" r="2.2"/><circle cx="34" cy="33" r="2.2"/><circle cx="22" cy="35" r="2"/></g>
</symbol>
<symbol id="s-flower" viewBox="0 0 20 20">
  <g fill="#fff"><circle cx="10" cy="5" r="3.2"/><circle cx="15" cy="9" r="3.2"/><circle cx="13" cy="15" r="3.2"/><circle cx="7" cy="15" r="3.2"/><circle cx="5" cy="9" r="3.2"/></g>
  <circle cx="10" cy="10.5" r="2.8" fill="#ffcf33"/>
</symbol>
<symbol id="s-tuft" viewBox="0 0 20 20">
  <path d="M4 17c1-5 2-8 3-10M9 17c0-5 1-9 2-12M14 17c0-4 1-6 3-8" stroke="#4e9d3f" stroke-width="2" stroke-linecap="round" fill="none"/>
</symbol>
<symbol id="s-crow" viewBox="0 0 50 50">
  <ellipse cx="24" cy="46" rx="12" ry="3" fill="#000" opacity=".2"/>
  <path d="M19 41l-2 5M27 41l1 5" stroke="#ffb02e" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M8 33c0-10 8-16 17-16 7 0 11 5 11 11 0 8-7 14-16 14-6 0-12-3-12-9z" fill="#2f2b3d" stroke="#14121c" stroke-width="2"/>
  <path class="wing" d="M12 30c4-7 13-7 16-1-5 4-12 4-16 1z" fill="#4a4460"/>
  <path d="M7 31l-6-3 2 6z" fill="#2f2b3d" stroke="#14121c" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="34" cy="17" r="9" fill="#2f2b3d" stroke="#14121c" stroke-width="2"/>
  <path d="M41 15l9 3-9 3z" fill="#ffb02e" stroke="#c77700" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="36" cy="15" r="3.2" fill="#fff"/><circle cx="37" cy="15.3" r="1.6" fill="#000"/>
  <path d="M32 10.5l6 2" stroke="#14121c" stroke-width="2" stroke-linecap="round"/>
</symbol>
<symbol id="s-farmer" viewBox="0 0 64 72">
  <ellipse cx="30" cy="68" rx="17" ry="3.5" fill="#000" opacity=".2"/>
  <rect x="21" y="52" width="7" height="13" rx="2" fill="#2f4f86"/><rect x="32" y="52" width="7" height="13" rx="2" fill="#2f4f86"/>
  <rect x="18.5" y="62" width="10.5" height="5" rx="2.5" fill="#5a3a22"/><rect x="31" y="62" width="10.5" height="5" rx="2.5" fill="#5a3a22"/>
  <rect x="15" y="32" width="30" height="24" rx="9" fill="#d9534f" stroke="#8f2a27" stroke-width="2"/>
  <path d="M19 41h22v12a5 5 0 0 1-5 5H24a5 5 0 0 1-5-5z" fill="#3f6fb5" stroke="#23457c" stroke-width="2"/>
  <path d="M21 41l-1-8M39 41l1-8" stroke="#23457c" stroke-width="2.4"/>
  <circle cx="24" cy="44" r="1.4" fill="#ffd34d"/><circle cx="36" cy="44" r="1.4" fill="#ffd34d"/>
  <g class="arm"><path d="M43 37l6 4" stroke="#d9534f" stroke-width="6" stroke-linecap="round"/>
    <path d="M45 41h14l-2.5 13h-9z" fill="#b8c2cc" stroke="#6c7884" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="52" cy="41" rx="7" ry="2.2" fill="#5bc0eb" stroke="#6c7884" stroke-width="1.5"/>
    <path d="M45 41c0-7 14-7 14 0" fill="none" stroke="#6c7884" stroke-width="1.6"/></g>
  <path d="M17 37l-4 8" stroke="#d9534f" stroke-width="6" stroke-linecap="round"/><circle cx="12.5" cy="46" r="3" fill="#f6c9a0"/>
  <circle cx="30" cy="24" r="10.5" fill="#f6c9a0" stroke="#b9845a" stroke-width="2"/>
  <circle cx="26" cy="21.5" r="1.4" fill="#2b1b24"/><circle cx="34" cy="21.5" r="1.4" fill="#2b1b24"/>
  <path d="M23.5 18.3l4-1M36.5 18.3l-4-1" stroke="#6b4226" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="30" cy="25.5" r="2.4" fill="#e8a07a"/>
  <path d="M22.5 29c3-2.5 5.5-1.5 7.5-.3 2-1.2 4.5-2.2 7.5.3-2.3 3-5.3 3-7.5 1.3-2.2 1.7-5.2 1.7-7.5-1.3z" fill="#6b4226"/>
  <ellipse cx="30" cy="15.5" rx="18" ry="4.6" fill="#f0c95a" stroke="#b08a2a" stroke-width="2"/>
  <path d="M20.5 14.5c0-9 19-9 19 0z" fill="#f0c95a" stroke="#b08a2a" stroke-width="2"/>
  <path d="M21 12.4h18" stroke="#d9534f" stroke-width="2.6"/>
</symbol>
<symbol id="s-sun" viewBox="0 0 24 24">
  <g stroke="#f5a623" stroke-width="2.2" stroke-linecap="round"><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></g>
  <circle cx="12" cy="12" r="5.5" fill="#ffd34d" stroke="#f5a623" stroke-width="2"/>
</symbol>
<symbol id="s-mud" viewBox="0 0 24 24">
  <path d="M3 15c0-4 4-6 9-6s9 2 9 6-4 6-9 6-9-2-9-6z" fill="#8a5a33" stroke="#5a3519" stroke-width="1.6"/>
  <ellipse cx="9" cy="13.5" rx="3" ry="1.3" fill="#b07a4c"/><circle cx="15.5" cy="15.5" r="1.4" fill="#6e4325"/>
  <circle cx="16" cy="6" r="2" fill="#8a5a33"/>
</symbol>
<symbol id="s-heart" viewBox="0 0 24 24">
  <path d="M12 21s-8.5-5.3-8.5-11.2C3.5 6.5 6 4.5 8.4 4.5c1.7 0 2.9.9 3.6 2.1.7-1.2 1.9-2.1 3.6-2.1 2.4 0 4.9 2 4.9 5.3C20.5 15.7 12 21 12 21z" fill="#ff5d7a" stroke="#c9304f" stroke-width="1.6"/>
  <path d="M7 9c0-1.6 1-2.5 2-2.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".8"/>
</symbol>
<symbol id="s-acorn" viewBox="0 0 24 24">
  <path d="M6 11c0 6 3 10 6 10s6-4 6-10z" fill="#d99a4e" stroke="#9b6427" stroke-width="1.6"/>
  <path d="M4 11c0-3.5 3.5-5.5 8-5.5s8 2 8 5.5z" fill="#8a5a33" stroke="#5e3b1f" stroke-width="1.6"/>
  <path d="M12 5.5V2.5" stroke="#5e3b1f" stroke-width="2" stroke-linecap="round"/>
  <path d="M9 14c0 2 1 4 2 5" stroke="#f0c48a" stroke-width="1.6" stroke-linecap="round" fill="none"/>
</symbol>
<symbol id="s-bolt" viewBox="0 0 24 24">
  <path d="M13.5 2L4.5 13.5h6l-1.5 8.5 9-11.5h-6z" fill="#ffd34d" stroke="#d48b00" stroke-width="1.6" stroke-linejoin="round"/>
</symbol>
<symbol id="s-step" viewBox="0 0 24 24">
  <ellipse cx="8" cy="15" rx="3.2" ry="5" fill="#ff9fbb" stroke="#d96b8f" stroke-width="1.4"/>
  <ellipse cx="16" cy="15" rx="3.2" ry="5" fill="#ff9fbb" stroke="#d96b8f" stroke-width="1.4"/>
</symbol>
<symbol id="s-dog" viewBox="0 0 64 58">
  <ellipse cx="32" cy="54" rx="20" ry="3.5" fill="#000" opacity=".18"/>
  <path class="tailw" d="M13 34c-7-3-8-12-3-15" stroke="#8a5a33" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  <rect x="17" y="42" width="7" height="11" rx="3.5" fill="#ecd3ad" stroke="#8a5a33" stroke-width="2"/><rect x="33" y="42" width="7" height="11" rx="3.5" fill="#ecd3ad" stroke="#8a5a33" stroke-width="2"/>
  <ellipse cx="28" cy="36" rx="17" ry="12" fill="#ecd3ad" stroke="#8a5a33" stroke-width="2.4"/>
  <path d="M17 31c4-7 15-7 18 0-5 5-13 5-18 0z" fill="#b5743d"/>
  <circle cx="44" cy="22" r="12.5" fill="#ecd3ad" stroke="#8a5a33" stroke-width="2.4"/>
  <path d="M36 13c-7 2-9 13-4 17 3-2 6-9 7-15z" fill="#a7652f" stroke="#8a5a33" stroke-width="2"/>
  <ellipse cx="53" cy="27" rx="8" ry="5.5" fill="#f7ead6" stroke="#8a5a33" stroke-width="2"/>
  <circle cx="59" cy="25" r="2.8" fill="#2b1b24"/>
  <circle cx="46" cy="19" r="2.3" fill="#2b1b24"/><path d="M43 15l5 1.5" stroke="#5e3b1f" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M50 31q3 2 6 0" stroke="#5e3b1f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M35 31c4 3 10 3 14 0" stroke="#e8413c" stroke-width="3.6" fill="none" stroke-linecap="round"/><circle cx="42" cy="34" r="2.2" fill="#ffd34d" stroke="#b97f00"/>
</symbol>
<symbol id="s-goose" viewBox="0 0 52 58">
  <ellipse cx="24" cy="54" rx="15" ry="3" fill="#000" opacity=".18"/>
  <path d="M20 45v7l-4 1M28 45v7l4 1" stroke="#f08a24" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M31 30c1-9-1-15 1-21" stroke="#9aa3ad" stroke-width="11" stroke-linecap="round" fill="none"/>
  <path d="M31 30c1-9-1-15 1-21" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/>
  <path d="M5 37c0-9 9-14 20-13 7 0 11 3 13 8 2 7-2 13-13 14-11 1-20-2-20-9z" fill="#fff" stroke="#9aa3ad" stroke-width="2.2"/>
  <path d="M11 35c5-5 14-5 18 0-6 4-13 4-18 0z" fill="#e3e9ef"/>
  <circle cx="34" cy="9" r="7" fill="#fff" stroke="#9aa3ad" stroke-width="2"/>
  <path d="M40 7l10 2.5-10 3.5z" fill="#f08a24" stroke="#c4650e" stroke-width="1.4" stroke-linejoin="round"/>
  <circle cx="36" cy="7.5" r="1.7" fill="#2b1b24"/><path d="M33 3.6l5.5 2.2" stroke="#2b1b24" stroke-width="1.8" stroke-linecap="round"/>
</symbol>
<symbol id="s-bull" viewBox="0 0 68 58">
  <ellipse cx="32" cy="54" rx="24" ry="3.6" fill="#000" opacity=".2"/>
  <path d="M10 30c-6 0-8 6-5 10" stroke="#3e2414" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g fill="#5e371f" stroke="#2e190b" stroke-width="2"><rect x="12" y="38" width="7" height="14" rx="3"/><rect x="22" y="40" width="7" height="13" rx="3"/><rect x="34" y="40" width="7" height="13" rx="3"/><rect x="43" y="38" width="7" height="14" rx="3"/></g>
  <ellipse cx="30" cy="31" rx="22" ry="14" fill="#7a4a2e" stroke="#2e190b" stroke-width="2.4"/>
  <path d="M18 24c6-4 16-4 22 0" stroke="#946043" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M46 18c-5-6-3-12 3-13-1 4 0 7 3 10M60 18c5-5 4-11-1-13 0 4-1 7-3 10" fill="#f3e6c8" stroke="#8a7a5a" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M45 17c8-3 18 1 18 11 0 9-6 14-12 14s-11-6-11-13c0-6 2-11 5-12z" fill="#7a4a2e" stroke="#2e190b" stroke-width="2.4"/>
  <ellipse cx="54" cy="35" rx="8.5" ry="6" fill="#d9a184" stroke="#2e190b" stroke-width="2"/>
  <ellipse cx="51" cy="35" rx="1.4" ry="2" fill="#2e190b"/><ellipse cx="57" cy="35" rx="1.4" ry="2" fill="#2e190b"/>
  <circle cx="54" cy="41.5" r="3" fill="none" stroke="#ffd34d" stroke-width="2"/>
  <circle cx="49" cy="24" r="2.2" fill="#fff"/><circle cx="49.6" cy="24.3" r="1.2" fill="#2b1b24"/>
  <circle cx="59" cy="24" r="2.2" fill="#fff"/><circle cx="59.6" cy="24.3" r="1.2" fill="#2b1b24"/>
  <path d="M46 20l5 2.5M62 20l-5 2.5" stroke="#2e190b" stroke-width="2" stroke-linecap="round"/>
</symbol>
<symbol id="s-mushroom" viewBox="0 0 40 40">
  <ellipse cx="20" cy="37" rx="10" ry="2.4" fill="#000" opacity=".16"/>
  <path d="M15 22h10l1 13h-12z" fill="#fbf1de" stroke="#b49a72" stroke-width="2" stroke-linejoin="round"/>
  <path d="M4 23c0-10 7-17 16-17s16 7 16 17c-5 2-27 2-32 0z" fill="#e5483e" stroke="#9c2820" stroke-width="2.2"/>
  <g fill="#fff"><circle cx="13" cy="15" r="2.6"/><circle cx="23" cy="11" r="2.2"/><circle cx="28" cy="18" r="2.4"/><circle cx="18" cy="20" r="1.8"/></g>
</symbol>
<symbol id="s-clover" viewBox="0 0 40 40">
  <path d="M20 22c2 6 3 10 7 14" stroke="#2f7a32" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <g fill="#4fae4c" stroke="#2a6e2f" stroke-width="1.6">
    <circle cx="20" cy="12" r="6"/><circle cx="28" cy="20" r="6"/><circle cx="20" cy="28" r="6"/><circle cx="12" cy="20" r="6"/></g>
  <g fill="#6cc865"><circle cx="20" cy="12" r="3"/><circle cx="28" cy="20" r="3"/><circle cx="20" cy="28" r="3"/><circle cx="12" cy="20" r="3"/></g>
  <circle cx="20" cy="20" r="2.4" fill="#2f7a32"/>
</symbol>
<symbol id="s-cloud" viewBox="0 0 40 40">
  <g stroke="#3fa9e0" stroke-width="2.4" stroke-linecap="round"><path d="M13 29l-2 6M20 29l-2 6M27 29l-2 6"/></g>
  <path d="M10 26c-5 0-7-6-3-9 0-6 7-9 11-6 2-5 11-5 13 1 5 0 7 7 3 10-1 3-3 4-6 4z" fill="#fff" stroke="#7d93a8" stroke-width="2.2"/>
  <path d="M12 18c1-3 4-4 6-3" stroke="#d6e2ec" stroke-width="2.4" stroke-linecap="round" fill="none"/>
</symbol>
<symbol id="s-rainbow" viewBox="0 0 40 40">
  <g fill="none" stroke-width="3.4" stroke-linecap="round"><path d="M4 30a16 16 0 0 1 32 0" stroke="#ec4a3f"/><path d="M8 30a12 12 0 0 1 24 0" stroke="#ffcc33"/><path d="M12 30a8 8 0 0 1 16 0" stroke="#4fae4c"/><path d="M16 30a4 4 0 0 1 8 0" stroke="#5aa9e6"/></g>
  <path d="M31 4l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#ffcc33"/>
</symbol>
<symbol id="s-bolt" viewBox="0 0 40 40">
  <path d="M23 3L9 22h9l-4 15 17-21h-10z" fill="#ffd34d" stroke="#b97f00" stroke-width="2.2" stroke-linejoin="round"/>
</symbol>
<symbol id="s-gas" viewBox="0 0 40 40">
  <g fill="#b7e07a" stroke="#6f9a33" stroke-width="2"><circle cx="13" cy="24" r="8"/><circle cx="24" cy="18" r="9"/><circle cx="28" cy="27" r="7"/></g>
  <circle cx="22" cy="15" r="2.2" fill="#e3f5c3"/>
</symbol>
<symbol id="s-drop" viewBox="0 0 40 40">
  <circle cx="20" cy="22" r="15" fill="none" stroke="#6aa84f" stroke-width="2.4" stroke-dasharray="5 4"/>
  <g opacity=".6"><path d="M20 17c-2-1.5-7-1.5-7.5 3.5-.5 4.5 3 8 5 8 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2 0 5.5-3.5 5-8-.5-5-5.5-5-7.5-3.5z" fill="#ec4a3f"/></g>
  <path d="M20 1v8m-3.5-3.5L20 9l3.5-3.5" stroke="#3f7a2e" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</symbol>
<symbol id="s-belly" viewBox="0 0 24 24">
  <circle cx="12" cy="13" r="9.5" fill="#ffb6c9" stroke="#d96b8f" stroke-width="1.8"/>
  <path d="M7 14q5 5 10 0" stroke="#d96b8f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <circle cx="12" cy="9.5" r="1.4" fill="#d96b8f"/>
</symbol>
<symbol id="s-market" viewBox="0 0 24 24">
  <rect x="4" y="11" width="16" height="10" rx="1.5" fill="#f6dfb8" stroke="#8a5a33" stroke-width="1.5"/>
  <rect x="9.5" y="14" width="5" height="7" rx="1" fill="#b5743d"/>
  <path d="M2 7l2.2-4h15.6L22 7v1.6a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z" fill="#ec4a3f" stroke="#a3271f" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M8 3.2L7 8.6M12 3.2v5.4M16 3.2l1 5.4" stroke="#fff" stroke-width="1.8"/>
</symbol>
</defs></svg>`;

// I maialini: stessa sagoma, colori e accessori diversi. Le macchie di fango (m1-m3)
// compaiono man mano che si sporca.
const SKINS = {
  rosina:  { b: '#ffb6c9', s: '#d96b8f', l: '#f59ab5', sn: '#ff8fb0', no: '#a83e64', ear: '#ffa3bd', ein: '#ff7fa3', bel: '#ffd2de', ch: '#ff7fa3', acc: 'flower' },
  grufolo: { b: '#dba38c', s: '#9a5d44', l: '#c98a73', sn: '#cf8a70', no: '#6e3a26', ear: '#d29580', ein: '#b26e57', bel: '#ecc3b1', ch: '#c0705a', acc: 'spots' },
  lampo:   { b: '#ffc9a8', s: '#d9845a', l: '#f5b08a', sn: '#ffab84', no: '#a6532e', ear: '#ffb894', ein: '#ff946a', bel: '#ffe3d0', ch: '#ff946a', acc: 'bandana' },
  ciccio:  { b: '#f6a6b6', s: '#c95d78', l: '#ea8fa3', sn: '#f2879f', no: '#962f50', ear: '#f394aa', ein: '#e86c8c', bel: '#fbcbd6', ch: '#e86c8c', acc: 'big' },
  nebbia:  { b: '#6a6385', s: '#3a3450', l: '#5a5373', sn: '#8a80a8', no: '#2e2940', ear: '#7a7298', ein: '#b3a6dd', bel: '#7f789b', ch: '#d39be8', acc: 'hat' },
  // pelli in più per i maialini dell'Arena
  bianco:  { b: '#f6efe9', s: '#b9a8a0', l: '#e8ddd5', sn: '#f2c6cf', no: '#a8737f', ear: '#f0e2da', ein: '#f2b6c4', bel: '#fffaf6', ch: '#f2b6c4' },
  oro:     { b: '#ffd56a', s: '#b98a1c', l: '#f2c24d', sn: '#ffc04d', no: '#8a5a00', ear: '#ffcc55', ein: '#f5a623', bel: '#fff0b8', ch: '#ff9f43' },
  nero:    { b: '#4a4452', s: '#221f29', l: '#3b3644', sn: '#6b6278', no: '#221f29', ear: '#5a5364', ein: '#8c829c', bel: '#5d5668', ch: '#c07aa0', dark: true },
  lilla:   { b: '#d9c2f2', s: '#8d6bc0', l: '#c7aee8', sn: '#e7b6e8', no: '#7a4fa0', ear: '#d0b5ee', ein: '#b994e6', bel: '#efe3fb', ch: '#e89ad6' },
};

// Accessori estetici, disegnati nelle coordinate del maialino e tenuti dentro la sua casella.
const LOOKS = {
  astronauta: '<g class="look"><circle cx="86" cy="42" r="34" fill="rgba(200,232,255,.28)" stroke="#9fb6c9" stroke-width="3.4"/><path d="M62 30q8-18 30-20" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".85"/><circle cx="104" cy="22" r="3" fill="#fff" opacity=".8"/><path d="M60 68q26 14 52 0l2 7q-28 15-56 0z" fill="#dfe6ee" stroke="#8a9bab" stroke-width="2.4"/><circle cx="86" cy="74" r="3" fill="#e8413c"/></g>',
  antenne: '<g class="look"><path d="M76 23Q70 10 64 3M96 21q6-12 14-17" stroke="#3b3550" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="64" cy="3" r="4.6" fill="#7dff8a" stroke="#2f8a3a" stroke-width="1.6"/><circle cx="110" cy="4" r="4.6" fill="#7dff8a" stroke="#2f8a3a" stroke-width="1.6"/><circle cx="62.6" cy="1.6" r="1.4" fill="#fff"/><circle cx="108.6" cy="2.6" r="1.4" fill="#fff"/></g>',
  corna: '<g class="look"><path d="M72 24c-8-4-12-14-9-22 3 7 8 11 15 14z" fill="#b3261e" stroke="#6e130e" stroke-width="2" stroke-linejoin="round"/><path d="M99 21c8-5 11-15 7-22-2 7-7 11-13 14z" fill="#b3261e" stroke="#6e130e" stroke-width="2" stroke-linejoin="round"/></g>',
  unicorno: '<g class="look"><path d="M80 22l7-27 7 26z" fill="#ffe27a" stroke="#c99a12" stroke-width="2" stroke-linejoin="round"/><path d="M81.5 15l11-3M83 8l8-2M84.5 1l5-1" stroke="#c99a12" stroke-width="1.6"/><path d="M66 22q-6 8 2 14M106 18q8 6 2 14" stroke="#ff8fd6" stroke-width="4" fill="none" stroke-linecap="round"/></g>',
  cresta: '<g class="look"><path d="M68 26l2-16 6 10 3-17 6 14 4-17 5 15 6-14 1 16 5-8-1 14z" fill="#3ddc84" stroke="#1d8a4e" stroke-width="2" stroke-linejoin="round"/><path d="M76 20l3-12M85 18l4-13M95 18l5-12" stroke="#ff3fa4" stroke-width="2.4" stroke-linecap="round"/></g>',
  fungo: '<g class="look"><path d="M56 30Q60 -4 86 -4T116 30q-30 6-60 0z" fill="#e8413c" stroke="#9c1f17" stroke-width="2.6" stroke-linejoin="round"/><g fill="#fff"><circle cx="72" cy="12" r="5"/><circle cx="90" cy="5" r="4"/><circle cx="104" cy="16" r="4.6"/><circle cx="84" cy="22" r="3.4"/><circle cx="63" cy="25" r="2.6"/></g></g>',
  paglia: '<g class="look"><ellipse cx="86" cy="22" rx="27" ry="5.5" fill="#f2cf6b" stroke="#b08a2a" stroke-width="2.2"/><path d="M71 21c0-11 30-11 30 0z" fill="#f2cf6b" stroke="#b08a2a" stroke-width="2.2"/><path d="M71.5 18h29" stroke="#e8413c" stroke-width="3"/></g>',
  cappellino: '<g class="look"><path d="M68 26c0-14 34-14 36 0z" fill="#3f6fb5" stroke="#23457c" stroke-width="2.2"/><path d="M101 24c8-1 15 1 16 4-6 2-12 1-17 0z" fill="#2f5a9a" stroke="#23457c" stroke-width="2"/><circle cx="86" cy="15.5" r="2.2" fill="#ffd34d"/></g>',
  cilindro: '<g class="look"><rect x="74" y="5" width="24" height="17" rx="2" fill="#2e2a38" stroke="#14121c" stroke-width="2"/><rect x="74" y="15" width="24" height="4" fill="#e8413c"/><ellipse cx="86" cy="22" rx="20" ry="4.5" fill="#2e2a38" stroke="#14121c" stroke-width="2"/></g>',
  vichingo: '<g class="look"><path d="M68 20c-8-2-10-10-6-14 1 6 5 9 9 9zM104 20c8-2 10-10 6-14-1 6-5 9-9 9z" fill="#f3e6c8" stroke="#8a7a5a" stroke-width="1.8"/><path d="M66 28c0-18 40-18 40 0z" fill="#a9b2bd" stroke="#5e6670" stroke-width="2.2"/><path d="M66 27h40" stroke="#8a6a3a" stroke-width="4"/><circle cx="86" cy="15" r="2" fill="#d6dde4"/></g>',
  corona: '<g class="look"><path d="M72 22l2-14 7 8 5-11 5 11 7-8 2 14z" fill="#ffd34d" stroke="#b97f00" stroke-width="2.2" stroke-linejoin="round"/><circle cx="86" cy="15" r="2" fill="#e8413c"/><circle cx="77" cy="17" r="1.5" fill="#5aa9e6"/><circle cx="95" cy="17" r="1.5" fill="#4fae4c"/></g>',
  tondi: '<g class="look"><g fill="rgba(255,255,255,.25)" stroke="#5e3b1f" stroke-width="2.2"><circle cx="79" cy="39" r="8"/><circle cx="96" cy="38" r="8"/></g><path d="M87 38.5h1" stroke="#5e3b1f" stroke-width="2.4"/></g>',
  sole: '<g class="look"><g fill="#1f1a2b" stroke="#14121c" stroke-width="1.6"><rect x="70" y="32" width="17" height="12" rx="5"/><rect x="88" y="31" width="17" height="12" rx="5"/></g><path d="M87 37h1" stroke="#14121c" stroke-width="2.4"/><path d="M73 35l5-1M91 34l5-1" stroke="#fff" stroke-width="1.6" opacity=".6" stroke-linecap="round"/></g>',
  monocolo: '<g class="look"><circle cx="96" cy="38" r="8.5" fill="rgba(255,255,255,.2)" stroke="#d4a017" stroke-width="2.4"/><path d="M104 41q4 12-2 20" stroke="#d4a017" stroke-width="1.4" fill="none"/></g>',
  pirata: '<g class="look"><path d="M67 31l42-5" stroke="#14121c" stroke-width="2.2"/><ellipse cx="79" cy="39" rx="7.5" ry="8" fill="#14121c"/></g>',
  farfallino: '<g class="look" transform="translate(82 68)"><path d="M0 0l-9-6v12zM0 0l9-6v12z" fill="#e8413c" stroke="#a3271f" stroke-width="1.8" stroke-linejoin="round"/><circle r="2.6" fill="#c62f28"/></g>',
  campanella: '<g class="look"><path d="M64 60q16 10 34 2" stroke="#8a5a33" stroke-width="3.5" fill="none"/><g transform="translate(82 67)"><path d="M-5 0h10l2 9h-14z" fill="#ffd34d" stroke="#b97f00" stroke-width="1.8" stroke-linejoin="round"/><circle cy="10" r="1.8" fill="#b97f00"/></g></g>',
  sciarpa: '<g class="look"><path d="M62 58q14 12 34 3l3 8q-20 10-39-2z" fill="#5aa9e6" stroke="#2f6fa0" stroke-width="2.2"/><path d="M70 63l2 7M80 65l1 7M90 63l1 7" stroke="#fff" stroke-width="2.4"/><path d="M64 62l-4 14 7-2z" fill="#5aa9e6" stroke="#2f6fa0" stroke-width="2"/></g>',
  // ---- accessori dell'Arena ----
  tricorno: '<g class="look"><path d="M60 27c6-15 46-15 52 0-8-5-18-6-26-6s-18 1-26 6z" fill="#2b2433" stroke="#14121c" stroke-width="2"/><path d="M70 23c3-13 29-13 32 0z" fill="#2b2433" stroke="#14121c" stroke-width="2"/><circle cx="86" cy="15" r="3.4" fill="#fff"/><circle cx="84.8" cy="14.6" r=".9" fill="#14121c"/><circle cx="87.2" cy="14.6" r=".9" fill="#14121c"/><path d="M60 27c8-5 18-6 26-6s18 1 26 6" stroke="#ffd34d" stroke-width="1.6" fill="none"/></g>',
  cuoco: '<g class="look"><path d="M73 22c-7 0-9-10-1-12 1-7 10-8 14-3 4-5 13-4 14 3 8 2 6 12-1 12z" fill="#fff" stroke="#c9c2d6" stroke-width="2"/><rect x="72" y="19" width="28" height="7" rx="2" fill="#fff" stroke="#c9c2d6" stroke-width="2"/></g>',
  cowboy: '<g class="look"><path d="M57 22c4 4 54 4 58 0-2 5-56 5-58 0z" fill="#a8743f" stroke="#6b4420" stroke-width="2"/><path d="M71 21c0-14 6-15 15-9 9-6 15-5 15 9z" fill="#a8743f" stroke="#6b4420" stroke-width="2"/><path d="M71.5 17.5h29" stroke="#5a3519" stroke-width="3"/></g>',
  marinaio: '<g class="look"><ellipse cx="86" cy="20" rx="21" ry="7" fill="#fff" stroke="#9aa3ad" stroke-width="2"/><rect x="69" y="20" width="34" height="6" rx="3" fill="#2f5a9a"/><circle cx="86" cy="14" r="2.6" fill="#e8413c"/></g>',
  fascia: '<g class="look"><path d="M63 33q23-10 46-6l-1 6q-22-4-44 6z" fill="#e8413c" stroke="#a3271f" stroke-width="1.8"/><path d="M63 35l-10 2 4-7zM63 35l-6 8 1-8z" fill="#e8413c" stroke="#a3271f" stroke-width="1.4" stroke-linejoin="round"/></g>',
  elmo: '<g class="look"><path d="M64 31c0-22 44-22 44 0z" fill="#b8c2cc" stroke="#6c7884" stroke-width="2.2"/><path d="M86 11v20M64 31h44" stroke="#6c7884" stroke-width="2"/><path d="M86 11c2-7 9-8 12-4-4 1-7 3-9 7z" fill="#e8413c" stroke="#a3271f" stroke-width="1.4"/></g>',
  basco: '<g class="look"><ellipse cx="82" cy="20" rx="21" ry="7" fill="#e85d75" stroke="#a83e64" stroke-width="2"/><path d="M82 13v-4" stroke="#a83e64" stroke-width="2.6" stroke-linecap="round"/></g>',
  festa: '<g class="look"><path d="M78 23l9-21 9 21z" fill="#ffcf33" stroke="#d48b00" stroke-width="2" stroke-linejoin="round"/><path d="M81 17h12M84 10h6" stroke="#e8413c" stroke-width="2.2"/><circle cx="87" cy="2" r="3" fill="#5aa9e6"/></g>',
  cuffie: '<g class="look"><path d="M61 42c0-31 50-31 50 0" fill="none" stroke="#3b3550" stroke-width="4.5"/><rect x="56" y="35" width="10" height="15" rx="4" fill="#e8413c" stroke="#3b3550" stroke-width="2"/><rect x="106" y="33" width="10" height="15" rx="4" fill="#e8413c" stroke="#3b3550" stroke-width="2"/></g>',
  fiori: '<g class="look"><path d="M64 26q22-14 44 0" fill="none" stroke="#4fae4c" stroke-width="2.5"/><g stroke="#fff" stroke-width="1"><circle cx="68" cy="24" r="4" fill="#ff8fb0"/><circle cx="77" cy="19" r="4" fill="#ffd34d"/><circle cx="86" cy="17" r="4.4" fill="#5aa9e6"/><circle cx="95" cy="19" r="4" fill="#ff8fb0"/><circle cx="104" cy="24" r="4" fill="#ffd34d"/></g><g fill="#fff"><circle cx="68" cy="24" r="1.4"/><circle cx="77" cy="19" r="1.4"/><circle cx="86" cy="17" r="1.6"/><circle cx="95" cy="19" r="1.4"/><circle cx="104" cy="24" r="1.4"/></g></g>',
  aureola: '<g class="look"><ellipse cx="86" cy="8" rx="17" ry="4.6" fill="none" stroke="#ffd34d" stroke-width="3.6"/><ellipse cx="86" cy="8" rx="17" ry="4.6" fill="none" stroke="#fff6c4" stroke-width="1.2"/></g>',
  mago: '<g class="look"><path d="M71 24L88 -4l17 26z" fill="#7a4fd0" stroke="#3f2380" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="88" cy="23" rx="24" ry="5" fill="#6a40c0" stroke="#3f2380" stroke-width="2.4"/><path d="M89 8l1.4 3 3.2.4-2.4 2.1.7 3.2-2.9-1.7-2.9 1.7.7-3.2-2.4-2.1 3.2-.4z" fill="#ffd34d"/></g>',
  ninja: '<g class="look"><path d="M62 30q24-9 48-4v7q-24-5-48 4z" fill="#2b2433"/><path d="M62 33l-11-1 5-6zM62 34l-9 7 2-8z" fill="#2b2433"/><rect x="83" y="27" width="8" height="5" rx="1" fill="#b8c2cc"/></g>',
  maschera: '<g class="look"><path d="M63 33q23-6 46-2v13q-23-4-46 2z" fill="#2b2433"/><ellipse cx="79" cy="39" rx="5.5" ry="3.2" fill="#fff"/><ellipse cx="96" cy="38" rx="5.5" ry="3.2" fill="#fff"/><circle cx="80" cy="39" r="2.2" fill="#2b1b24"/><circle cx="97" cy="38" r="2.2" fill="#2b1b24"/></g>',
  stelle: '<g class="look"><g fill="#ff5d9e" stroke="#a83e64" stroke-width="1.4" opacity=".92"><path transform="translate(79 39)" d="M0-9l2.6 5.4 5.9.9-4.3 4.1 1 5.9L0 4.5l-5.3 2.8 1-5.9-4.3-4.1 5.9-.9z"/><path transform="translate(96 38)" d="M0-9l2.6 5.4 5.9.9-4.3 4.1 1 5.9L0 4.5l-5.3 2.8 1-5.9-4.3-4.1 5.9-.9z"/></g><path d="M86 38.5h3" stroke="#a83e64" stroke-width="2"/></g>',
  medaglia: '<g class="look"><path d="M78 61l5 9M91 61l-5 9" stroke="#3f86e0" stroke-width="3.2"/><circle cx="84.5" cy="73" r="5.5" fill="#ffd34d" stroke="#b97f00" stroke-width="1.8"/><path d="M84.5 70.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" fill="#fff"/></g>',
  ancora: '<g class="look"><path d="M65 60q17 10 33 2" stroke="#8a5a33" stroke-width="2.2" fill="none"/><g transform="translate(82 66)" stroke="#5e6670" stroke-width="2.4" fill="none" stroke-linecap="round"><circle cy="-1" r="1.6"/><path d="M0 1v10M-4 4h8M-6 8q6 7 12 0"/></g></g>',
  collare: '<g class="look"><path d="M63 60q20 12 38 2l2 6q-20 11-42-1z" fill="#3b3550"/><g fill="#d6dde4"><path d="M68 64l2-5 2 5zM76 67l2-5 2 5zM84 68l2-5 2 5zM92 66l2-5 2 5z"/></g></g>',
  fazzoletto: '<g class="look"><path d="M64 60q18 12 34 2l-12 15z" fill="#e8413c" stroke="#a3271f" stroke-width="2" stroke-linejoin="round"/><circle cx="80" cy="66" r="1.5" fill="#fff"/><circle cx="88" cy="64" r="1.5" fill="#fff"/><circle cx="85" cy="70" r="1.3" fill="#fff"/></g>',
  perle: '<g class="look" fill="#fff" stroke="#c9c2d6" stroke-width="1"><circle cx="66" cy="62" r="2.5"/><circle cx="71" cy="65" r="2.5"/><circle cx="76" cy="67" r="2.5"/><circle cx="82" cy="68" r="2.7"/><circle cx="88" cy="67.5" r="2.5"/><circle cx="93" cy="66" r="2.5"/><circle cx="98" cy="63" r="2.5"/></g>',
};

export function pigSVG(skin = 'rosina', look = {}) {
  const k = SKINS[skin] || SKINS.rosina, big = k.acc === 'big';
  const L = { testa: LOOKS[look.testa] || '', occhi: LOOKS[look.occhi] || '', collo: LOOKS[look.collo] || '' };
  const rx = big ? 40 : 36, ry = big ? 30 : 27;
  const acc = {
    flower: `<g transform="translate(64 14)"><g fill="#fff" stroke="#e8c3d0" stroke-width="1"><circle cx="0" cy="-5" r="4"/><circle cx="5" cy="-1" r="4"/><circle cx="3" cy="5" r="4"/><circle cx="-3" cy="5" r="4"/><circle cx="-5" cy="-1" r="4"/></g><circle r="3.4" fill="#ffcf33"/></g>`,
    spots: `<g fill="#a9705a" opacity=".55"><ellipse cx="40" cy="55" rx="7" ry="5"/><ellipse cx="62" cy="44" rx="5" ry="4"/><ellipse cx="30" cy="66" rx="4" ry="3"/></g>`,
    bandana: `<path d="M62 58q14 12 34 3l3 8q-20 10-39-2z" fill="#e8413c" stroke="#a3271f" stroke-width="2.2"/><path d="M64 62l-10 9 4-12z" fill="#e8413c" stroke="#a3271f" stroke-width="2"/><circle cx="80" cy="66" r="1.6" fill="#fff"/><circle cx="90" cy="64" r="1.6" fill="#fff"/>`,
    big: '',
    hat: `<g class="hat"><path d="M71 24L88 -4l17 26z" fill="#7a4fd0" stroke="#3f2380" stroke-width="2.6" stroke-linejoin="round"/><path d="M88 -4l-4 10 7 2z" fill="#9a74ea"/><ellipse cx="88" cy="23" rx="24" ry="5" fill="#6a40c0" stroke="#3f2380" stroke-width="2.4"/><path d="M89 8l1.4 3 3.2.4-2.4 2.1.7 3.2-2.9-1.7-2.9 1.7.7-3.2-2.4-2.1 3.2-.4z" fill="#ffd34d"/></g>`,
  }[k.acc];
  return `<svg class="pig-svg" viewBox="0 0 124 104" aria-hidden="true">
  <ellipse class="shadow" cx="60" cy="96" rx="${rx + 4}" ry="6" fill="#000" opacity=".18"/>
  <g class="body-g">
    <path class="tail" d="M24 52c-9-1-12-9-6-12 6-2 7 6 1 7" fill="none" stroke="${k.s}" stroke-width="3.2" stroke-linecap="round"/>
    <g><rect x="30" y="72" width="12" height="18" rx="5" fill="${k.l}" stroke="${k.s}" stroke-width="2.5"/>
      <rect x="46" y="74" width="12" height="17" rx="5" fill="${k.l}" stroke="${k.s}" stroke-width="2.5"/></g>
    <ellipse cx="56" cy="58" rx="${rx}" ry="${ry}" fill="${k.b}" stroke="${k.s}" stroke-width="3"/>
    <ellipse cx="54" cy="${big ? 70 : 68}" rx="${big ? 28 : 24}" ry="${big ? 14 : 12}" fill="${k.bel}" opacity=".75"/>
    <path d="M36 42c6-6 16-8 24-7" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".45"/>
    ${k.acc === 'spots' ? acc : ''}
    <g class="mud m1" fill="#7a4a26"><path d="M42 50c4-5 12-4 13 1s-6 7-10 6-5-4-3-7z"/><circle cx="58" cy="47" r="2.4"/></g>
    <g class="mud m2" fill="#6e4021"><path d="M26 62c3-4 10-3 10 1s-5 6-8 5-4-3-2-6z"/><path d="M60 72c4-3 10-2 10 2s-6 5-9 4-3-4-1-6z"/></g>
    <g class="mud m3" fill="#5f361b"><path d="M30 80h12v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z" opacity=".9"/><path d="M44 36c5-3 13-1 13 3s-7 4-11 3-5-4-2-6z"/></g>
    <g><rect x="64" y="74" width="12" height="17" rx="5" fill="${k.b}" stroke="${k.s}" stroke-width="2.5"/>
      <rect x="79" y="72" width="12" height="18" rx="5" fill="${k.b}" stroke="${k.s}" stroke-width="2.5"/>
      <path class="mud m3" d="M64 84h12v5a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2zM79 83h12v5a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z" fill="#5f361b"/></g>
    ${k.acc === 'bandana' && !L.collo ? acc : ''}${L.collo}
    <g class="head">
      <path class="ear ear-l" d="M70 28L64 8l17 12z" fill="${k.ear}" stroke="${k.s}" stroke-width="2.6" stroke-linejoin="round"/>
      <path class="ear ear-r" d="M95 22l12-14-2 22z" fill="${k.ear}" stroke="${k.s}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M69 24l-3-10 9 6zM98 21l6-7-1 11z" fill="${k.ein}"/>
      <circle cx="86" cy="44" r="25" fill="${k.b}" stroke="${k.s}" stroke-width="3"/>
      <g class="mud m2" fill="#6e4021"><path d="M74 30c3-3 9-2 9 2s-5 5-8 4-3-4-1-6z"/></g>
      <g class="eyes">${skin === 'nebbia' || k.dark ? '<ellipse cx="79" cy="39" rx="6" ry="7.4" fill="#fff"/><ellipse cx="96" cy="38" rx="6" ry="7.4" fill="#fff"/>' : ''}
        <ellipse cx="79" cy="39" rx="4.3" ry="5.8" fill="#2b1b24"/><ellipse cx="96" cy="38" rx="4.3" ry="5.8" fill="#2b1b24"/>
        <circle cx="80.5" cy="36.8" r="1.7" fill="#fff"/><circle cx="97.5" cy="35.8" r="1.7" fill="#fff"/></g>${L.occhi}
      <ellipse cx="72" cy="53" rx="5" ry="3.2" fill="${k.ch}" opacity=".55"/><ellipse cx="104" cy="51" rx="4.5" ry="3" fill="${k.ch}" opacity=".55"/>
      <g class="snout"><ellipse cx="93" cy="53" rx="11.5" ry="8.5" fill="${k.sn}" stroke="${k.s}" stroke-width="2.6"/>
        <ellipse cx="89" cy="53" rx="2.2" ry="3.2" fill="${k.no}"/><ellipse cx="97.5" cy="53" rx="2.2" ry="3.2" fill="${k.no}"/></g>
      <path class="mouth" d="M85 64q7 5 14 0" stroke="${k.no}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      ${(k.acc === 'flower' || k.acc === 'hat') && !L.testa ? acc : ''}${L.testa}
    </g>
  </g>
</svg>`;
}

// ---------------------------------------------------------------------
// Maialini dell'Arena: colore libero, forme, facce e decorazioni diverse.
// ---------------------------------------------------------------------
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixC = (a, b, t) => '#' + hex2(a).map((x, i) => Math.round(x + (hex2(b)[i] - x) * t).toString(16).padStart(2, '0')).join('');
const lumC = (h) => { const [r, g, b] = hex2(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
// bx/by/rx/ry = corpo · hx/hy/hs = centro e scala della testa
const SHAPES = {
  n:      { bx: 56, by: 58, rx: 36, ry: 27, hx: 86, hy: 44, hs: 1 },
  grasso: { bx: 54, by: 59, rx: 43, ry: 31, hx: 90, hy: 45, hs: 1 },
  mini:   { bx: 58, by: 68, rx: 27, ry: 20, hx: 82, hy: 44, hs: 1.12 },
  lungo:  { bx: 50, by: 63, rx: 45, ry: 20, hx: 94, hy: 51, hs: 0.9 },
  alto:   { bx: 56, by: 49, rx: 31, ry: 24, hx: 84, hy: 33, hs: 0.95 },
};
function arenaEyes(kind, dark, iris) {
  const D = '#2b1b24';
  const sclera = dark ? '<ellipse cx="79" cy="39" rx="6" ry="7.4" fill="#fff"/><ellipse cx="96" cy="38" rx="6" ry="7.4" fill="#fff"/>' : '';
  const std = `${sclera}<ellipse cx="79" cy="39" rx="4.3" ry="5.8" fill="${D}"/><ellipse cx="96" cy="38" rx="4.3" ry="5.8" fill="${D}"/><circle cx="80.5" cy="36.8" r="1.7" fill="#fff"/><circle cx="97.5" cy="35.8" r="1.7" fill="#fff"/>`;
  const lineCol = dark ? '#fff' : D;
  switch (kind) {
    case 'felici': return `<path d="M73.5 41q5.5-7 11 0M90.5 40q5.5-7 11 0" stroke="${lineCol}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    case 'arrabbiati': return `${std}<path d="M72 30.5l13 5M104 29.5l-13 5" stroke="${lineCol}" stroke-width="3.6" stroke-linecap="round"/>`;
    case 'assonnati': return `<path d="M73.5 39q5.5 5 11 0z M90.5 38q5.5 5 11 0z" fill="${D}" ${dark ? 'stroke="#fff" stroke-width="1.2"' : ''}/><path d="M72.5 38.5h13M89.5 37.5h13" stroke="${lineCol}" stroke-width="2.6" stroke-linecap="round"/>`;
    case 'matti': return `<circle cx="78" cy="38" r="8" fill="#fff" stroke="${D}" stroke-width="1.6"/><circle cx="81" cy="40" r="3.4" fill="${D}"/><circle cx="97" cy="37" r="4.6" fill="#fff" stroke="${D}" stroke-width="1.4"/><circle cx="95.5" cy="35.5" r="2" fill="${D}"/>`;
    case 'ciclope': return `<circle cx="88" cy="36" r="10.5" fill="#fff" stroke="${D}" stroke-width="2"/><circle cx="89" cy="37" r="5.8" fill="${iris}"/><circle cx="89" cy="37" r="2.8" fill="${D}"/><circle cx="91" cy="34" r="1.6" fill="#fff"/><path d="M77 27q11-7 22 0" stroke="${lineCol}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'quattro': {
      const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${D}" stroke-width="1.3"/><circle cx="${x + 0.8}" cy="${y + 0.6}" r="${r * 0.5}" fill="${D}"/><circle cx="${x + 1.6}" cy="${y - 0.8}" r="${r * 0.2}" fill="#fff"/>`;
      return eye(78, 31, 4.6) + eye(95, 30, 4.6) + eye(72, 41, 3.6) + eye(101, 40, 3.6);
    }
    case 'robot': return `<rect x="69" y="31" width="36" height="12" rx="6" fill="#23202b" stroke="#6c7884" stroke-width="2"/><rect x="73" y="35" width="28" height="4" rx="2" fill="#ff4d4d"/><rect x="74" y="35.5" width="8" height="1.6" rx=".8" fill="#ffd0d0"/>`;
    case 'spirale': return `<g fill="#fff" stroke="${D}" stroke-width="1.4"><circle cx="79" cy="38" r="6.4"/><circle cx="96" cy="37" r="6.4"/></g><path d="M79 38m0-1a1 1 0 1 1-1 1 2 2 0 0 1 2-2 3 3 0 0 1 3 3 4 4 0 0 1-4 4M96 37m0-1a1 1 0 1 1-1 1 2 2 0 0 1 2-2 3 3 0 0 1 3 3 4 4 0 0 1-4 4" stroke="${D}" stroke-width="1.3" fill="none"/>`;
    case 'cuori': return `<g fill="#ff3f7a" stroke="#a3123f" stroke-width="1.2"><path d="M79 44l-6-6a3.4 3.4 0 0 1 6-4 3.4 3.4 0 0 1 6 4z"/><path d="M96 43l-6-6a3.4 3.4 0 0 1 6-4 3.4 3.4 0 0 1 6 4z"/></g><g fill="#fff"><circle cx="75.5" cy="36" r="1.1"/><circle cx="92.5" cy="35" r="1.1"/></g>`;
    case 'puntini': return `<circle cx="79" cy="39" r="2.6" fill="${dark ? '#fff' : D}"/><circle cx="96" cy="38" r="2.6" fill="${dark ? '#fff' : D}"/>`;
  }
  return std;
}
function arenaMouth(kind, no) {
  switch (kind) {
    case 'zanne': return `<path d="M85 64q7 5 14 0" stroke="${no}" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M82.5 61l-2.5-9 6 6zM102.5 59.5l2-9-5.5 6z" fill="#fffbea" stroke="#9c8a6a" stroke-width="1.3" stroke-linejoin="round"/>`;
    case 'lingua': return `<path d="M85 62.5q7 8 14 0z" fill="${no}"/><ellipse cx="93" cy="67" rx="4" ry="3.6" fill="#ff6f8f" stroke="${no}" stroke-width="1.2"/>`;
    case 'ghigno': return `<path d="M84 64q9 4 15-4" stroke="${no}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
    case 'o': return `<ellipse cx="92" cy="66" rx="3" ry="3.6" fill="${no}"/>`;
    case 'baffi': return `<path d="M85 66q7 3 14 0" stroke="${no}" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M92 60c-4-3-11-3-15 3 4-1 8 0 11 2 2-1 3-3 4-5zM92 60c4-3 11-3 15 3-4-1-8 0-11 2-2-1-3-3-4-5z" fill="#5a3a22" stroke="#3a2412" stroke-width="1" stroke-linejoin="round"/>`;
    case 'denti': return `<path d="M84 63q8 6 16 0" stroke="${no}" stroke-width="2.4" stroke-linecap="round" fill="none"/><rect x="88.5" y="63.5" width="3.6" height="4.6" rx="1" fill="#fff" stroke="${no}" stroke-width="1"/><rect x="92.4" y="63.5" width="3.6" height="4.6" rx="1" fill="#fff" stroke="${no}" stroke-width="1"/>`;
    case 'broncio': return `<path d="M85 67.5q7-5 14 0" stroke="${no}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
  }
  return `<path d="M85 64q7 5 14 0" stroke="${no}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
}
const AFX = {
  fiamme: '<g class="afx afx-fire"><path d="M14 40c-2-8 4-10 3-17 6 5 9 10 6 17-2 4-8 4-9 0z" fill="#ff7a1c"/><path d="M16 39c0-4 2-5 2-9 3 3 4 6 2 9-1 2-4 2-4 0z" fill="#ffd34d"/><path d="M106 70c-2-7 3-9 2-15 5 4 8 9 5 15-2 3-7 3-7 0z" fill="#ff7a1c"/><path d="M108 69c0-3 2-4 2-7 2 2 3 5 1 7-1 2-3 2-3 0z" fill="#ffd34d"/></g>',
  gocce: '<g class="afx afx-drip" fill="#9b4fe0" stroke="#5b2290" stroke-width="1"><path d="M14 36c3 5 5 8 5 10a5 5 0 0 1-10 0c0-2 2-5 5-10z"/><path d="M112 66c2 4 4 6 4 8a4 4 0 0 1-8 0c0-2 2-4 4-8z"/><path d="M24 14c2 3 3 5 3 6a3 3 0 0 1-6 0c0-1 1-3 3-6z"/></g>',
  stelle: '<g class="afx afx-spark" fill="#ffd34d" stroke="#d48b00" stroke-width="1"><path d="M14 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M114 64l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/><path d="M28 8l1.4 3.4 3.4 1.4-3.4 1.4L28 18l-1.4-3.4-3.4-1.4 3.4-1.4z"/></g>',
  bolle: '<g class="afx afx-bubble" fill="rgba(255,255,255,.55)" stroke="#7ab8e8" stroke-width="1.4"><circle cx="15" cy="34" r="6"/><circle cx="24" cy="18" r="4"/><circle cx="112" cy="68" r="5"/><circle cx="13" cy="32" r="1.6" fill="#fff" stroke="none"/></g>',
  note: '<g class="afx afx-note" fill="#d94f9b"><path d="M14 40V24l10-3v15" stroke="#d94f9b" stroke-width="2" fill="none"/><ellipse cx="11.5" cy="40" rx="3.6" ry="2.8"/><ellipse cx="21.5" cy="36" rx="3.6" ry="2.8"/><path d="M114 60V48" stroke="#d94f9b" stroke-width="2"/><ellipse cx="111.5" cy="60" rx="3.4" ry="2.6"/></g>',
  cuori: '<g class="afx afx-heart" fill="#ff5d9e" stroke="#b02a5a" stroke-width="1"><path d="M16 38l-6-6a3.4 3.4 0 0 1 6-4 3.4 3.4 0 0 1 6 4z"/><path d="M113 66l-4.6-4.6a2.6 2.6 0 0 1 4.6-3 2.6 2.6 0 0 1 4.6 3z"/><path d="M26 14l-3.6-3.6a2 2 0 0 1 3.6-2.4 2 2 0 0 1 3.6 2.4z"/></g>',
  zzz: '<g class="afx afx-zzz" fill="#5a6aa8" font-family="Fredoka, sans-serif" font-weight="700"><text x="108" y="16" font-size="13">z</text><text x="117" y="6" font-size="10">z</text></g>',
};
export function arenaPigSVG(look = {}) {
  const c = look.c || '#ffb6c9', dark = lumC(c) < 0.38;
  const S = SHAPES[look.shape] || SHAPES.n;
  const k = {
    b: c, s: mixC(c, '#1a1020', dark ? 0.5 : 0.48), l: mixC(c, '#1a1020', 0.12), bel: mixC(c, '#ffffff', dark ? 0.18 : 0.4),
    sn: mixC(mixC(c, '#ff8fab', 0.35), '#ffffff', dark ? 0.05 : 0.12), no: mixC(c, '#2b1b24', 0.62), ein: mixC(c, '#ff6f95', 0.45), ch: mixC(c, '#ff6f95', 0.6),
  };
  const iris = mixC(c, '#3fa9e0', 0.6);
  const { bx, by, rx, ry, hx, hy, hs } = S;
  const legTop = by + ry * 0.45, legH = 91 - legTop;
  const lx = [bx - rx * 0.72, bx - rx * 0.36, bx + rx * 0.12, bx + rx * 0.5];
  const leg = (x, fill) => `<rect x="${x.toFixed(1)}" y="${legTop.toFixed(1)}" width="12" height="${legH.toFixed(1)}" rx="5" fill="${fill}" stroke="${k.s}" stroke-width="2.5"/>`;
  const head = `translate(${hx} ${hy}) scale(${hs}) translate(-86 -44)`;
  const neck = `translate(${hx - 86} ${hy - 44})`;
  const id = 'ap' + c.slice(1) + (look.shape || 'n') + (look.pat || '') + (look.body || '');
  const pat = look.pat === 'chiazze'
    ? `<g fill="${mixC(c, '#1a1020', 0.32)}" opacity=".55"><ellipse cx="${bx - rx * 0.4}" cy="${by - ry * 0.25}" rx="${rx * 0.22}" ry="${ry * 0.22}"/><ellipse cx="${bx + rx * 0.25}" cy="${by - ry * 0.45}" rx="${rx * 0.14}" ry="${ry * 0.16}"/><ellipse cx="${bx - rx * 0.05}" cy="${by + ry * 0.3}" rx="${rx * 0.17}" ry="${ry * 0.15}"/></g>`
    : look.pat === 'strisce'
      ? `<g stroke="${mixC(c, '#1a1020', 0.3)}" stroke-width="5" opacity=".5" fill="none" stroke-linecap="round">${[-0.55, -0.2, 0.15, 0.5].map((f) => `<path d="M${bx + rx * f} ${by - ry} q${-rx * 0.12} ${ry} 0 ${ry * 2}"/>`).join('')}</g>`
      : look.pat === 'galassia'
        ? `<g fill="#fff">${[[-0.5, -0.3, 1.6], [-0.1, -0.55, 1.1], [0.3, -0.2, 1.8], [-0.35, 0.2, 1.2], [0.15, 0.3, 1], [0.55, -0.45, 1.2], [-0.7, -0.05, 1]].map(([fx, fy, r]) => `<circle cx="${bx + rx * fx}" cy="${by + ry * fy}" r="${r}"/>`).join('')}<path d="M${bx + rx * 0.05} ${by - ry * 0.05}l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#ffe27a"/></g><ellipse cx="${bx}" cy="${by}" rx="${rx}" ry="${ry * 0.35}" fill="#b98cff" opacity=".22" transform="rotate(-14 ${bx} ${by})"/>`
        : '';
  // parti del corpo: dietro (pinna, ali, mantello) e sopra (guscio)
  const sk = mixC(c, '#1a1020', 0.3);
  const behind = {
    pinna: `<path d="M${bx - rx * 0.25} ${by - ry + 4}Q${bx - rx * 0.05} ${by - ry - 26} ${bx + rx * 0.3} ${by - ry - 22}Q${bx + rx * 0.1} ${by - ry - 6} ${bx + rx * 0.35} ${by - ry + 6}z" fill="${sk}" stroke="${k.s}" stroke-width="2.6" stroke-linejoin="round"/>`,
    ali: `<g fill="#5b2a6e" stroke="#2e1238" stroke-width="2" stroke-linejoin="round"><path d="M${bx - 6} ${by - ry + 8}C${bx - 30} ${by - ry - 20} ${bx - 52} ${by - ry - 10} ${bx - 58} ${by - ry + 6}c8-2 12 2 12 6 4-6 10-6 14-2 2-6 8-8 14-4z"/></g>`,
    aliangelo: `<g fill="#ffffff" stroke="#c9c2d6" stroke-width="2" stroke-linejoin="round"><path d="M${bx - 4} ${by - ry + 8}C${bx - 26} ${by - ry - 22} ${bx - 50} ${by - ry - 16} ${bx - 56} ${by - ry + 2}c6 0 9 3 9 6 5-3 10-2 12 2 4-4 10-4 14 0 2-4 8-6 12-4z"/><path d="M${bx - 44} ${by - ry - 4}q8-2 14 4M${bx - 34} ${by - ry - 10}q8 0 12 8" fill="none"/></g>`,
    mantello: `<path d="M${hx - 26} ${hy + 14}Q${bx - rx - 10} ${by - 4} ${bx - rx - 4} ${by + ry + 4}L${bx + rx * 0.2} ${by + ry - 2}Q${bx} ${by} ${hx - 10} ${hy + 20}z" fill="#b3261e" stroke="#6e130e" stroke-width="2.4" stroke-linejoin="round"/>`,
  }[look.body] || '';
  const above = look.body === 'guscio'
    ? `<path d="M${bx - rx + 4} ${by - 2}Q${bx - rx + 2} ${by - ry - 12} ${bx} ${by - ry - 10}Q${bx + rx - 2} ${by - ry - 12} ${bx + rx - 4} ${by - 2}z" fill="#5a8f3a" stroke="#2f5a1e" stroke-width="2.6" stroke-linejoin="round"/><g fill="none" stroke="#2f5a1e" stroke-width="1.8"><path d="M${bx - rx * 0.4} ${by - 3}l${rx * 0.12} ${-ry * 0.6}h${rx * 0.56}l${rx * 0.12} ${ry * 0.6}"/><path d="M${bx - rx * 0.28} ${by - ry * 0.63}l${-rx * 0.3} ${-ry * 0.2}M${bx + rx * 0.28} ${by - ry * 0.63}l${rx * 0.3} ${-ry * 0.2}M${bx} ${by - ry * 0.63}v${-ry * 0.42}"/></g>`
    : '';
  const L = { testa: LOOKS[look.testa] || '', occhi: LOOKS[look.occhi] || '', collo: LOOKS[look.collo] || '' };
  return `<svg class="pig-svg apig shape-${look.shape || 'n'}" viewBox="-4 -14 132 118" aria-hidden="true">
  <defs><clipPath id="${id}"><ellipse cx="${bx}" cy="${by}" rx="${rx}" ry="${ry}"/></clipPath></defs>
  ${AFX[look.fx] || ''}
  <ellipse class="shadow" cx="${bx + 4}" cy="96" rx="${rx + 8}" ry="5.5" fill="#000" opacity=".18"/>
  <g class="body-g">
    <path class="tail" d="M${bx - rx + 4} ${by - 6}c-9-1-12-9-6-12 6-2 7 6 1 7" fill="none" stroke="${k.s}" stroke-width="3.2" stroke-linecap="round"/>
    ${behind}
    ${leg(lx[0], k.l)}${leg(lx[1], k.l)}
    <ellipse cx="${bx}" cy="${by}" rx="${rx}" ry="${ry}" fill="${k.b}" stroke="${k.s}" stroke-width="3"/>
    <g clip-path="url(#${id})">${pat}<ellipse cx="${bx - 2}" cy="${by + ry * 0.45}" rx="${rx * 0.66}" ry="${ry * 0.45}" fill="${k.bel}" opacity=".7"/></g>
    <path d="M${bx - rx * 0.55} ${by - ry * 0.55}c6-6 16-8 24-7" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity="${dark ? 0.25 : 0.45}"/>
    ${above}
    ${leg(lx[2], k.b)}${leg(lx[3], k.b)}
    <g transform="${neck}">${L.collo}</g>
    <g class="head" transform="${head}">
      <path class="ear ear-l" d="M70 28L64 8l17 12z" fill="${k.b}" stroke="${k.s}" stroke-width="2.6" stroke-linejoin="round"/>
      <path class="ear ear-r" d="M95 22l12-14-2 22z" fill="${k.b}" stroke="${k.s}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M69 24l-3-10 9 6zM98 21l6-7-1 11z" fill="${k.ein}"/>
      <circle cx="86" cy="44" r="25" fill="${k.b}" stroke="${k.s}" stroke-width="3"/>
      <g class="eyes">${arenaEyes(look.eyes, dark, iris)}</g>${L.occhi}
      <ellipse cx="72" cy="53" rx="5" ry="3.2" fill="${k.ch}" opacity=".5"/><ellipse cx="104" cy="51" rx="4.5" ry="3" fill="${k.ch}" opacity=".5"/>
      <g class="snout"><ellipse cx="93" cy="53" rx="11.5" ry="8.5" fill="${k.sn}" stroke="${k.s}" stroke-width="2.6"/>
        <ellipse cx="89" cy="53" rx="2.2" ry="3.2" fill="${k.no}"/><ellipse cx="97.5" cy="53" rx="2.2" ry="3.2" fill="${k.no}"/></g>
      ${arenaMouth(look.mouth, k.no)}
      ${L.testa}
    </g>
  </g>
</svg>`;
}

export const ICONS = {
  diary: '<svg viewBox="0 0 24 24"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5z" fill="#8b5cd6" stroke="#5b3a9e" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v4H7.5A2.5 2.5 0 0 1 5 20.5z" fill="#fff" stroke="#5b3a9e" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2v7l-2-1.5L10 9V2z" fill="#ffcc33" stroke="#b97f00" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  stats: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="5" height="10" rx="1.5" fill="#ec4a3f"/><rect x="9.5" y="4" width="5" height="17" rx="1.5" fill="#ffb02e"/><rect x="16" y="8" width="5" height="13" rx="1.5" fill="#4fae4c"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
};

export const use = (id, cls = '') => `<svg class="ico ${cls}" aria-hidden="true"><use href="#s-${id}"/></svg>`;
