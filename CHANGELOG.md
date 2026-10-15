# 1.3.0

- Menü yeniden tasarlandı: 3B sektör vitrini, mod kartları, çekirdek seçimi ve XP/seviye çubuğu.
- Uzay sisi, enerji halkaları, daha parlak yıldızlar ve anomaliye göre değişen sahne renkleri eklendi. Efektler ortak geometriler ve sınırlı nesne havuzlarıyla çalışır; düşük kalitede sis kapatılır.
- Anomali modu eklendi: Çifte Ateş hız ve puanı artırır, Ters Akış yaklaşma yönünü değiştirir, Çekim Alanı diğer yörüngeden kristal toplar. Olaylar önceden haber verilir; atlatıldığında bonus verilir.
- Mor kapı ve kristal çiftleri yaklaşırken yörünge değiştirir; çarpışma noktasına ulaşmadan önce güvenli yörünge netleşir.
- Faz sıçraması 1,25 saniyelik geçici koruma sağlar; bekleme süresinden sonra tekrar kullanılabilir. Kalkanı tüketmez.
- Denge, Koruma ve Kaos çekirdekleri farklı puan, hız ve koruma tercihleri sunar. Seçimin etkisi menüde açıklanır.
- Tur başına mini görev, tamamlanma bonusu, XP ve kalıcı seviye ilerlemesi eklendi. Eski rekorlar korunur; Anomali rekoru ayrıca kaydedilir.
- Faz ve anomali uyarısı için iki özgün stereo efekt eklendi. Yeni metinler dört dile çevrildi.
- Android sürüm kodu 3 yapıldı. Önceki açılış düzeltmesi ve aynı anahtarla güncelleme desteği korunur.
- 3B sahnenin yerel kapsayıcısı ekranlar arasında korunur; sahne hazır olmadan fizik ilerlemez. Menüden oyuna geçişte GL yüzeyinin yeniden oluşmasını önler.
- Test kapsamı 30 oyun/kayıt testine genişletildi; tarayıcıda gerçek 3B çizim, üç ekran boyutu ve normal girişlerle anomali döngüsü kontrolü eklendi.

# 1.2.1

- Android açılışında Three.js CommonJS girişindeki `process.emitWarning` çağrısından kaynaklanan kapanma düzeltildi. Metro, renderer ve sahnenin bütün Three içe aktarımlarını ortak ESM modülüne yönlendiriyor.
- Yerel Android kütüphaneleri kurulumda çıkarılıyor; uygulamanın seçili işlemci mimarisiyle yüklenmesi sağlanıyor.
- Android sürüm kodu 2 yapıldı; 1.2.0 üzerine güncellenebiliyor.
- APK yayımlama akışına Android 15 üzerinde gerçek uygulama başlatma ve arayüz kontrolü eklendi. Doğrulama geçmeden GitHub sürümü yayımlanmıyor.

# 1.2.0

## Oyun

Nova, tek kullanımlık kalkan, yakın geçiş puanı ve 60 saniyelik yarış eklendi. Klasik ve yarış rekorları ayrıldı; toplam istatistikler kaydediliyor. Violet, Aurora ve Solar evrenleri seçilebiliyor.

## Görsel ve ses

OT monogramı, uygulama simgesi ve yazılı logo yenilendi. Kalkan, Nova ve yarış bitişi için üç yeni stereo efekt eklendi. Dört dilde arayüz, yardım ve erişilebilirlik etiketleri eklendi.

## Performans ve düzeltmeler

- Sabit zaman adımı ve görüntü ara değerleri sayesinde farklı kare hızlarında tutarlı fizik.
- Toplu nesne çizimi, ortak geometriler, sabit parçacık tamponları ve yeniden kullanılan efekt yuvaları.
- Daha az ışık, sadeleştirilmiş malzemeler ve otomatik efekt kalitesi.
- Puan ekranının ayrı güncelleme deposu; kare başına React durum güncellemesi kaldırıldı.
- Sürekli ses durumu sorgulamasından kaynaklanan arayüz güncellemeleri kaldırıldı.
- Duraklatmada ve arka planda çizim/ses durması; bitiş ekranında efektler tamamlanınca çizimin durması.
- Mute/duraklatma sonrasında bekleyen ses tekrarlarının başlaması önlendi.
- Çarpışmayla aynı adımda toplanan kristalin yeniden puan vermesi önlendi.
- Uzun karelerde kapı üzerinden atlamayı önlemek için küçük fizik adımları.
- Eski rekor ve düşük güç tercihleri yeni yapıya aktarılıyor.
- Küçük ekran ayarları kaydırılabiliyor; uzun çeviriler sığıyor.
- Eksik yardım düğmesi etiketi ve geçersiz klasik mod simgesi düzeltildi.
- Webde kısa tıklamaların kaçırılması ve düğme odaktayken N kısayolunun çalışmaması düzeltildi.
- 3B bağlamı açılamazsa oynanabilir uyumlu SVG sahnesi.
