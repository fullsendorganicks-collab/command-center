FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
EXPOSE 8080

# Google (and other sign-in providers) actively detect headless=true as an
# automation signal and block OAuth login with "This browser or app may not
# be secure" — confirmed live on this exact server. Running headful under
# Xvfb (a virtual, in-memory X11 display — nothing is actually rendered to
# a real screen, so this works fine on a server with no GUI) presents as a
# normal browser instead. Deliberately NOT using xvfb-run here — its own
# startup handshake is documented to hang indefinitely with zero output in
# Docker (confirmed live: deploy went silent, no "listening" log, no
# crash, Render's port scan found nothing). entrypoint.sh starts Xvfb
# directly instead, avoiding that hang.
CMD ["./entrypoint.sh"]
