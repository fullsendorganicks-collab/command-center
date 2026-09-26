#!/bin/sh
# xvfb-run's own startup logic waits on a SIGUSR1 handshake from Xvfb to
# know it's ready — documented to hang indefinitely with zero output in
# Docker specifically, where signal delivery across process groups is
# unreliable. Confirmed live: the container deployed clean, "Deploying..."
# printed, then nothing — no "listening" log, no crash, no error, and
# Render's own port scan never found anything. Starting Xvfb directly in
# the background and polling for its display socket file (a plain
# filesystem check, not a signal) avoids that hang entirely.
set -e

# Confirmed live: on a container restart (crash, redeploy, Render cycling the
# instance) a stale /tmp/.X99-lock file from the previous Xvfb process can
# survive, causing the new Xvfb to fail immediately with "Server is already
# active for display 99" while this script's own socket-file check (which
# only confirms /tmp/.X11-unix/X99 exists, not that Xvfb is actually alive)
# passed anyway — node server.js then ran with DISPLAY=:99 pointing at a
# display that was never actually established, and every single Chromium
# launch failed with "Missing X server or $DISPLAY", silently killing every
# session at browser-launch time regardless of site. Removing any leftover
# lock before starting is the standard fix for this exact class of failure.
rm -f /tmp/.X99-lock

Xvfb :99 -screen 0 1280x800x24 &
XVFB_PID=$!

for i in $(seq 1 50); do
  # Both conditions matter: the socket file existing only means Xvfb got far
  # enough to create it, not that it's still running (it can crash right
  # after, e.g. the lock collision above) — checking the process is still
  # alive catches that case instead of proceeding into a dead display.
  if [ -e /tmp/.X11-unix/X99 ] && kill -0 "$XVFB_PID" 2>/dev/null; then
    break
  fi
  sleep 0.1
done

if ! kill -0 "$XVFB_PID" 2>/dev/null; then
  echo "FATAL: Xvfb failed to start or died during startup — refusing to launch with a broken display." >&2
  exit 1
fi

export DISPLAY=:99
exec node server.js
