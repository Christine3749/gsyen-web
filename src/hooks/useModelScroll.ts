import { useRef } from 'react';

export function useModelScroll() {
  const modelScrollRef = useRef<HTMLDivElement>(null);
  const isDragging     = useRef(false);
  const dragStartX     = useRef(0);
  const dragScrollLeft = useRef(0);

  const onMsDragStart = (e: React.MouseEvent) => {
    const el = modelScrollRef.current; if (!el) return;
    isDragging.current    = true;
    dragStartX.current    = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };

  const onMsDragMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !modelScrollRef.current) return;
    e.preventDefault();
    modelScrollRef.current.scrollLeft =
      dragScrollLeft.current - (e.pageX - modelScrollRef.current.offsetLeft - dragStartX.current);
  };

  const onMsDragEnd = () => {
    isDragging.current = false;
    if (modelScrollRef.current) modelScrollRef.current.style.cursor = 'grab';
  };

  return { modelScrollRef, onMsDragStart, onMsDragMove, onMsDragEnd };
}
