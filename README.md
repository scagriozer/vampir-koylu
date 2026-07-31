# 🧛 Vampir Köylü

Tek cihazla, masa etrafında oynanan Vampir Köylü. Uygulama anlatıcı (moderatör) rolünü üstlenir:
oyuncular telefonu/tableti elden ele dolaştırarak rollerini gizlice görür, gece görevlerini yapar
ve gündüz oylamasını yürütür. Ayrı bir anlatıcıya gerek yoktur, herkes oyunun içinde olur.

**4–12 oyuncu.** Varsayılan masa 6 kişilik: 2 vampir, 1 doktor, 1 gözcü, 2 köylü.

## Nasıl oynanır?

1. **Kurulum** — İsimleri masadaki oturma sırasına göre yaz, rol dağılımını ve ayarları seç.
2. **Rol dağıtımı** — Cihaz sırayla her oyuncuya verilir. Herkes kartını gizlice açar, ezberler, kapatır.
3. **Gece** — Uygulama sırayla vampirleri, doktoru ve gözcüyü uyandırır; her biri masadan hedefini seçer.
   Vampirler bu ekranda yalnızca birbirini görür, diğer roller kapalı kalır.
4. **Şafak** — Gece kimin öldüğü (ya da doktorun kimi kurtardığı) açıklanır, ölenin kimliği açılır.
5. **Tartışma** — Geri sayım boyunca herkes konuşur; süre duraklatılabilir, +30 sn eklenebilir.
6. **Oylama** — Hayatta olan herkes sırayla oy verir. En çok oyu alan sürgün edilir ve kimliği açılır;
   oylar eşitse kimse gitmez.
7. **Bitiş** — Tüm roller açılır, kazanan taraf ve olay günlüğü listelenir.

**Kazanma koşulu:** Tüm vampirler elenirse köy kazanır. Vampir sayısı köylü sayısına eşitlenirse
vampirler kazanır.

### Roller

| Rol | Takım | Görev |
| --- | --- | --- |
| 🧛 Vampir | Vampir | Her gece diğer vampirlerle birlikte bir köylü seçer. |
| 💉 Doktor | Köy | Her gece bir kişiyi korur; o kişi o gece saldırıdan kurtulur. |
| 🔮 Gözcü | Köy | Her gece bir oyuncuyu inceler, vampir olup olmadığını öğrenir. |
| 🌾 Köylü | Köy | Gece görevi yok; gündüz tartışmasında doğru oyu vermeye çalışır. |

### Ayarlar

- **Tartışma süresi** — 1–5 dakika arası geri sayım.
- **Gizli oylama** — Açıkken cihaz elden ele dolaşır ve kimse kimin oyunu görmez; kapalıyken
  oylar sırayla açıkça girilir ve masada çalışan sayım görünür.
- **Doktor üst üste aynı kişiyi koruyabilir** — Kapalıyken önceki gece korunan kişi tekrar seçilemez.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # üretim derlemesi
npm run lint
```

Next.js App Router + React + Tailwind CSS. Sunucu, veritabanı ya da ortam değişkeni gerektirmez;
oyun tamamen tarayıcıda çalışır ve statik olarak dağıtılabilir.

## Mimari

| Dosya | Ne yapar |
| --- | --- |
| `src/lib/oyun/vampirKoylu.ts` | Saf oyun motoru: rol dağıtımı, gece/gündüz döngüsü, oy sayımı, kazanan kontrolü. React/DOM bağımsız, tüm geçişler `oyunReducer` üzerinden. |
| `src/components/oyun/VampirKoyluOyun.tsx` | Durumu tutar, aşamaya göre ekranı seçer, oyunu `localStorage`'a yazar. |
| `src/components/oyun/MasaGorunumu.tsx` | Koltukları daire üzerine dizen masa görünümü (gece/gündüz teması, ölüler, açılan roller, oy rozetleri). |
| `src/components/oyun/*Ekrani.tsx` | Kurulum, rol dağıtımı, gece, gündüz ve bitiş ekranları. |

Oyun durumu `localStorage`'a serialize edildiği için sayfa yenilense bile masa kaldığı yerden
devam eder; şafak adımı idempotenttir, yenileme gece sonucunu iki kez uygulamaz.

Oyun tamamen istemcide çalışır (`ssr: false`), böylece devam eden bir masa ilk render'da geri
yüklenir ve kurulum ekranı bir an bile görünmez.
