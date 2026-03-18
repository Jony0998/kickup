# Admin boshqaruv paneliga signup (Admin signup)

Admin hisobini yaratish uchun **maxfiy kalit** (secret key) kerak. Uni faqat server sozlamalarida saqlaysiz.

## 1. Secret key o‘rnatish

Loyiha ildizidagi `.env` faylida `ADMIN_SECRET_KEY` ni o‘rnating (masalan, murakkab parol):

```env
ADMIN_SECRET_KEY=your-secret-key-here
```

Agar `.env` da bu o‘zgaruvchi bo‘lmasa, API standart qiymatdan foydalanadi: `CHANGE_THIS_IN_PRODUCTION` (production da albatta o‘zgartiring).

## 2. Admin hisobini yaratish (2 usul)

### A) Sayt orqali (Sign up sahifasi)

1. Brauzerda **Sign up** sahifasiga kiring: `/register`
2. **"+ Register as administrator"** tugmasini bosing.
3. **Admin secret key** maydoniga `.env` dagi `ADMIN_SECRET_KEY` ni kiriting.
4. Qolgan maydonlarni to‘ldiring (Name, Phone, Password) va **Sign up** bosing.

Agar birinchi admin bo‘lsa va kalit to‘g‘ri bo‘lsa, hisob **Admin** sifatida yaratiladi. Keyin **Login** qilib admin paneliga kirishingiz mumkin.

**Eslatma:** Tizimda **faqat bitta** admin bo‘lishi mumkin. Agar admin allaqachon mavjud bo‘lsa, "Admin already exists" xabari chiqadi va yangi admin yaratib bo‘lmaydi.

### B) GraphQL orqali (createAdminWithSecret)

GraphQL Playground (masalan `http://localhost:3008/graphql`) da quyidagi mutation ni chaqiring:

```graphql
mutation CreateAdmin($input: CreateAdminInput!) {
  createAdminWithSecret(input: $input) {
    _id
    memberNick
    memberPhone
    memberType
  }
}
```

Variables (o‘rniga o‘z qiymatlaringizni qo‘ying):

```json
{
  "input": {
    "memberPhone": "+998901234567",
    "memberNick": "admin",
    "memberPassword": "yourSecurePassword123",
    "memberFullName": "Admin User",
    "secretKey": "your-secret-key-here"
  }
}
```

`secretKey` — `.env` dagi `ADMIN_SECRET_KEY` bilan bir xil bo‘lishi kerak.

## 3. Admin paneliga kirish

Admin hisob yaratilgandan so‘ng:

1. **Login** sahifasida telefon (yoki nickname) va parol bilan kiring.
2. Kirish muvaffaqiyatli bo‘lsa, `memberType === 'ADMIN'` bo‘lgani uchun admin paneli (agar frontend da mavjud bo‘lsa) va barcha admin-only API lar sizga ochiq bo‘ladi.

Admin panel uchun alohida URL (masalan `/admin`) loyihada bo‘lishi mumkin — buni frontend routing dan tekshiring.
