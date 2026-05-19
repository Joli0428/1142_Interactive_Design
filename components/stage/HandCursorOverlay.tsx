"use client";

type Props = {
  ratioX: number;
  ratioY: number;
  visible: boolean;
  pinching?: boolean;
};

/** 全螢幕拇指游標預覽（按鈕流程／教學用） */
export function HandCursorOverlay({
  ratioX,
  ratioY,
  visible,
  pinching = false,
}: Props) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${ratioX * 100}%`,
          top: `${ratioY * 100}%`,
        }}
      >
        {pinching ? <PinchingDot /> : <PreviewRings />}
      </div>
    </div>
  );
}

function PreviewRings() {
  return (
    <>
      <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/20" />
      <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-amber-400/40" />
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
    </>
  );
}

function PinchingDot() {
  return (
    <div className="h-5 w-5 rounded-full border-2 border-white/90 bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.85)]" />
  );
}
