FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./

ENV NODE_ENV=production
EXPOSE 8080

# Google (and other sign-in providers) actively detect headless=true as an
# automation signal and block OAuth login with "This browser or app may not
# be secure" — confirmed live on this exact server. Running headful under
# Xvfb (a virtual, in-memory X11 display — nothing is actually rendered to
# a real screen, so this works fine on a server with no GUI) presents as a
# normal browser instead. The base image here already ships xvfb-run
# preinstalled for exactly this purpose.
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1280x800x24", "node", "server.js"]
