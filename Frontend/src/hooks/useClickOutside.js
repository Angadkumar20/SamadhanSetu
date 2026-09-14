import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside a referenced element.
 * @param {Function} handler - Function to call on outside click.
 * @param {boolean} active - Enable/disable listener.
 */
export function useClickOutside(handler, active = true) {
  const domNode = useRef(null);

  useEffect(() => {
    if (!active) return;

    const maybeHandler = (event) => {
      if (domNode.current && !domNode.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', maybeHandler);
    document.addEventListener('touchstart', maybeHandler);

    return () => {
      document.removeEventListener('mousedown', maybeHandler);
      document.removeEventListener('touchstart', maybeHandler);
    };
  }, [handler, active]);

  return domNode;
}

export default useClickOutside;
