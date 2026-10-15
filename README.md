# Orbit Tide — Yarık Sezonu · 1.3

React Native / Expo ile yazılmış, tek parmakla oynanan gerçek zamanlı 3B uzay oyunu. İç ve dış yörünge arasında geç, altın kristalleri topla ve pembe enerji kapılarından kaç.

## Bu sürümde

- **Yeni menü ve sahne:** 3B sektör vitrini, uzay sisi, enerji halkaları, mod kartları, çekirdek seçimi ve XP/seviye çubuğu.
- **Anomali:** önceden haber verilen hız/çift puan, ters akış ve çekim alanı olayları. Mor kapı çiftleri yaklaşırken yörünge değiştirir.
- **Faz:** 1,25 saniyelik koruma; bekleme süresinden sonra yeniden kullanılabilir. Kalkanı tüketmez.
- **Üç çekirdek:** Denge normal kuralları korur; Koruma kalkanla başlar ve daha az puan verir; Kaos hız ve puanı artırır.
- **Mini görev ve XP:** her tur bir yan hedef, tamamlanma bonusu ve kalıcı seviye ilerlemesi.
- **Nova:** kristaller ve yakın geçişlerle şarj olur. Etkinleştirildiğinde 5 saniye boyunca iki yörüngeden kristal çeker, puanı ikiye katlar ve tempoyu biraz artırır.
- **Kalkan:** mavi kristal bir çarpışmadan korur; kullanıldıktan sonra kısa bir koruma süresi bırakır.
- **Yakın geçiş:** kapıyı yakından ve güvenle geçmek +8 puan ve Nova şarjı verir.
- **Üç mod:** Anomali, Klasik ve 60 saniyelik yarış; rekorları ayrı tutulur.
- **Dört dil:** Türkçe, English, Deutsch ve Español. Oyun ekranları, yardım, ayarlar ve erişilebilirlik etiketleri çevrildi.
- **Üç renk evreni:** Violet, Aurora ve Solar.
- **Yeni OT logosu:** uygulama simgesi, açılış görseli, şeffaf işaret ve vektör yazılı logo.
- **13 özgün ses efekti + 32 saniyelik stereo müzik döngüsü.** Faz ve anomali uyarısı için yeni sesler.
- **İstatistikler:** üç modun rekorları, XP, görevler, atlatılan anomaliler, biten turlar, kristaller, en uzun seri, süre, Nova ve yakın geçiş sayıları.
- **Eski kayıtların korunması:** önceki rekor ve ses tercihleri yeni kayıt yapısına aktarılır.

## Akıcılık için yapılanlar

- Oyun kuralları 120 Hz sabit adımda hesaplanır; görüntü ara değerlerle çizilir. 30/60/120 FPS simülasyonları aynı oyun sonucunu üretir.
- Kristaller, kapılar, ray işaretleri ve motor izi ortak geometrilerle `InstancedMesh` üzerinden çizilir.
- Parçacıklar sabit boyutlu tamponlarda ve yeniden kullanılan 6 efekt yuvasında tutulur.
- Her karede React durum güncellemesi yapılmaz. Puan paneli ayrı bir depoya abone olur; düzenli güncelleme yaklaşık 9 Hz ile sınırlıdır.
- Malzeme, ışık ve geometri yükü azaltıldı; otomatik kalite, zorlanan cihazda yıldız/parçacık/ışık halesi yükünü azaltır. Web'de piksel yoğunluğu da sınırlanır. Expo GL, telefonda cihazın doğal çözünürlüğünü kullanır.
- Ana ekranda çizim en fazla 30 FPS; duraklatmada sürekli çizim kapalı. Arka planda oyun ve ses durur. Bitiş efektleri söndükten sonra sahne sürekli çizilmez.
- 3B sahne açılamazsa aynı oyun kurallarıyla çalışan uyumlu SVG görünümü devreye girer; 3B yeniden denenebilir.
- Sakin efektler seçeneği kamera sarsıntısını, puan büyümesini ve çarpışma flaşını azaltır.

Ölçüm ve sınırlar: `QA.md`. Her cihazda sıfır takılma garantisi verilmez; fiziksel Android/iPhone performans testi hâlâ gerekir.

## Çalıştırma

Node.js 22.13+ gerekir. Paketleri kur ve Expo'yu başlat:

```bash
npm ci
npx expo start
```

Expo SDK 57'yi destekleyen Expo Go sürümüyle QR kodunu aç. Android ve iOS aynı kaynak kodu kullanır. Cihazdaki Expo Go sürümü SDK'yı desteklemiyorsa geliştirme derlemesi gerekir. Expo GL sahnesini fiziksel telefonda dene; iOS simülatöründeki OpenGL davranışı farklı olabilir.

Web geliştirme önizlemesi:

```bash
npm run web
```

## Kontroller ve kurallar

- Sahneye veya alttaki yörünge düğmesine dokun: yörünge değişir.
- Altın kristal: puan, seri ve Nova şarjı artar. Her 5 kristalde çarpan yükselir; en fazla 5×, Nova sırasında en fazla 10×.
- Kristali kaçırmak seriyi sıfırlar. Mavi kalkan kristali seriyi bozmaz.
- Pembe kapıyla çarpışmak, kalkan yoksa turu bitirir. Nova kapılardan korumaz.
- Nova göstergesi %100 olunca düğmeye bas. 5 saniye boyunca mıknatıs ve çift puan alırsın.
- Web'de Space başlatır/yörünge değiştirir; N Nova'yı, X Faz'ı etkinleştirir; Escape duraklatır/devam eder. Düğmeler klavyeyle de kullanılabilir.
- Ayarlar, dil, renk evreni ve rekorlar cihazda saklanır. Kayıt hatası oluşursa arayüz bildirir.

## Android APK

Kaynak ve APK sürümleri `UlasUgurlu/Oyun2` deposunda tutulur. GitHub Actions imzalı ARM64 APK üretir, Three ESM girişini doğrular, Android 15 üzerinde açılış/kurulum testini çalıştırır ve kanıtları saklar. Başarılı testten sonra ayrı yayımlama işi APK'yı GitHub Releases üzerinden sunar: https://github.com/UlasUgurlu/Oyun2/releases.

Bu arşiv kaynak projedir. `eas.json` içindeki `preview` profili APK üretmek için hazırdır. Expo hesabında proje yapılandırıldıktan sonra:

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build -p android --profile preview
```

iOS kurulum derlemesi Apple hesabı ve imzalama ayarları gerektirir.

## Kontrolleri yeniden çalıştırma

```bash
npm run typecheck
npm test
npx expo install --check
npx expo export --platform all
```

Testler sabit zaman adımı, kapı çarpışması, kaçırılan kristal, duraklatma, kalkan, Nova, yakın geçiş, 60 saniyelik bitiş, çift puan hatası, açık yörünge, efekt havuzu, eski kayıt aktarımı ve çeviri bütünlüğünü kapsar. Paket uyumu bu ortamda Expo'nun yerel SDK listesiyle kontrol edildi; çevrimiçi sürüm sorgusu proxy zaman aşımına uğradı.

## Yapı

- `App.tsx`: arayüz, girişler, yaşam döngüsü ve kayıtlar.
- `src/game.ts`: çizimden bağımsız oyun kuralları ve sabit zaman adımı.
- `src/hud.ts`: puan panelinin ayrı güncelleme deposu.
- `src/preferences.ts`: ayarlar, istatistikler ve eski kayıt aktarımı.
- `src/i18n.ts`: dört dilin metinleri.
- `src/expansionI18n.ts`: Anomali, çekirdekler, Faz ve seviye metinleri.
- `src/ui/HomeMenu.tsx`: menü kartları, seviye ve sahne katmanları.
- `src/scene/OrbitWorld.tsx`: 3B modeller, toplu çizim ve parçacıklar.
- `src/scene/Scene.native.tsx`: Android/iOS GL katmanı.
- `src/scene/Scene.tsx`: web GL katmanı.
- `src/scene/CompatibleScene.tsx`: 3B açılamadığında uyumlu görünüm.
- `src/useGameAudio.ts`: ses yükleme, tekrar çalma, sessize alma ve duraklatma.
- `assets/`: hazır sesler, SVG ve PNG logo dosyaları.
- `tests/`: oyun ve kayıt testleri.

Görseller ve sesler bu proje için üretildi. Space Grotesk SIL Open Font License; Feather simgeleri MIT lisansı altında kullanılır. İsteğe bağlı yeniden üretim: sesler için NumPy ve FFmpeg, vektör logo için fontTools, PNG için sharp. Hazır dosyalar arşivde bulunur; betikleri çalıştırmak oyunu açmak için gerekli değildir.

Pazar araştırması: `RESEARCH.md`.
