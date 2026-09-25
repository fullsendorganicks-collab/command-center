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

Xvfb :99 -screen 0 1280x800x24 &

for i in $(seq 1 50); do
  if [ -e /tmp/.X11-unix/X99 ]; then
    break
  fi
  sleep 0.1
done

export DISPLAY=:99
exec node server.js
