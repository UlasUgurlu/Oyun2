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
