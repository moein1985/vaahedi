# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - heading "ورود به حساب" [level=1] [ref=e5]
    - paragraph [ref=e6]: روش ورود خود را انتخاب کنید
    - generic [ref=e7]:
      - button "ورود با رمز عبور" [ref=e8]
      - button "ورود با کد پیامکی" [ref=e9]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - text: کد کاربری
        - 'textbox "مثال: 0100001" [ref=e12]': "0000001"
      - generic [ref=e13]:
        - text: رمز عبور
        - textbox [active] [ref=e14]: Admin@1234
      - generic [ref=e15]: Captcha در محیط توسعه غیرفعال است
      - button "ورود به حساب" [ref=e16]
    - paragraph [ref=e17]:
      - link "ورود با رمز یکبار مصرف (OTP)" [ref=e18] [cursor=pointer]:
        - /url: /auth/login-otp
      - text: حساب ندارید؟
      - link "ثبت‌نام" [ref=e19] [cursor=pointer]:
        - /url: /auth/register
  - generic:
    - contentinfo:
      - button "Open TanStack Router Devtools" [ref=e20] [cursor=pointer]:
        - generic [ref=e21]:
          - img [ref=e23]
          - img [ref=e58]
        - generic [ref=e92]: "-"
        - generic [ref=e93]: TanStack Router
```