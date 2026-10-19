# e2e/fixtures — binary PNG placeholders

Three QR PNG fixtures are used by `e2e/journeys.spec.ts` (uploaded via the file input):

| File | Size | Purpose |
|---|---|---|
| `valid.png` | ~1.3 KB | Genuine Bakong KHQR (CRC-16 valid), merchant SOEU YUKHEANG, amount 18.75 USD |
| `tampered.png` | ~1.4 KB | Same payload with the last CRC digit flipped (0BFB → 0BF0) |
| `zzz-test.png` | ~1.1 KB | Unknown bank code `zzztestbank` (uppercase fallback `ZZZTESTBANK`), amount 9.99 USD |

These are binary files, so the GitHub contents API cannot upload them directly.
Regenerate them locally with:

```bash
cd e2e/fixtures && node gen-fixtures.mjs   # needs: python3 -m pip install qrcode[pil]
```

(zzz-test.png is generated with the same script pattern using bakongId `099999999@zzztestbank` and amount `9.99`.)
