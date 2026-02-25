# راهنمای سرور پروداکشن

## اطلاعات اتصال

| مورد | مقدار |
|------|-------|
| IP | `192.168.85.41` |
| پورت SSH | `22` |
| کاربر | `moein` |
| احراز هویت | SSH Key (بدون پسورد) |

```bash
ssh moein@192.168.85.41
```

---

## مسیرهای مهم

| مورد | مسیر |
|------|-------|
| پروژه | `/home/moein/vaahedi/` |
| فایل env | `/home/moein/vaahedi/.env` |
| لاگ nginx | داخل volume داکر |

---

## وضعیت سرویس‌ها

```bash
# وضعیت همه کانتینرها
sg docker -c "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# وضعیت کانتینرهای vaahedi
sg docker -c "docker ps --filter name=vaahedi --format 'table {{.Names}}\t{{.Status}}'"
```

---

## لاگ‌ها

```bash
# لاگ API
sg docker -c "docker logs vaahedi-prod-api-1 --tail 50 -f"

# لاگ Worker
sg docker -c "docker logs vaahedi-prod-worker-1 --tail 50 -f"

# لاگ Web
sg docker -c "docker logs vaahedi-prod-web-1 --tail 50"

# لاگ Nginx
sg docker -c "docker logs vaahedi-prod-nginx-1 --tail 50"
```

---

## راه‌اندازی مجدد

```bash
cd /home/moein/vaahedi

# restart یک سرویس
sg docker -c "docker compose -f docker-compose.prod.yml restart api"
sg docker -c "docker compose -f docker-compose.prod.yml restart worker"
sg docker -c "docker compose -f docker-compose.prod.yml restart nginx"

# restart همه سرویس‌ها
sg docker -c "docker compose -f docker-compose.prod.yml restart"

# توقف و راه‌اندازی مجدد
sg docker -c "docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d"
```

---

## Deploy آپدیت جدید

```bash
cd /home/moein/vaahedi

# 1. کد جدید را از لوکال به سرور کپی کنید (از لوکال اجرا کنید)
# scp -r . moein@192.168.85.41:/home/moein/vaahedi/

# 2. rebuild و restart
sg docker -c "docker compose -f docker-compose.prod.yml build api --no-cache"
sg docker -c "docker compose -f docker-compose.prod.yml up -d api worker"

# 3. migration دیتابیس (در صورت نیاز)
sg docker -c "docker exec vaahedi-prod-api-1 npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma"
```

---

## دیتابیس

```bash
# اجرای migration
sg docker -c "docker exec vaahedi-prod-api-1 npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma"

# ورود به psql
sg docker -c "docker exec -it vaahedi-prod-postgres-1 psql -U \$POSTGRES_USER -d \$POSTGRES_DB"

# backup دیتابیس
sg docker -c "docker exec vaahedi-prod-postgres-1 pg_dump -U vaahedi_user vaahedi > backup_\$(date +%Y%m%d).sql"
```

---

## تست endpoint‌ها

```bash
# Health check
curl http://localhost/health

# صفحه اصلی
curl -o /dev/null -w "HTTP %{http_code}" http://localhost/

# از خارج سرور
curl http://192.168.85.41/health
```

---

## سرویس‌های دیگر روی سرور

| سرویس | آدرس |
|--------|-------|
| Vaahedi | `http://192.168.85.41` |
| OnlyOffice | `http://192.168.85.41:8080` |
| Graylog | `http://192.168.85.41:9000` |

---

## منابع سرور

```bash
# RAM و CPU
free -h
top -bn1 | head -5

# فضای دیسک
df -h /

# استفاده داکر از دیسک
sg docker -c "docker system df"

# پاکسازی image های قدیمی
sg docker -c "docker image prune -f"
```
