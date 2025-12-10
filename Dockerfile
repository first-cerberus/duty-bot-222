# Multi-stage build для оптимізації розміру образу
FROM node:20-alpine AS builder

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package файли
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --only=production

# Копіюємо весь код
COPY . .

# Production stage
FROM node:20-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо node_modules та код з builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Створюємо non-root користувача для безпеки
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Змінюємо власника файлів
RUN chown -R nodejs:nodejs /app

# Перемикаємось на non-root користувача
USER nodejs

# Встановлюємо змінні оточення
ENV NODE_ENV=production

# Cloud Run використовує PORT змінну оточення
ENV PORT=8080
EXPOSE 8080

# Healthcheck для Cloud Run
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаємо бота
CMD ["node", "src/index.js"]
