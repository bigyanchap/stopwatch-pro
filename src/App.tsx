import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Type definition for Wake Lock API
interface WakeLockSentinel {
  release(): Promise<void>;
}

interface NavigatorWithWakeLock extends Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

function App() {
  const [time, setTime] = useState(0); // Main timer in milliseconds
  const [lapTime, setLapTime] = useState(0); // Lap timer that resets
  const [isRunning, setIsRunning] = useState(false);
  const [showMilliseconds, setShowMilliseconds] = useState(() => {
    const saved = localStorage.getItem('showMilliseconds');
    return saved ? JSON.parse(saved) : false;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Keep screen awake functionality
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const nav = navigator as NavigatorWithWakeLock;
        if (nav.wakeLock) {
          wakeLockRef.current = await nav.wakeLock.request('screen');
          console.log('Screen wake lock is active');
        }
      }
    } catch (err) {
      console.error('Wake lock request failed:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Screen wake lock released');
    }
  };

  useEffect(() => {
    // Request wake lock when component mounts
    requestWakeLock();
    
    // Cleanup on unmount
    return () => {
      releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      const interval = showMilliseconds ? 10 : 1000; // 10ms for milliseconds, 1000ms for seconds
      const increment = showMilliseconds ? 10 : 1000;
      
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + increment);
        setLapTime(prevLapTime => prevLapTime + increment);
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, showMilliseconds]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const mils = milliseconds % 1000;

    if (showMilliseconds) {
      const centiseconds = Math.floor(mils / 10); // Convert to centiseconds (2 digits)
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startStop = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      requestWakeLock(); // Re-request wake lock when starting
    }
  };

  const reset = () => {
    setLapTime(0);
  };

  const resetAll = () => {
    setIsRunning(false);
    setTime(0);
    setLapTime(0);
    releaseWakeLock();
  };

  const toggleMilliseconds = (checked: boolean) => {
    setShowMilliseconds(checked);
    localStorage.setItem('showMilliseconds', JSON.stringify(checked));
  };

  return (
    <div className="app">
      <div className="header">
        <div className={`menu-icon ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1 className="header-text">⏱️ Stopwatch Pro</h1>
      </div>

      <div className={`menu ${menuOpen ? 'show' : ''}`}>
        <ul>
          <li onClick={() => { setShowAbout(true); setMenuOpen(false); }}>About</li>
          <li onClick={() => { setShowSettings(true); setMenuOpen(false); }}>Settings</li>
        </ul>
      </div>

      {showAbout && (
        <div className="overlay" onClick={() => setShowAbout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>About Stopwatch Pro</h2>
            <p>Stopwatch Pro is a professional timer app with advanced features including dual timers, millisecond precision, and screen wake lock functionality.</p>
            <p>Version 1.0.0</p>
            <button className="close-btn" onClick={() => setShowAbout(false)}>Close</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  checked={showMilliseconds}
                  onChange={(e) => toggleMilliseconds(e.target.checked)}
                />
                <span>Show Milliseconds</span>
              </label>
            </div>
            <button className="close-btn" onClick={() => setShowSettings(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="time-container">
        <div className="timer-card">
          <p className="timer-label">Total Time</p>
          <div className="time-display">{formatTime(time)}</div>
        </div>

        <div className="timer-card">
          <p className="timer-label">Lap Time</p>
          <div className="time-display">{formatTime(lapTime)}</div>
        </div>
      </div>

      <div className="controls-container">
        <div className="control-grid">
          <button
            className={`button start-stop-button ${isRunning ? 'stop' : 'start'}`}
            onClick={startStop}
          >
            {isRunning ? '⏸️ PAUSE' : '▶️ START'}
          </button>

          <button
            className="button reset-button"
            onClick={reset}
          >
            🔄 RESET LAP
          </button>
        </div>

        <button
          className="button reset-all-button"
          onClick={resetAll}
        >
          ⏹️ RESET ALL
        </button>
      </div>

      <div className="ad-container">
        <p className="ad-placeholder">📱 Ad Space - Premium Version Available</p>
      </div>
    </div>
  );
}

export default App;
