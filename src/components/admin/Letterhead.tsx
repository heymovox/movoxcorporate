/**
 * MovoX letterhead — reproduced from "MovoX Letterhead copy.pdf".
 *
 *   Header  MovoX / BEYOND DIGITAL logo (left)
 *           8M, TB Link Road,
 *           Near Thirupathi Gounder Mahal,
 *           Oldpet, Krishnagiri – 635001.
 *           +91 9500621262                                   (right)
 *           ─────────────── blue rule
 *   Body    content
 *   Footer  ─────────────── blue rule
 *           www.heymovox.com                       info@heymovox.com
 *
 * A large, faint "X" watermark sits behind the page content, as in the source.
 */

export const LETTERHEAD = {
  address: [
    '8M, TB Link Road,',
    'Near Thirupathi Gounder Mahal,',
    'Oldpet, Krishnagiri – 635001.',
  ],
  phone: '+91 9500621262',
  website: 'www.heymovox.com',
  email: 'info@heymovox.com',
  brand: '#2382b8',
} as const;

export function LetterheadHeader({ print = false }: { print?: boolean }) {
  const block = (
    <>
      <img
        src="/images/brand/logo-dark.png"
        alt="MovoX — Beyond Digital"
        className="h-14 w-auto object-contain"
      />
      <div className="shrink-0 text-right text-[10.5px] leading-[1.5] text-slate-700">
        {LETTERHEAD.address.map(line => (
          <p key={line}>{line}</p>
        ))}
        <p className="font-bold text-ink">{LETTERHEAD.phone}</p>
      </div>
    </>
  );

  // `print` renders the fixed, page-repeating variant used in printed output.
  // The default renders the in-flow copy shown on screen.
  if (print) {
    return (
      <header className="print-lh-header flex items-start justify-between gap-8 border-b-2 border-[#2382b8] pb-3 print-hide">
        {block}
      </header>
    );
  }

  return (
    <header className="flex items-start justify-between gap-8 border-b-2 border-[#2382b8] pb-3 print-hide">
      {block}
    </header>
  );
}

export function LetterheadFooter({ print = false }: { print?: boolean }) {
  const block = (
    <>
      <span>{LETTERHEAD.website}</span>
      <span>{LETTERHEAD.email}</span>
    </>
  );

  if (print) {
    return (
      <footer className="print-lh-footer flex items-center justify-between border-t border-[#2382b8] pt-2 text-[10.5px] text-slate-700 print-hide">
        {block}
      </footer>
    );
  }

  return (
    <footer className="mt-8 flex items-center justify-between border-t border-[#2382b8] pt-2 text-[10.5px] text-slate-700 print-hide">
      {block}
    </footer>
  );
}

/**
 * The page watermark. Rendered absolutely behind the content so it repeats on
 * every printed page — put it inside a `relative` page container.
 */
export function LetterheadWatermark() {
  return (
    <div
      data-lh-watermark
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center print:opacity-100"
    >
      <span className="select-none text-[38rem] font-black leading-none text-[#2382b8]/[0.05]">
        X
      </span>
    </div>
  );
}