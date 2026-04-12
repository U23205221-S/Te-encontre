import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(Observer, ScrollToPlugin);

const resolveTopOffset = (value) => {
  if (typeof value === 'function') {
    const resolved = value();

    return Number.isFinite(resolved) ? Math.max(0, resolved) : 0;
  }

  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

const resolveActiveIndexFromTargets = (targets = []) => {
  const currentY = window.scrollY;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  targets.forEach((targetY, index) => {
    const distance = Math.abs(targetY - currentY);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
};

export const useHomeSectionSnap = ({
  containerRef,
  sectionSelector = '[data-home-section]',
  enabled = true,
  topOffset = 0,
  desktopMinWidth = 1024,
  duration = 0.56,
  ease = 'power3.out',
  tolerance = 18,
} = {}) => {
  const sectionsRef = useRef([]);
  const targetsRef = useRef([]);
  const activeIndexRef = useRef(0);
  const syncFrameRef = useRef(0);
  const observerRef = useRef(null);
  const scrollTweenRef = useRef(null);
  const isTransitioningRef = useRef(false);

  const getSectionTop = useCallback(
    (section) => {
      const currentTopOffset = resolveTopOffset(topOffset);
      return Math.max(window.scrollY + section.getBoundingClientRect().top - currentTopOffset, 0);
    },
    [topOffset],
  );

  const isDesktopViewport = useCallback(
    () => typeof window !== 'undefined' && window.matchMedia(`(min-width: ${desktopMinWidth}px)`).matches,
    [desktopMinWidth],
  );

  const canElementScroll = useCallback((element, deltaY) => {
    if (!(element instanceof Element)) {
      return false;
    }

    const ignoredRegion = element.closest('[data-home-ignore-snap]');

    if (ignoredRegion) {
      return true;
    }

    const scrollableParent = element.closest('[data-home-scrollable], [role="dialog"], .overflow-y-auto, .overflow-auto');

    if (!scrollableParent) {
      return false;
    }

    const hasOverflow = scrollableParent.scrollHeight > scrollableParent.clientHeight + 1;

    if (!hasOverflow) {
      return false;
    }

    if (deltaY > 0) {
      return scrollableParent.scrollTop + scrollableParent.clientHeight < scrollableParent.scrollHeight - 1;
    }

    if (deltaY < 0) {
      return scrollableParent.scrollTop > 1;
    }

    return true;
  }, []);

  const collectTargets = useCallback(() => {
    targetsRef.current = sectionsRef.current.map((section) => getSectionTop(section));
  }, [getSectionTop]);

  const syncActiveIndexFromTargets = useCallback(() => {
    if (targetsRef.current.length === 0) {
      return;
    }

    activeIndexRef.current = resolveActiveIndexFromTargets(targetsRef.current);
  }, []);

  const unlockTransition = useCallback(() => {
    isTransitioningRef.current = false;
    collectTargets();
    syncActiveIndexFromTargets();
  }, [collectTargets, syncActiveIndexFromTargets]);

  const goToSection = useCallback(
    (nextIndex, { immediate = false } = {}) => {
      const sections = sectionsRef.current;
      const targets = targetsRef.current;

      if (sections.length === 0 || targets.length === 0) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(nextIndex, sections.length - 1));
      const targetY = targets[boundedIndex];

      if (!Number.isFinite(targetY)) {
        return;
      }

      const deltaToTarget = Math.abs(window.scrollY - targetY);

      if (boundedIndex === activeIndexRef.current && deltaToTarget < 1.5) {
        return;
      }

      if (scrollTweenRef.current) {
        scrollTweenRef.current.kill();
      }

      activeIndexRef.current = boundedIndex;

      if (immediate) {
        window.scrollTo({ top: targetY, behavior: 'auto' });
        isTransitioningRef.current = false;
        syncActiveIndexFromTargets();
        return;
      }

      isTransitioningRef.current = true;

      scrollTweenRef.current = gsap.to(window, {
        scrollTo: { y: targetY, autoKill: false },
        duration,
        ease,
        overwrite: true,
        onComplete: unlockTransition,
        onInterrupt: unlockTransition,
      });
    },
    [duration, ease, syncActiveIndexFromTargets, unlockTransition],
  );

  const scrollToSection = useCallback(
    (selectorOrIndex, options = {}) => {
      if (!enabled || typeof window === 'undefined') {
        return;
      }

      const fallbackBehavior = options.immediate ? 'auto' : 'smooth';
      const shouldUseNative = !isDesktopViewport() && !options.forceSnap;

      if (typeof selectorOrIndex === 'number') {
        if (shouldUseNative && sectionsRef.current[selectorOrIndex]) {
          const targetY = getSectionTop(sectionsRef.current[selectorOrIndex]);
          window.scrollTo({ top: targetY, behavior: fallbackBehavior });
          return;
        }

        goToSection(selectorOrIndex, options);
        return;
      }

      const section = typeof selectorOrIndex === 'string'
        ? document.querySelector(selectorOrIndex)
        : selectorOrIndex;

      if (!section) {
        return;
      }

      const sectionIndex = sectionsRef.current.findIndex((candidate) => candidate === section);

      if (sectionIndex >= 0) {
        if (shouldUseNative) {
          const targetY = getSectionTop(section);
          window.scrollTo({ top: targetY, behavior: fallbackBehavior });
          return;
        }

        goToSection(sectionIndex, options);
        return;
      }

      const targetY = getSectionTop(section);
      window.scrollTo({ top: targetY, behavior: fallbackBehavior });
    },
    [enabled, getSectionTop, goToSection, isDesktopViewport],
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

      const collectSections = () => {
        const container = containerRef?.current ?? document;
        sectionsRef.current = Array.from(container.querySelectorAll(sectionSelector));
        collectTargets();

        syncActiveIndexFromTargets();
      };

    const cleanupObserver = () => {
      if (observerRef.current) {
        observerRef.current.kill();
        observerRef.current = null;
      }
    };

      const shouldHandleGesture = (self, direction) => {
        if (isTransitioningRef.current || sectionsRef.current.length === 0 || targetsRef.current.length === 0) {
          return false;
        }

        const nativeEvent = self.event;
        const deltaY = direction > 0 ? 1 : -1;

        if (canElementScroll(nativeEvent?.target, deltaY)) {
          return false;
        }

        if (nativeEvent?.cancelable) {
          nativeEvent.preventDefault();
        }

        return true;
      };

      const ensureObserver = () => {
        cleanupObserver();

      if (!isDesktopViewport()) {
        return;
      }

        observerRef.current = Observer.create({
          target: window,
          type: 'wheel,touch',
          tolerance,
          preventDefault: false,
          allowClicks: true,
          onDown: (self) => {
            if (!shouldHandleGesture(self, 1)) {
              return;
            }

            goToSection(activeIndexRef.current + 1);
          },
          onUp: (self) => {
            if (!shouldHandleGesture(self, -1)) {
              return;
            }

            goToSection(activeIndexRef.current - 1);
          },
        });
      };

    const syncActiveIndex = () => {
      if (syncFrameRef.current) {
        return;
      }

      syncFrameRef.current = window.requestAnimationFrame(() => {
        syncFrameRef.current = 0;

        if (targetsRef.current.length === 0) {
          return;
        }

        syncActiveIndexFromTargets();
      });
    };

    collectSections();
    ensureObserver();

    window.addEventListener('scroll', syncActiveIndex, { passive: true });
    window.addEventListener('resize', collectSections);
    window.addEventListener('resize', ensureObserver);

    return () => {
      if (syncFrameRef.current) {
        window.cancelAnimationFrame(syncFrameRef.current);
      }

      cleanupObserver();

      if (scrollTweenRef.current) {
        scrollTweenRef.current.kill();
      }

      window.removeEventListener('scroll', syncActiveIndex);
      window.removeEventListener('resize', collectSections);
      window.removeEventListener('resize', ensureObserver);
    };
  }, [canElementScroll, collectTargets, containerRef, enabled, goToSection, isDesktopViewport, sectionSelector, syncActiveIndexFromTargets, tolerance]);

  return {
    scrollToSection,
  };
};
