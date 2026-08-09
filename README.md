# 🧛 Vampir Köylü

Tek cihazla, masa etrafında oynanan Vampir Köylü. Uygulama anlatıcı (moderatör) rolünü üstlenir:
oyuncular telefonu/tableti elden ele dolaştırarak rollerini gizlice görür, gece görevlerini yapar
ve gündüz oylamasını yürütür. Ayrı bir anlatıcıya gerek yoktur, herkes oyunun içinde olur.

**4–12 oyuncu.** Varsayılan masa 6 kişilik: 2 vampir, 1 doktor, 1 gözcü, 2 köylü.

**Oyna:** https://scagriozer.github.io/vampir-koylu/ — telefonda açıp *Paylaş → Ana Ekrana Ekle*
dersen tam ekran uygulama gibi çalışır.

## Nasıl oynanır?

1. **Kurulum** — İsimleri masadaki oturma sırasına göre yaz, rol dağılımını ve ayarları seç.
2. **Rol dağıtımı** — Cihaz sırayla her oyuncuya verilir. Herkes kartını gizlice açar, ezberler, kapatır.
3. **Gece** — Cihaz koltuk sırasıyla **herkese** uğrar. Vampir avını, doktor koruduğu kişiyi, gözcü
   incelediği kişiyi seçer; gece görevi olmayan köylü de sırasını alıp devreder. Devir ve kapanış
   ekranları her oyuncuda birebir aynı olduğundan masadakiler ekrandan kimsenin rolünü çıkaramaz.
   Vampirler yalnızca birbirini tanır; farklı kişileri seçerlerse kurban çoğunluğa göre belirlenir.
4. **Şafak** — Gece kimin öldüğü (ya da doktorun kimi kurtardığı) açıklanır.
5. **Tartışma** — Geri sayım boyunca herkes konuşur; süre duraklatılabilir, +30 sn eklenebilir.
6. **Oylama** — Hayatta olan herkes sırayla oy verir. En çok oyu alan sürgün edilir; oylar eşitse
   kimse gitmez.
7. **Bitiş** — Tüm roller açılır, kazanan taraf ve olay günlüğü listelenir.

**Kazanma koşulu:** Tüm vampirler elenirse köy kazanır; vampir sayısı diğerlerine eşitlenirse
vampirler kazanır. Soytarı asılırsa oyunu tek başına kazanır. Ayrıca doktor hayatta değilken gece
saldırısı sayıyı eşitliğe getirecekse, formalite gecesi oynatılmaz: oyun geceye girmeden vampir
zaferiyle biter.

### Roller

| Rol | Takım | Görev |
| --- | --- | --- |
| 🧛 Vampir | Vampir | Her gece bir köylü seçer; vampirler birbirini tanır, ayrışırlarsa çoğunluk kazanır. |
| 💉 Doktor | Köy | Her gece bir kişiyi korur; o kişi o gece saldırıdan kurtulur. |
| 🔮 Gözcü | Köy | Her gece bir oyuncuyu inceler, vampir olup olmadığını öğrenir. |
| 🌾 Köylü | Köy | Gece görevi yok; gündüz tartışmasında doğru oyu vermeye çalışır. |
| 🃏 Soytarı | Tarafsız | Tek amacı kendini astırmak: asılırsa oyunu tek başına kazanır ve oyun biter. Gece ölürse kaybeder. |
| 🎒 Sağ Kalan | Tarafsız | Oyun bittiğinde hayattaysa, kazanan kim olursa olsun o da kazanır. |

### Ayarlar

- **Tartışma süresi** — 1–5 dakika arası geri sayım (varsayılan 4 dk).
- **Gizli oylama** — Açıkken cihaz elden ele dolaşır ve kimse kimin oyunu görmez; kapalıyken
  oylar sırayla açıkça girilir ve masada çalışan sayım görünür.
- **Doktor üst üste aynı kişiyi koruyabilir** — Kapalıyken önceki gece korunan kişi tekrar seçilemez.
- **Ölenlerin kimliği açıklansın** (varsayılan kapalı) — Açıkken ölen ya da sürgün edilen kişinin
  rolü masaya duyurulur (köy bilgi kazanır, yeni başlayanlar için kolay). Kapalıyken kimlik gizli
  kalır; köy doğru kişiyi asıp asmadığını bilemez, vampirlerin blöf alanı genişler. Kimlikler her
  hâlükârda oyun sonunda açılır.
- **Ses ve titreşim** (varsayılan açık) — Gece/şafak/zafer efektleri, sayaç uyarıları; titreşim
  Android'de çalışır. `public/sesler/essela.mp3` eklenirse "kimse ölmedi" şafağında o klip çalar
  (ilk 4 sn + fade-out) — ayrıntı: `public/sesler/README.md`.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # üretim derlemesi
npm run lint
```

Next.js App Router + React + Tailwind CSS. Sunucu, veritabanı ya da ortam değişkeni gerektirmez;
oyun tamamen tarayıcıda çalışır ve statik olarak dağıtılabilir.

## Yayınlama

`main` dalına her push'ta `.github/workflows/pages.yml` statik çıktıyı üretip GitHub Pages'e
yayınlar. İlk kullanımda depo ayarlarından **Settings → Pages → Source: GitHub Actions**
seçilmelidir (private depolarda Pages ücretli plan ister).

Pages alt yolda yayınladığı için derleme `PAGES_BASE_PATH` ortam değişkeniyle yapılır; iş akışı
bunu depo adından otomatik verir. Değişken boşken uygulama kök dizinde çalışır, bu yüzden aynı
kod Vercel gibi bir yere de değişiklik gerektirmeden dağıtılabilir:

```bash
npm run build                              # kök dizin için (out/)
PAGES_BASE_PATH=/vampir-koylu npm run build   # alt yol için
```

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
