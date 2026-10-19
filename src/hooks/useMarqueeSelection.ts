import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type KeyboardEvent } from "react";

type Point = { x: number; y: number };
type Rectangle = Point & { width: number; height: number };
type Drag = {
  pointerId: number;
  origin: Point;
  start: Point;
  pointer: Point;
  initial: string[];
  additive: boolean;
  active: boolean;
};

export function useMarqueeSelection({ ids, selected, onChange, scope }: {
  ids: string[];
  selected: string[];
  onChange: (ids: string[]) => void;
  scope: string;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const anchorRef = useRef<string | null>(null);
  const pointerTypeRef = useRef("");
  const suppressClickRef = useRef(false);
  const optionsRef = useRef({ ids, selected, onChange });
  optionsRef.current = { ids, selected, onChange };
  const [marquee, setMarquee] = useState<Rectangle | null>(null);

  useEffect(() => {
    dragRef.current = null;
    anchorRef.current = null;
    setMarquee(null);
  }, [scope]);

  useEffect(() => {
    let frame = 0;
    let lastFrame = 0;

    const update = () => {
      const drag = dragRef.current;
      const area = areaRef.current;
      if (!drag?.active || !area) return;
      const bounds = area.getBoundingClientRect();
      const x = Math.max(0, Math.min(area.clientWidth, drag.pointer.x - bounds.left)) + area.scrollLeft;
      const y = Math.max(0, Math.min(area.clientHeight, drag.pointer.y - bounds.top)) + area.scrollTop;
      const rectangle = {
        x: Math.min(drag.origin.x, x),
        y: Math.min(drag.origin.y, y),
        width: Math.abs(x - drag.origin.x),
        height: Math.abs(y - drag.origin.y),
      };
      setMarquee((current) => current && current.x === rectangle.x && current.y === rectangle.y
        && current.width === rectangle.width && current.height === rectangle.height ? current : rectangle);

      const hits: string[] = [];
      const available = new Set(optionsRef.current.ids);
      area.querySelectorAll<HTMLButtonElement>("[data-selection-id]").forEach((tile) => {
        const id = tile.dataset.selectionId!;
        if (tile.disabled || !available.has(id)) return;
        const tileBounds = tile.getBoundingClientRect();
        const left = tileBounds.left - bounds.left + area.scrollLeft;
        const top = tileBounds.top - bounds.top + area.scrollTop;
        if (left < rectangle.x + rectangle.width && left + tileBounds.width > rectangle.x
          && top < rectangle.y + rectangle.height && top + tileBounds.height > rectangle.y) hits.push(id);
      });
      const next = [...new Set([...(drag.additive ? drag.initial : []), ...hits])];
      const current = optionsRef.current.selected;
      if (next.length !== current.length || next.some((id) => !current.includes(id))) {
        optionsRef.current.onChange(next);
      }
    };

    const tick = (time: number) => {
      frame = 0;
      const drag = dragRef.current;
      const area = areaRef.current;
      if (!drag?.active || !area) return;
      const elapsed = lastFrame ? Math.min(time - lastFrame, 32) : 16;
      lastFrame = time;
      const bounds = area.getBoundingClientRect();
      const edge = Math.min(48, area.clientHeight / 4);
      const y = drag.pointer.y - bounds.top;
      const speed = y < edge ? -Math.min(1, (edge - y) / edge)
        : y > area.clientHeight - edge ? Math.min(1, (y - area.clientHeight + edge) / edge) : 0;
      if (speed) area.scrollTop += speed * elapsed * .8;
      update();
      frame = requestAnimationFrame(tick);
    };

    const move = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.pointer = { x: event.clientX, y: event.clientY };
      if (!drag.active && Math.hypot(event.clientX - drag.start.x, event.clientY - drag.start.y) < 5) return;
      if (!drag.active) areaRef.current?.setPointerCapture(event.pointerId);
      drag.active = true;
      suppressClickRef.current = true;
      event.preventDefault();
      window.getSelection()?.removeAllRanges();
      update();
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const finish = (cancelled: boolean) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.active) {
        if (cancelled) optionsRef.current.onChange(drag.initial);
        else update();
      }
      dragRef.current = null;
      const area = areaRef.current;
      if (area?.hasPointerCapture(drag.pointerId)) area.releasePointerCapture(drag.pointerId);
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      setMarquee(null);
    };
    const up = (event: globalThis.PointerEvent) => {
      if (event.pointerId === dragRef.current?.pointerId) finish(false);
    };
    const cancel = () => finish(true);
    const preventNativeSelection = (event: Event) => {
      if (dragRef.current || areaRef.current?.contains(event.target as Node)) event.preventDefault();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && dragRef.current?.active) {
        event.preventDefault();
        cancel();
      }
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", escape);
    window.addEventListener("selectstart", preventNativeSelection);
    window.addEventListener("dragstart", preventNativeSelection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("selectstart", preventNativeSelection);
      window.removeEventListener("dragstart", preventNativeSelection);
    };
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerTypeRef.current = event.pointerType;
    suppressClickRef.current = false;
    // Touch keeps native scrolling and tap-to-toggle selection.
    if (event.pointerType !== "mouse" || event.button !== 0 || !event.isPrimary) return;
    const area = event.currentTarget;
    const bounds = area.getBoundingClientRect();
    if (event.clientX >= bounds.left + area.clientWidth || event.clientY >= bounds.top + area.clientHeight) return;
    if ((event.target as HTMLElement).closest("button:disabled")) return;
    // Stop native text selection at mouse-down, before the drag threshold.
    event.preventDefault();
    ((event.target as HTMLElement).closest<HTMLButtonElement>("[data-selection-id]") ?? area).focus({ preventScroll: true });
    dragRef.current = {
      pointerId: event.pointerId,
      origin: { x: event.clientX - bounds.left + area.scrollLeft, y: event.clientY - bounds.top + area.scrollTop },
      start: { x: event.clientX, y: event.clientY },
      pointer: { x: event.clientX, y: event.clientY },
      initial: [...selected],
      additive: event.ctrlKey || event.metaKey || event.shiftKey,
      active: false,
    };
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
    } else if (!(event.target as HTMLElement).closest("[data-selection-id]")
      && !event.ctrlKey && !event.metaKey && !event.shiftKey) onChange([]);
  };

  const onItemClick = (event: MouseEvent<HTMLButtonElement>, id: string) => {
    const additive = event.ctrlKey || event.metaKey;
    const anchor = anchorRef.current;
    if (event.shiftKey && anchor && ids.includes(anchor)) {
      const start = ids.indexOf(anchor);
      const end = ids.indexOf(id);
      const range = ids.slice(Math.min(start, end), Math.max(start, end) + 1);
      onChange([...new Set([...(additive ? selected : []), ...range])]);
    } else {
      // Keyboard activation and touch taps preserve the button's toggle behavior.
      const toggle = additive || event.detail === 0 || pointerTypeRef.current === "touch";
      onChange(toggle ? selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] : [id]);
      anchorRef.current = id;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      onChange([...new Set(ids)]);
    }
  };

  return {
    areaRef, marquee, onItemClick,
    areaProps: { onPointerDownCapture: onPointerDown, onClickCapture, onDoubleClickCapture: onClickCapture, onKeyDown },
  };
}
