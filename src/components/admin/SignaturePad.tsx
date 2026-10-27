/**
 * Signature drawing pad.
 *
 * Opens as a modal, captures a drawn signature on a canvas (mouse, pen and
 * touch), and returns it as a trimmed PNG data URL on submit.
 *
 * Export is trimmed to the ink bounds so a signature drawn in a corner still
 * renders tight in the document, then scaled down to keep the stored value
 * small.
 */
import { useRef, useState, useEffect, useCallback, type PointerEvent } from 'react';
import { Eraser, PenLine, Check, X, Loader2 } from 'lucide-react';
import { Modal } from './ui';

const MAX_WIDTH = 520;

export default function SignaturePad({
  open,
  onClose,
  onSubmit,
  title = 'Draw signature',
  hint,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (dataUrl: string, signedAtIso: string) => void | Promise<void>;
  title?: string;
  hint?: string;
  busy?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // Reset whenever the pad is (re)opened.
  useEffect(() => {
    if (!open) return;
    setHasInk(false);
    drawing.current = false;
    last.current = null;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, [open]);

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    c.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
    // dot so a simple tap still registers
    ctx.beginPath();
    ctx.arc(last.current.x, last.current.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    setHasInk(true);
  };

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const up = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    drawing.current = false;
    last.current = null;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const clear = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }, []);

  /** Trim transparent margins, then downscale to MAX_WIDTH. */
  const toTrimmedDataUrl = (): string | null => {
    const src = canvasRef.current;
    const sctx = src?.getContext('2d');
    if (!src || !sctx) return null;

    const { width: w, height: h } = src;
    const data = sctx.getImageData(0, 0, w, h).data;

    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] !== 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) return null;

    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);

    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;

    const out = document.createElement('canvas');
    out.width = cw;
    out.height = ch;
    const octx = out.getContext('2d');
    if (!octx) return null;
    octx.drawImage(src, minX, minY, cw, ch, 0, 0, cw, ch);

    if (cw > MAX_WIDTH) {
      out.width = MAX_WIDTH;
      out.height = Math.max(1, Math.round((ch / cw) * MAX_WIDTH));
    }

    return out.toDataURL('image/png');
  };

  const submit = async () => {
    const url = toTrimmedDataUrl();
    if (!url) return;
    await onSubmit(url, new Date().toISOString());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" onClick={clear} disabled={!hasInk} className="btn btn-secondary btn-sm">
            <Eraser className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!hasInk || busy}
            className="btn btn-primary btn-sm"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            Submit signature
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-slate-600">
        {hint ?? 'Sign inside the box using a mouse, stylus, or finger.'}
      </p>

      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          width={900}
          height={260}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="h-[200px] w-full cursor-crosshair touch-none"
          aria-label="Signature drawing area"
        />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
        {hasInk
          ? 'Signature captured. Press Submit to place it on the agreement.'
          : 'Waiting for a signature…'}
      </p>
    </Modal>
  );
}