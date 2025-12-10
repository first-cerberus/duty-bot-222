# Google Cloud Run Deployment Guide

## Підготовка

### 1. Встановіть Google Cloud CLI

```bash
# Linux/Mac
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Windows
# Завантажте інсталятор з https://cloud.google.com/sdk/docs/install
```

### 2. Увійдіть та налаштуйте проект

```bash
# Авторизація
gcloud auth login

# Створіть новий проект або виберіть існуючий
gcloud projects create duty-bot-project --name="DutyBOT"
gcloud config set project duty-bot-project

# Увімкніть необхідні API
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Деплой на Cloud Run

### Метод 1: Через gcloud CLI (рекомендовано)

```bash
# Перейдіть в директорію проекту
cd /path/to/DutyBOT_222

# Деплой (автоматично збирає та публікує)
gcloud run deploy dutybot \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "BOT_TOKEN=YOUR_BOT_TOKEN" \
  --set-env-vars "MONGODB_URI=mongodb+srv://rizotto:Qwesda123@cluster0-dutybot.72a5h3q.mongodb.net/?appName=Cluster0-DutyBOT" \
  --set-env-vars "ALLOWED_IDS=1514302273,818667420,799128809,1305742188" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 1
```

### Метод 2: З використанням Docker Image

```bash
# 1. Збираємо Docker образ
docker build -t gcr.io/duty-bot-project/dutybot:latest .

# 2. Налаштовуємо Docker для GCR
gcloud auth configure-docker

# 3. Пушимо образ в Container Registry
docker push gcr.io/duty-bot-project/dutybot:latest

# 4. Деплоїмо на Cloud Run
gcloud run deploy dutybot \
  --image gcr.io/duty-bot-project/dutybot:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,BOT_TOKEN=YOUR_BOT_TOKEN,MONGODB_URI=YOUR_MONGODB_URI,ALLOWED_IDS=1514302273,818667420,799128809,1305742188" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 1
```

### Метод 3: Використання secrets для чутливих даних

```bash
# Створіть секрети
echo -n "YOUR_BOT_TOKEN" | gcloud secrets create bot-token --data-file=-
echo -n "mongodb+srv://..." | gcloud secrets create mongodb-uri --data-file=-

# Деплой з секретами
gcloud run deploy dutybot \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-secrets "BOT_TOKEN=bot-token:latest,MONGODB_URI=mongodb-uri:latest" \
  --set-env-vars "NODE_ENV=production,ALLOWED_IDS=1514302273,818667420,799128809,1305742188" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1
```

## CI/CD через GitHub Actions

Створіть файл `.github/workflows/deploy-cloudrun.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main, master ]

env:
  PROJECT_ID: duty-bot-project
  SERVICE_NAME: dutybot
  REGION: europe-west1

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v1

    - name: Build and Deploy to Cloud Run
      run: |
        gcloud run deploy $SERVICE_NAME \
          --source . \
          --platform managed \
          --region $REGION \
          --allow-unauthenticated \
          --set-env-vars "NODE_ENV=production" \
          --set-secrets "BOT_TOKEN=bot-token:latest,MONGODB_URI=mongodb-uri:latest" \
          --set-env-vars "ALLOWED_IDS=${{ secrets.ALLOWED_IDS }}" \
          --memory 512Mi \
          --cpu 1 \
          --min-instances 1 \
          --max-instances 1
```

### Налаштування GitHub Secrets для CI/CD:

1. Створіть Service Account:
```bash
gcloud iam service-accounts create github-actions \
  --display-name "GitHub Actions"

gcloud projects add-iam-policy-binding duty-bot-project \
  --member="serviceAccount:github-actions@duty-bot-project.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding duty-bot-project \
  --member="serviceAccount:github-actions@duty-bot-project.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding duty-bot-project \
  --member="serviceAccount:github-actions@duty-bot-project.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Створіть JSON ключ
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@duty-bot-project.iam.gserviceaccount.com
```

2. Додайте секрети в GitHub:
   - `GCP_SA_KEY` - вміст файлу key.json
   - `ALLOWED_IDS` - 1514302273,818667420,799128809,1305742188

## Управління сервісом

```bash
# Переглянути логи
gcloud run services logs read dutybot --region europe-west1

# Переглянути статус
gcloud run services describe dutybot --region europe-west1

# Оновити змінні оточення
gcloud run services update dutybot \
  --region europe-west1 \
  --set-env-vars "NEW_VAR=value"

# Масштабування
gcloud run services update dutybot \
  --region europe-west1 \
  --min-instances 1 \
  --max-instances 3

# Видалити сервіс
gcloud run services delete dutybot --region europe-west1
```

## Моніторинг

```bash
# Перегляд метрик в реальному часі
gcloud run services logs tail dutybot --region europe-west1

# Відкрити Cloud Console
gcloud run services describe dutybot --region europe-west1 --format="value(status.url)"
```

## Важливі примітки

1. **Біллінг**: Cloud Run безкоштовний до 2 млн запитів/місяць
2. **Always-on**: Використовуйте `--min-instances 1` щоб бот завжди працював
3. **MongoDB Atlas**: Додайте `0.0.0.0/0` в Network Access MongoDB Atlas
4. **Регіон**: `europe-west1` (Бельгія) - найближчий до України

## Troubleshooting

```bash
# Якщо бот не стартує
gcloud run services logs read dutybot --limit 50

# Перевірка образу локально
docker run -p 8080:8080 \
  -e BOT_TOKEN="your_token" \
  -e MONGODB_URI="your_uri" \
  -e ALLOWED_IDS="ids" \
  gcr.io/duty-bot-project/dutybot:latest

# Повторний деплой
gcloud run deploy dutybot --source . --region europe-west1
```

## Вартість

**Приблизна вартість для постійно запущеного бота:**
- CPU: ~$0.024/година × 720 годин = ~$17.28/місяць
- RAM: ~$0.0025/GB-година × 0.5GB × 720 = ~$0.90/місяць
- Запити: Безкоштовно (до 2 млн)

**Загалом: ~$18-20/місяць** для постійно працюючого бота з min-instances=1

Для економії можна використовувати `--min-instances 0`, але бот буде "засинати" при відсутності активності.
