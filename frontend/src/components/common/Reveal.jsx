import React, { useEffect, useRef, useState } from 'react';

// Wraps content so it fades/slides into view the moment it scrolls into the
// viewport, instead of only animating once on initial mount. Falls back to
// showing content immediately if IntersectionObserver isn't available.
export default function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${className} ${visible ? 'animate-slide-up' : 'opacity-0'}`}
      style={visible && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
