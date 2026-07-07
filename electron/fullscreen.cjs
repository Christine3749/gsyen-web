const { screen } = require('electron');

function createFullscreenController() {
  let savedBounds = null;
  let transitioning = false;

  function fadeInLater(w, delay = 80) {
    setTimeout(() => {
      if (w.isDestroyed()) {
        transitioning = false;
        return;
      }
      w.webContents.send('fullscreen:change', { phase: 'in' });
      setTimeout(() => { transitioning = false; }, 240);
    }, delay);
  }

  function toggle(w) {
    if (transitioning) return;
    transitioning = true;
    w.webContents.send('fullscreen:change', { phase: 'out' });

    setTimeout(() => {
      if (w.isDestroyed()) {
        transitioning = false;
        return;
      }

      if (process.platform === 'win32') {
        if (savedBounds !== null) {
          w.setAlwaysOnTop(false);
          w.setBounds(savedBounds);
          savedBounds = null;
        } else {
          savedBounds = w.getBounds();
          const display = screen.getDisplayNearestPoint({ x: savedBounds.x, y: savedBounds.y });
          w.setAlwaysOnTop(true, 'screen-saver');
          w.setBounds(display.bounds);
          w.moveTop();
        }
        fadeInLater(w);
        return;
      }

      w.setFullScreen(!w.isFullScreen());
      setTimeout(() => { transitioning = false; }, 3000);
    }, 100);
  }

  function wireMacEvents(w) {
    if (process.platform !== 'darwin') return;

    const onFadeReady = () => {
      if (!transitioning) return;
      w.webContents.send('fullscreen:change', { phase: 'in' });
      setTimeout(() => { transitioning = false; }, 240);
    };

    w.on('enter-full-screen', onFadeReady);
    w.on('leave-full-screen', onFadeReady);
    w.on('enter-full-screen', () => w.webContents.send('window:fullscreen-state', true));
    w.on('leave-full-screen', () => w.webContents.send('window:fullscreen-state', false));
  }

  return { toggle, wireMacEvents };
}

module.exports = { createFullscreenController };
