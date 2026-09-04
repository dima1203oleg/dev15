# Tablet Test Matrix

## Viewports

| Class | Portrait | Landscape |
| --- | --- | --- |
| iPad | 768×1024 | 1024×768 |
| iPad Air | 820×1180 | 1180×820 |
| iPad Pro | 834×1194 | 1194×834 |
| Large tablet | 1024×1366 | 1366×1024 |
| Android | 800×1280 | 1280×800 |

## Interaction coverage

- region selector sheet and search;
- layer focus and depth separation;
- swipe layer navigation and bounded pinch zoom;
- event focus, context panel modes and alert focus;
- timeline history and return to LIVE;
- shelter split view;
- portrait bottom nav and landscape side rail;
- presentation mode without personal account detail;
- partner view with explicit demo/integration status;
- orientation change preserving region, event, layer and timeline state.

## Current verification

The local QA pass covered 768×1024 portrait and 1024×768 landscape, including no horizontal overflow, no browser console errors, state preservation after rotation, and the region, shelter, partner and presentation flows. Full Playwright screenshot regression and performance profiling remain CI work when the project test harness is expanded.

