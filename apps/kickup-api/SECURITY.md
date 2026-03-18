# KickUp API — Xavfsizlik (Security)

## Hozir qo‘llanilayotganlar

| Qism | Holat |
|------|--------|
| **Autentifikatsiya** | JWT (access + refresh), qisqa muddatli access token (~15 min), refresh token rotation |
| **Parol** | bcrypt (10 round) orqali hash, DB da select: false |
| **Guards** | AuthGuard (GraphQL + REST), AdminGuard (faqat ADMIN) |
| **Rasm yuklash** | Endi faqat login qilgan foydalanuvchi yuklay oladi (AuthGuard) |
| **Fayl yuklash** | MIME tip tekshiruvi (jpg, jpeg, png, gif), max 5MB, UUID filename (path traversal yo‘q) |
| **Kirish** | ValidationPipe (whitelist: true) — ortiqcha fieldlar kesiladi |
| **Refresh token** | Reuse detection — qayta ishlatilsa barcha tokenlar bekor qilinadi |
| **Cookie** | httpOnly, production da secure, sameSite |
| **.env** | .gitignore da — repo ga tushmaydi |

## Production uchun tavsiyalar

1. **CORS**  
   `.env` da `CORS_ORIGIN=https://yourdomain.com` (yoki vergul bilan bir nechta domen) qo‘ying. Bo‘sh qoldirsangiz, barcha origin qabul qilinadi (faqat development uchun ma’qul).

2. **JWT_SECRET**  
   Kuchli, tasodifiy secret ishlating (kamida 32 belgi). Har bir muhit uchun boshqacha bo‘lsin.

3. **GraphQL Playground**  
   Production da Playground ni o‘chirish ma’qul (introspection va debug ni cheklash).

4. **Rate limiting**  
   Login, register, upload kabi endpoint larga limit qo‘yish (masalan `@nestjs/throttler`) xavfsizlikni yaxshilaydi.

5. **Helmet**  
   HTTP header xavfsizligi uchun `helmet` middleware qo‘shish tavsiya etiladi.

6. **Loglar**  
   Production da JWT yoki token haqida log chiqarmang; AuthGuard dagi debug loglarni olib tashlang yoki `NODE_ENV=production` da o‘chiring.
