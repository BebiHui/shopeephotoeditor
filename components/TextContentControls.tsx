'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { Slider } from './ui/Slider';
import { ColorPickerInline } from './ui/ColorPickerInline';
import { TEXT_PRESETS, type TextPresetKey, type FontWeightOption, type TextAlign, type TextStyle, type BoxStyle } from '@/lib/types';
import { FONT_LIST, fontFamilyCss, type FontFamily } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

/* ─────────── Reusable disclosures + style sub-panels ─────────── */

function Disclosure({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-xs font-medium text-gray-800">{title}</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>
      {open && <div className="space-y-3 border-t border-gray-100 px-3 py-3">{children}</div>}
    </div>
  );
}

function FontFamilySelect({
  value,
  onChange,
}: {
  value: FontFamily;
  onChange: (v: FontFamily) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-700">Font family</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FontFamily)}
        className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
        style={{ fontFamily: fontFamilyCss(value) }}
      >
        {FONT_LIST.map((f) => (
          <option
            key={f.family}
            value={f.family}
            style={{ fontFamily: fontFamilyCss(f.family) }}
          >
            {f.family} — {f.category}
          </option>
        ))}
      </select>
    </div>
  );
}

function FontWeightSelect({
  value,
  onChange,
}: {
  value: FontWeightOption;
  onChange: (v: FontWeightOption) => void;
}) {
  const opts: FontWeightOption[] = [400, 500, 600, 700, 800, 900];
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-700">Font weight</label>
      <div className="grid grid-cols-3 gap-1">
        {opts.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={cn(
              'rounded-md border py-1 text-xs',
              value === w
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

function AlignSelect({
  value,
  onChange,
}: {
  value: TextAlign;
  onChange: (v: TextAlign) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-700">Text align</label>
      <div className="grid grid-cols-3 gap-1">
        {(['left', 'center', 'right'] as TextAlign[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={cn(
              'rounded-md border py-1 text-xs capitalize',
              value === a
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

function StyleEditor({
  style,
  onPatch,
  fontSizeMin = 12,
  fontSizeMax = 240,
}: {
  style: TextStyle;
  onPatch: (patch: Partial<TextStyle>) => void;
  fontSizeMin?: number;
  fontSizeMax?: number;
}) {
  return (
    <>
      <Disclosure title="Typography" defaultOpen>
        <FontFamilySelect value={style.fontFamily} onChange={(v) => onPatch({ fontFamily: v })} />
        <FontWeightSelect value={style.fontWeight} onChange={(v) => onPatch({ fontWeight: v })} />
        <Slider
          label="Font size"
          value={style.fontSize}
          min={fontSizeMin}
          max={fontSizeMax}
          onChange={(v) => onPatch({ fontSize: v })}
          unit="px"
        />
        <Slider
          label="Letter spacing"
          value={style.letterSpacing}
          min={-4}
          max={20}
          step={0.5}
          onChange={(v) => onPatch({ letterSpacing: v })}
          unit="px"
        />
        <Slider
          label="Line height"
          value={Math.round(style.lineHeight * 100)}
          min={80}
          max={200}
          onChange={(v) => onPatch({ lineHeight: v / 100 })}
          unit="%"
        />
        <AlignSelect value={style.textAlign} onChange={(v) => onPatch({ textAlign: v })} />
        <Slider
          label="Opacity"
          value={Math.round(style.opacity * 100)}
          min={20}
          max={100}
          onChange={(v) => onPatch({ opacity: v / 100 })}
          unit="%"
        />
      </Disclosure>

      <Disclosure title="Color & outline" defaultOpen>
        <ColorPickerInline
          label="Text color"
          value={style.color}
          onChange={(v) => onPatch({ color: v })}
        />
        <ColorPickerInline
          label="Outline color"
          value={style.outlineColor}
          onChange={(v) => onPatch({ outlineColor: v })}
        />
        <Slider
          label="Outline width"
          value={style.outlineWidth}
          min={0}
          max={20}
          step={0.5}
          onChange={(v) => onPatch({ outlineWidth: v })}
          unit="px"
        />
      </Disclosure>

      <Disclosure title="Shadow">
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={style.shadowEnabled}
            onChange={(e) => onPatch({ shadowEnabled: e.target.checked })}
            className="h-3.5 w-3.5 accent-brand-500"
          />
          Aktifkan shadow
        </label>
        {style.shadowEnabled && (
          <>
            <ColorPickerInline
              label="Shadow color"
              value={style.shadowColor}
              onChange={(v) => onPatch({ shadowColor: v })}
            />
            <Slider
              label="Blur"
              value={style.shadowBlur}
              min={0}
              max={40}
              onChange={(v) => onPatch({ shadowBlur: v })}
              unit="px"
            />
            <Slider
              label="Offset X"
              value={style.shadowOffsetX}
              min={-20}
              max={20}
              onChange={(v) => onPatch({ shadowOffsetX: v })}
              unit="px"
            />
            <Slider
              label="Offset Y"
              value={style.shadowOffsetY}
              min={-20}
              max={20}
              onChange={(v) => onPatch({ shadowOffsetY: v })}
              unit="px"
            />
          </>
        )}
      </Disclosure>
    </>
  );
}

function BackgroundEditor({
  bg,
  onPatch,
  title = 'Background box',
}: {
  bg: BoxStyle;
  onPatch: (patch: Partial<BoxStyle>) => void;
  title?: string;
}) {
  return (
    <Disclosure title={title}>
      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={bg.enabled}
          onChange={(e) => onPatch({ enabled: e.target.checked })}
          className="h-3.5 w-3.5 accent-brand-500"
        />
        Aktifkan box background
      </label>
      {bg.enabled && (
        <>
          <ColorPickerInline label="Box color" value={bg.color} onChange={(v) => onPatch({ color: v })} />
          <Slider
            label="Opacity"
            value={Math.round(bg.opacity * 100)}
            min={20}
            max={100}
            onChange={(v) => onPatch({ opacity: v / 100 })}
            unit="%"
          />
          <Slider
            label="Padding"
            value={bg.padding}
            min={0}
            max={40}
            onChange={(v) => onPatch({ padding: v })}
            unit="px"
          />
          <Slider
            label="Border radius"
            value={bg.borderRadius}
            min={0}
            max={40}
            onChange={(v) => onPatch({ borderRadius: v })}
            unit="px"
          />
        </>
      )}
    </Disclosure>
  );
}

/* ─────────── Per-tab panels ─────────── */

function TitlePanel() {
  const t = useEditorStore((s) => s.textContent.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const setStyle = useEditorStore((s) => s.setTitleStyle);
  const setBg = useEditorStore((s) => s.setTitleBackground);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={t.enabled}
            onChange={(e) => setTitle({ enabled: e.target.checked })}
            className="h-4 w-4 accent-brand-500"
          />
          Tampilkan Judul Produk
        </label>
      </div>
      <textarea
        value={t.text}
        onChange={(e) => setTitle({ text: e.target.value })}
        placeholder="Contoh:&#10;COVER LAMPU REM"
        rows={2}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      <Disclosure title="Position">
        <Slider label="Margin top" value={t.marginTopPx} min={0} max={400} onChange={(v) => setTitle({ marginTopPx: v })} unit="px" />
        <Slider label="Margin left" value={t.marginLeftPx} min={0} max={400} onChange={(v) => setTitle({ marginLeftPx: v })} unit="px" />
        <Slider label="Max width" value={t.maxWidthPx} min={200} max={1000} onChange={(v) => setTitle({ maxWidthPx: v })} unit="px" />
      </Disclosure>
      <StyleEditor style={t.style} onPatch={setStyle} fontSizeMin={32} fontSizeMax={200} />
      <BackgroundEditor bg={t.background} onPatch={setBg} />
    </div>
  );
}

function CodePanel() {
  const c = useEditorStore((s) => s.textContent.code);
  const setCode = useEditorStore((s) => s.setCode);
  const setStyle = useEditorStore((s) => s.setCodeStyle);
  const setLabelStyle = useEditorStore((s) => s.setLabelStyle);
  const setLabelBg = useEditorStore((s) => s.setLabelBackground);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={c.enabled}
            onChange={(e) => setCode({ enabled: e.target.checked })}
            className="h-4 w-4 accent-brand-500"
          />
          Tampilkan Kode Produk
        </label>
      </div>
      <input
        type="text"
        value={c.text}
        onChange={(e) => setCode({ text: e.target.value })}
        placeholder="Contoh: KVB"
        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-brand-500 focus:outline-none"
      />
      <p className="text-[11px] text-gray-500">
        Akan ditampilkan sebagai <code className="rounded bg-gray-100 px-1">KODE {c.text || '...'}</code>.
      </p>
      <Disclosure title="Position">
        <Slider label="Margin top" value={c.marginTopPx} min={0} max={800} onChange={(v) => setCode({ marginTopPx: v })} unit="px" />
        <Slider label="Margin left" value={c.marginLeftPx} min={0} max={400} onChange={(v) => setCode({ marginLeftPx: v })} unit="px" />
      </Disclosure>
      <StyleEditor style={c.style} onPatch={setStyle} fontSizeMin={28} fontSizeMax={160} />

      {/* ORIGINAL 100% label */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={c.labelEnabled}
            onChange={(e) => setCode({ labelEnabled: e.target.checked })}
            className="h-4 w-4 accent-brand-500"
          />
          Tampilkan label (default: <span className="font-mono">ORIGINAL 100%</span>)
        </label>
        {c.labelEnabled && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={c.labelText}
              onChange={(e) => setCode({ labelText: e.target.value })}
              className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
              placeholder="ORIGINAL 100%"
            />
            <Slider
              label="Gap kode → label"
              value={c.labelGapPx}
              min={0}
              max={80}
              onChange={(v) => setCode({ labelGapPx: v })}
              unit="px"
            />
            <Disclosure title="Label style" defaultOpen>
              <FontFamilySelect
                value={c.labelStyle.fontFamily}
                onChange={(v) => setLabelStyle({ fontFamily: v })}
              />
              <Slider
                label="Font size"
                value={c.labelStyle.fontSize}
                min={14}
                max={80}
                onChange={(v) => setLabelStyle({ fontSize: v })}
                unit="px"
              />
              <ColorPickerInline
                label="Text color"
                value={c.labelStyle.color}
                onChange={(v) => setLabelStyle({ color: v })}
              />
            </Disclosure>
            <BackgroundEditor bg={c.labelBackground} onPatch={setLabelBg} title="Label background (badge)" />
          </div>
        )}
      </div>
    </div>
  );
}

function FitmentPanel() {
  const f = useEditorStore((s) => s.textContent.fitment);
  const setFitment = useEditorStore((s) => s.setFitment);
  const setStyle = useEditorStore((s) => s.setFitmentStyle);
  const setBg = useEditorStore((s) => s.setFitmentBackground);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.enabled}
            onChange={(e) => setFitment({ enabled: e.target.checked })}
            className="h-4 w-4 accent-brand-500"
          />
          Tampilkan Peruntukan Motor
        </label>
      </div>
      <textarea
        value={f.text}
        onChange={(e) => setFitment({ text: e.target.value })}
        placeholder={'Satu motor per baris, contoh:\nADV 150 (2019 - 2022)\nPCX 125 CBU (2010 - 2012)\nPCX 150 K97 (2018 - 2020)\nVario 125 K60 (2015 - 2017)'}
        rows={5}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none"
      />
      <Disclosure title="Position & box size">
        <Slider label="Margin bottom" value={f.marginBottomPx} min={0} max={400} onChange={(v) => setFitment({ marginBottomPx: v })} unit="px" />
        <Slider label="Margin left" value={f.marginLeftPx} min={0} max={400} onChange={(v) => setFitment({ marginLeftPx: v })} unit="px" />
        <Slider label="Max width" value={f.maxWidthPx} min={200} max={1000} onChange={(v) => setFitment({ maxWidthPx: v })} unit="px" />
        <Slider label="Max height (auto-fit)" value={f.maxHeightPx} min={0} max={800} onChange={(v) => setFitment({ maxHeightPx: v })} unit="px" />
        <p className="text-[11px] text-gray-500">
          Set Max height = 0 untuk nonaktifkan auto-shrink. Kalau diset, font otomatis diperkecil agar list tetap muat.
        </p>
      </Disclosure>
      <StyleEditor style={f.style} onPatch={setStyle} fontSizeMin={16} fontSizeMax={80} />
      <BackgroundEditor bg={f.background} onPatch={setBg} />
    </div>
  );
}

/* ─────────── Live CSS preview (instant feedback while editing) ─────────── */

function LivePreview() {
  const tc = useEditorStore((s) => s.textContent);
  const canvasSize = useEditorStore((s) => s.canvasConfig.size);

  const previewPx = 280;
  const k = previewPx / 1024;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Live preview</span>
        <span className="text-[10px] text-gray-400">{canvasSize}×{canvasSize}</span>
      </div>
      <div
        className="relative mx-auto overflow-hidden rounded-md border border-gray-200 bg-white"
        style={{ width: previewPx, height: previewPx }}
      >
        <div className="absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray-100 ring-1 ring-gray-200" />

        {/* Title */}
        {tc.title.enabled && tc.title.text && (
          <PreviewText
            text={tc.title.text}
            style={tc.title.style}
            bg={tc.title.background}
            posStyle={{
              top: tc.title.marginTopPx * k,
              left: tc.title.marginLeftPx * k,
              maxWidth: tc.title.maxWidthPx * k,
            }}
            k={k}
          />
        )}

        {/* Code + label */}
        {tc.code.enabled && tc.code.text && (
          <div
            className="absolute"
            style={{
              top: tc.code.marginTopPx * k,
              left: tc.code.marginLeftPx * k,
            }}
          >
            <PreviewText
              text={`KODE ${tc.code.text}`}
              style={tc.code.style}
              k={k}
              wrapperStyle={{ position: 'static' }}
            />
            {tc.code.labelEnabled && tc.code.labelText && (
              <div style={{ marginTop: tc.code.labelGapPx * k }}>
                <PreviewText
                  text={tc.code.labelText}
                  style={tc.code.labelStyle}
                  bg={tc.code.labelBackground}
                  k={k}
                  wrapperStyle={{ position: 'static', display: 'inline-block' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Fitment */}
        {tc.fitment.enabled && tc.fitment.text && (
          <PreviewText
            text={tc.fitment.text}
            style={tc.fitment.style}
            bg={tc.fitment.background}
            posStyle={{
              bottom: tc.fitment.marginBottomPx * k,
              left: tc.fitment.marginLeftPx * k,
              maxWidth: tc.fitment.maxWidthPx * k,
              maxHeight: tc.fitment.maxHeightPx > 0 ? tc.fitment.maxHeightPx * k : undefined,
            }}
            k={k}
            preserveLines
          />
        )}
      </div>
    </div>
  );
}

function PreviewText({
  text,
  style,
  bg,
  posStyle,
  wrapperStyle,
  k,
  preserveLines,
}: {
  text: string;
  style: TextStyle;
  bg?: BoxStyle;
  posStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  k: number;
  preserveLines?: boolean;
}) {
  const padding = bg?.enabled ? bg.padding * k : 0;
  const radius = bg?.enabled ? bg.borderRadius * k : 0;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    ...posStyle,
    ...wrapperStyle,
    padding,
    borderRadius: radius,
    backgroundColor: bg?.enabled
      ? hexWithAlpha(bg.color, bg.opacity)
      : undefined,
  };

  const textStyle: React.CSSProperties = {
    fontFamily: fontFamilyCss(style.fontFamily),
    fontSize: style.fontSize * k,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: `${style.letterSpacing * k}px`,
    color: style.color,
    textAlign: style.textAlign,
    opacity: style.opacity,
    WebkitTextStrokeWidth: `${style.outlineWidth * k}px`,
    WebkitTextStrokeColor: style.outlineColor,
    whiteSpace: preserveLines ? 'pre-line' : 'normal',
    wordBreak: 'break-word',
    textShadow: style.shadowEnabled
      ? `${style.shadowOffsetX * k}px ${style.shadowOffsetY * k}px ${style.shadowBlur * k}px ${style.shadowColor}`
      : undefined,
    margin: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={textStyle}>{text}</div>
    </div>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/* ─────────── Top-level component ─────────── */

export function TextContentControls() {
  const [tab, setTab] = useState<'title' | 'code' | 'fitment'>('title');
  const applyPreset = useEditorStore((s) => s.applyTextPreset);

  return (
    <div className="space-y-4">
      {/* Style presets */}
      <div>
        <h4 className="mb-1 text-sm font-medium text-gray-900">Preset gaya teks</h4>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key as TextPresetKey)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <div className="text-xs font-medium text-gray-900">{p.label}</div>
              <div className="mt-0.5 text-[10px] text-gray-500">{p.description}</div>
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-gray-400">
          Preset menimpa style font/warna. Anda tetap bisa edit manual setelahnya.
        </p>
      </div>

      <LivePreview />

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        {[
          { k: 'title', label: 'Judul' },
          { k: 'code', label: 'Kode' },
          { k: 'fitment', label: 'Peruntukan' },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k as typeof tab)}
            className={cn(
              'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
              tab === t.k
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'title' && <TitlePanel />}
      {tab === 'code' && <CodePanel />}
      {tab === 'fitment' && <FitmentPanel />}
    </div>
  );
}
