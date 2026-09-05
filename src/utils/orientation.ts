// Fullscreen and Screen Orientation Utilities for Dominoes Online

export async function requestAppFullscreen(): Promise<boolean> {
  try {
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };

    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen();
    } else if (docEl.webkitRequestFullscreen) {
      await docEl.webkitRequestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      await docEl.mozRequestFullScreen();
    } else if (docEl.msRequestFullscreen) {
      await docEl.msRequestFullscreen();
    }

    // Try locking orientation to landscape
    const screenOrientation = screen.orientation as unknown as {
      lock?: (orientation: string) => Promise<void>;
      unlock?: () => void;
    };

    if (screenOrientation && typeof screenOrientation.lock === 'function') {
      await screenOrientation.lock('landscape').catch(() => {
        // Ignored if browser / OS restricts orientation lock without installed PWA
      });
    }

    return true;
  } catch (err) {
    console.warn('Fullscreen / Orientation request notice:', err);
    return false;
  }
}

export async function exitAppFullscreen(): Promise<void> {
  try {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };

    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }

    const screenOrientation = screen.orientation as unknown as {
      unlock?: () => void;
    };

    if (screenOrientation && typeof screenOrientation.unlock === 'function') {
      try {
        screenOrientation.unlock();
      } catch {
        // Ignore
      }
    }
  } catch (err) {
    console.warn('Exit fullscreen notice:', err);
  }
}

export function isAppFullscreen(): boolean {
  const doc = document as Document & {
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
  };
  return Boolean(
    doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
  );
}
