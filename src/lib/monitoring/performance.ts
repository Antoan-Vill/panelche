import React from 'react';
import { logger } from './logger';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, PerformanceMeasure[]> = new Map();

  static startMark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(`${name}-start`);
        this.marks.set(name, performance.now());
        logger.debug(`Performance mark started: ${name}`);
      } catch (error) {
        logger.warn(`Failed to start performance mark: ${name}`, { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  static endMark(name: string): number | null {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      try {
        const startTime = this.marks.get(name);
        if (!startTime) {
          logger.warn(`Performance mark not found: ${name}`);
          return null;
        }

        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);

        const duration = performance.now() - startTime;
        this.marks.delete(name);

        logger.debug(`Performance mark ended: ${name}`, { duration: `${duration.toFixed(2)}ms` });

        return duration;
      } catch (error) {
        logger.warn(`Failed to end performance mark: ${name}`, { error: error instanceof Error ? error.message : String(error) });
        return null;
      }
    }
    return null;
  }

  static measureAsync<T>(
    name: string,
    asyncFn: () => Promise<T>
  ): Promise<T> {
    this.startMark(name);
    return asyncFn()
      .then((result) => {
        this.endMark(name);
        return result;
      })
      .catch((error) => {
        this.endMark(name);
        throw error;
      });
  }

  static measureSync<T>(
    name: string,
    syncFn: () => T
  ): T {
    this.startMark(name);
    try {
      const result = syncFn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name);
      throw error;
    }
  }

  static getMetrics(): Record<string, any> {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource');

      return {
        navigation: navigation ? {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
        } : null,
        paint: paint.map(entry => ({
          name: entry.name,
          startTime: entry.startTime,
        })),
        resources: resources.slice(0, 10).map(resource => ({
          name: resource.name,
          duration: resource.duration,
          size: (resource as any).transferSize || 0,
        })),
      };
    }
    return {};
  }

  static reportMetrics(): void {
    const metrics = this.getMetrics();
    logger.info('Performance metrics', metrics);

    // Report Core Web Vitals if available
    if (typeof window !== 'undefined') {
      // CLS - Cumulative Layout Shift
      // TODO: Install web-vitals package and enable Core Web Vitals tracking
      // if ('web-vitals' in window) {
      //   import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      //     getCLS((metric) => logger.info('CLS', { value: metric.value, rating: metric.rating }));
      //     getFID((metric) => logger.info('FID', { value: metric.value, rating: metric.rating }));
      //     getFCP((metric) => logger.info('FCP', { value: metric.value, rating: metric.rating }));
      //     getLCP((metric) => logger.info('LCP', { value: metric.value, rating: metric.rating }));
      //     getTTFB((metric) => logger.info('TTFB', { value: metric.value, rating: metric.rating }));
      //   }).catch((error) => {
      //     logger.warn('Failed to load web-vitals', { error: error instanceof Error ? error.message : String(error) });
      //   });
      // }
    }
  }
}

// API call performance monitoring
export function withApiPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string,
  method: string = 'GET'
) {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();

    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;

      logger.apiCall(endpoint, method, duration, true);

      // Log slow API calls
      if (duration > 3000) { // 3 seconds
        logger.warn(`Slow API call: ${endpoint}`, {
          duration: `${duration.toFixed(2)}ms`,
          method,
          endpoint,
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.apiCall(endpoint, method, duration, false, error as Error);
      throw error;
    }
  };
}

// React component performance monitoring (for development)
// TODO: Implement component performance monitoring
// export function withComponentPerformanceMonitoring<P extends object>(
//   Component: React.ComponentType<P>,
//   componentName: string
// ) {
//   if (process.env.NODE_ENV === 'development') {
//     return class extends React.Component<P> {
//       componentDidMount() {
//         logger.debug(`Component mounted: ${componentName}`);
//       }

//       componentWillUnmount() {
//         logger.debug(`Component unmounted: ${componentName}`);
//       }

//       render() {
//         return <Component {...this.props} />;
//       }
//     };
//   }

//   return Component;
// }

// Route change performance monitoring
export function trackRouteChangePerformance() {
  if (typeof window !== 'undefined') {
    // Track Next.js route changes
    const originalPush = window.history.pushState;
    window.history.pushState = function (...args) {
      PerformanceMonitor.startMark('route-change');
      const result = originalPush.apply(this, args);

      // Wait for next tick to measure the route change
      setTimeout(() => {
        PerformanceMonitor.endMark('route-change');
      }, 0);

      return result;
    };
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Report initial performance metrics after load
  window.addEventListener('load', () => {
    setTimeout(() => {
      PerformanceMonitor.reportMetrics();
    }, 0);
  });

  // Track route changes
  trackRouteChangePerformance();
}
