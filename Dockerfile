# Verwende Node.js 18 als Basis-Image
FROM node:18

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den gesamten Quellcode ins Image
COPY . .

# Führe den Build-Schritt aus
RUN npm run build

# Exponiere den Port 8080 (für Cloud Run)
EXPOSE 8080

# Starte die Anwendung
CMD ["node", "dist/index.js"]
