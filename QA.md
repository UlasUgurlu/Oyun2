# Orbit Tide — Doğrulama raporu

## Android 1.2.1 açılış düzeltmesi

1.2.0'ın Android 15 üzerinde başlatılması kapanmayla sonuçlandı. ARM64 APK'nın x86_64 emülatöründeki çeviri köprüsü için yerel kütüphane çıkarımı etkinleştirildiğinde asıl JavaScript hatası görüldü: `[runtime not ready]: TypeError: undefined is not a function`.

Hermes kayıtları yeniden oluşturulan kaynak haritasıyla `three/build/three.cjs:12` satırına eşlendi. Bu giriş modülü Node.js'e özgü `process.emitWarning` çağırıyordu. Metro çözümleyicisi, React Three Fiber ve oyunun Three içe aktarımlarını `three.module.js` üzerinden ortak modüle yönlendiriyor. Yerel Android dışa aktarımının kaynak haritasında `three.cjs` bulunmadığı doğrulandı.

1.2.1 yayımlama akışı imza, JavaScript paketi, temel ARM64 kütüphaneleri ve kaynak haritasını doğrular. Ardından API 35 Google APIs emülatöründe aynı ARM64 APK ile eski sürüm üzerine kurulum, hazır ana ekran, dil seçimi, oyun başlatma, duraklatma, arka plandan dönme ve yeniden açılış kontrollerini çalıştırır. Test geçmeden sürüm yayımlanmaz. Günlükler ve ekran görüntüleri iş akışına eklenir. Bu emülatör doğrulaması fiziksel Samsung cihaz testi değildir.

## 1.2.0 web ve oyun motoru kontrolleri

Tarih: 14 Ekim 2026.

## Performans ölçümü

Aynı 390 × 844 web görünümü, aynı başlangıç sahnesi ve aynı ölçüm betiği kullanıldı. Chromium 153, Playwright ve SwiftShader yazılım WebGL ortamında GPU çizim çağrıları sayıldı. Ana ekran ısındıktan sonra 2 saniye örneklendi; duraklatma geçişi tamamlandıktan sonra ayrıca 1,1 saniye izlendi.

| Ölçüm | 1.1 | 1.2 |
| --- | ---: | ---: |
| Çizilen kare başına ortalama çizim çağrısı | 92 | 34 |
| Duraklatmada sürekli çizilen kare, 1,1 saniyede | 10 | 0 |
| Yakalanan JavaScript hatası | 0 | 0 |

Çizim çağrılarında **%63 azalma** ölçüldü. Bu telefon FPS ölçümü değildir. Gerçek cihazda çözünürlük, GPU, ısı, batarya ve sistem yükü sonucu değiştirir. Yeni sürüm otomatik kalite ayarıyla açıldı; başlangıç seviyesi orta kalitedir.

## Oyun motoru ve kayıtlar

`npm run typecheck`: geçti. `npm test`: 20 test geçti.

- 30, 60 ve 120 FPS zaman adımlarında aynı simülasyon sonucu.
- Uzun karelerde kapı çarpışmasının atlanmaması.
- Geçersiz zaman değerlerinin oyun durumunu bozmaması.
- Kristalin yalnızca bir kez puan vermesi; aynı adımda çarpışma olduğunda tekrar sayılmaması.
- Kaçırılan kristalin seriyi sıfırlaması.
- Yörünge geçişi ve duraklatmada durumun değişmemesi.
- Kalkan toplama, bir darbeyi emme ve sonraki darbede tur bitişi.
- Nova şarj koşulu, diğer yörüngeden toplama, çift puan ve sürenin bitmesi.
- Yakın geçiş puanının yalnızca bir kez verilmesi.
- Yarışın tam 60 saniyede bir kez bitmesi.
- 200 farklı tohum ve çok sayıda üretim penceresinde açık yörünge ve sınırlı nesne sayısı.
- Binlerce geçişte sabit efekt havuzunun korunması.
- Eski tercih/rekor aktarımı, bozuk kayıtta güvenli varsayılanlar, ayrı mod rekorları.
- Dört dilde eksiksiz arayüz ve erişilebilirlik metinleri.

## Görsel, ses ve arayüz

Gerçek WebGL çizimiyle 390 × 844, 360 × 640 ve 320 × 568 görünüşleri kontrol edildi. Küçük ekranda ana oynatma düğmesi ekran içinde; ayarlar ve uzun çeviriler kaydırılabilir.

Türkçe, İngilizce, Almanca ve İspanyolca ayarlar, yardım ve rekor ekranları açıldı. Dil ve Aurora tema tercihi yeniden yükleme sonrasında korundu. Eski 432 puanlık rekor aktarımı doğrulandı.

Ses başlangıcı, müzik döngüsü ve 0,34 müzik sesi seviyesi kontrol edildi. Duraklatmada zaman ve ses durdu. Efekt ve müzik kapatıldığında bekleyen tekrarlar çalmadı.

11 efekt dosyası 44,1 kHz, 16 bit stereo PCM olarak kontrol edildi; tam ölçek sınırında kırpılmış örnek bulunmadı. Yeni logo PNG dosyaları görsel olarak incelendi; SVG kaynakları arşivde bulunur.

## Tam tur ve uyumlu görünüm

Yalnızca normal arayüz girişleriyle oynatılan 60 saniyelik web turu tam 60 saniyede başarıyla bitti: 10.608 puan, 132 kristal, 7 Nova kullanımı. Kalkan alındı ve bir kapı çarpışması özellikle yaptırılarak koruma doğrulandı. Kontrol düğmesi odaktayken N kısayoluyla Nova etkinleşti. Yarış rekoru ve tur sayısı bir kez kaydedildi; Klasik rekor 432 olarak kaldı. Yeniden yüklemede rekorlar ve sessize alma tercihi korundu.

Kısa tıklamalar ve odaklanmış kontrol düğmesinde Space ile yörünge değişimi kontrol edildi. Arka plana geçişte otomatik duraklatma doğrulandı.

WebGL bağlamının kullanılamadığı ayrı bir tarayıcı oturumunda SVG görünümü devreye girdi. Tur başladı, kristal toplandı ve duraklatma zamanı dondurdu. Normal 3B test oturumunda JavaScript ve konsol hatası görülmedi.

## Paketleme ve sınırlar

Android, iOS ve web için Expo dışa aktarma tamamlandı. Android/iOS Hermes JavaScript paketlerinin üretimi doğrulandı; bu bir APK/IPA derlemesi veya cihaz kurulumu değildir.

Paketler Expo SDK 57'nin kurulu uyumluluk listesiyle karşılaştırıldı; uyumlu bulundu. Çevrimiçi `expo install --check` sorgusu proxy zaman aşımına uğradığı için yerel kontrol kullanıldı.

Fiziksel Android ve iPhone bu ortamda bulunmuyor. Mağaza yayınından önce cihazda dokunma gecikmesi, ses kesintileri, GL bağlamının arka plandan dönmesi, uzun oturumda ısı/batarya ve yerel erişilebilirlik davranışı kontrol edilmelidir. Her cihazda sıfır takılma veya hiç hata olmaması garantisi verilmez.
