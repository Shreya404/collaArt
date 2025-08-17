'use client';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

const DOCK_HEIGHT = 100;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;

const DockContext = createContext(undefined);

function DockProvider({ children, value }) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within an DockProvider');
  }
  return context;
}

/**
 * orientation: 'horizontal' | 'vertical'
 */
function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  orientation = 'horizontal',
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  const isVertical = orientation === 'vertical';

  return (
    <motion.div
      style={isVertical ? { width: panelHeight } : { height: panelHeight }}
      className={cn(
        isVertical
          ? 'flex flex-col h-auto items-start'
          : 'mx-2 flex max-w-full items-end overflow-x-auto',
      )}
    >
      <motion.div
        onMouseMove={({ pageY, pageX }) => {
          isHovered.set(1);
          // vertical: track mouseY instead of X
          mouseX.set(isVertical ? pageY : pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={cn(
          isVertical
            ? 'fixed left-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 w-16 rounded-none shadow-xl bg-gradient-to-br from-blue-200 to-violet-400 dark:bg-neutral-950/90 z-50 py-2 px-1 border-r border-gray-300 rounded-2xl ml-2'
            : 'mx-auto flex flex-row w-fit gap-8 rounded-2xl bg-gray-50 px-4 dark:bg-neutral-900',
          className
        )}
        style={isVertical ? { width: panelHeight } : { height: panelHeight }}
        role='toolbar'
        aria-label='Application dock'
      >
        <DockProvider value={{ mouseX, spring, distance, magnification, isVertical }}>
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

function DockItem({ children, className }) {
  const ref = useRef(null);

  const { distance, magnification, mouseX, spring, isVertical } = useDock();
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    // vertical: use y axis, else x axis
    return isVertical
      ? val - domRect.y - domRect.height / 2
      : val - domRect.x - domRect.width / 2;
  });

  const baseSize = isVertical ? 36 : 40; // shrink on mobile/vertical
  const magnify = isVertical ? magnification * 0.66 : magnification;
  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseSize, magnify, baseSize]
  );
  const width = useSpring(widthTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={isVertical ? { height: width, width: '100%' } : { width }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl py-2.5 transition-colors hover:bg-violet-200/50 dark:hover:bg-violet-950/60',
        isVertical ? 'my-1 w-full' : '',
        className
      )}
      tabIndex={0}
      role='button'
      aria-haspopup='true'
    >
      {Children.map(children, (child) => cloneElement(child, { width, isHovered }))}
    </motion.div>
  );
}

function DockLabel({ children, className, ...rest }) {
  const restProps = rest;
  const isHovered = restProps['isHovered'];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute top-full -mt-10 left-1/2 w-fit whitespace-pre rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white z-40 select-none',
            className
          )}
          role='tooltip'
          style={{ x: '-40%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, ...rest }) {
  const restProps = rest;
  const width = restProps['width'];
  const widthTransform = useTransform(width, (val) => val / 2);

  return (
    <motion.div
      style={{ width: widthTransform, height: widthTransform }}
      className={cn('flex items-center justify-center', className)}
    >
      {children}
    </motion.div>
  );
}

export { Dock, DockIcon, DockItem, DockLabel };
