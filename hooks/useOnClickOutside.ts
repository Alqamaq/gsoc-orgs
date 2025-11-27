import { useEffect, RefObject } from 'react';

/**
 * Hook that detects clicks outside of the specified element
 * Useful for closing dropdowns, modals, and popovers
 * 
 * @param ref - React ref of the element to detect outside clicks
 * @param handler - Callback function to execute on outside click
 * @param enabled - Whether the listener is enabled (default: true)
 * 
 * @example
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * useOnClickOutside(dropdownRef, () => {
 *   setIsOpen(false);
 * });
 * 
 * return (
 *   <div ref={dropdownRef}>
 *     {isOpen && <div>Dropdown content</div>}
 *   </div>
 * );
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      
      // Do nothing if clicking ref's element or descendent elements
      if (!element || element.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    // Add event listeners
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}

