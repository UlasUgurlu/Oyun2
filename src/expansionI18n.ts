import type {Language} from './preferences';

const tr={
 homeKicker:'YARIK SEZONU · 01',homeTitle:'Yörüngeyi kır.',homeCopy:'Uzay kuralları burada değişir.',sector:'YARIK MERKEZİ',newMode:'YENİ',
 rift:'Anomali',riftCopy:'Ters akış · kayan kapılar · çifte puan',coreTitle:'ÇEKİRDEĞİNİ SEÇ',
 balanced:'Denge',balancedCopy:'9 sn faz · dengeli risk ve ödül',guardian:'Koruma',guardianCopy:'İlk kalkan hazır · %15 daha az puan',volatile:'Kaos',volatileCopy:'+%40 puan · +%10 hız · 12 sn faz',
 phase:'FAZ',phaseReady:'HAZIR',phaseActive:'FAZ AKTİF',phaseAction:'Faz sıçraması',phaseCopy:'1,25 saniye kapılardan geç. Güç yenilenene kadar bekle.',
 anomalyWarning:'YARIK YAKLAŞIYOR',surge:'ÇİFTE ATEŞ',surgeCopy:'Hız yükselir; kristaller 2× puan verir.',mirror:'TERS AKIŞ',mirrorCopy:'Yörünge tersine döner. Kontrol sende.',magnet:'ÇEKİM ALANI',magnetCopy:'İki yörüngedeki kristaller sana gelir.',anomalyClear:'YARIK AŞILDI',nextAnomaly:'SONRAKİ YARIK',
 mission:'MİNİ GÖREV',missionCollect:'18 kristal topla',missionPhase:'2 faz sıçraması yap',missionNear:'3 yakın geçiş yap',missionDone:'GÖREV TAMAMLANDI',missionReward:'+150 PUAN · +35 XP',
 xp:'XP',level:'SEVİYE',runXP:'TUR XP',missions:'GÖREV',phases:'FAZ',anomalies:'YARIK',riftBest:'ANOMALİ REKOR',shiftGates:'KAYAN KAPILAR',shiftHelp:'Mor kapılar uzakta yörünge değiştirir. Sana yaklaşmadan önce yeni yörüngelerine yerleşirler.',newMechanics:'Yarıklarda hayatta kal.',menuNote:'FAZ + NOVA · 3 ÇEKİRDEK',
};
export type ExpansionDictionary=Record<keyof typeof tr,string>;
const en:ExpansionDictionary={
 homeKicker:'RIFT SEASON · 01',homeTitle:'Break your orbit.',homeCopy:'The rules of space change here.',sector:'RIFT CORE',newMode:'NEW',
 rift:'Anomaly',riftCopy:'Reverse flow · shifting gates · double points',coreTitle:'CHOOSE YOUR CORE',
 balanced:'Balance',balancedCopy:'9 s phase · balanced risk and reward',guardian:'Guardian',guardianCopy:'Start with a shield · 15% fewer points',volatile:'Chaos',volatileCopy:'+40% points · +10% speed · 12 s phase',
 phase:'PHASE',phaseReady:'READY',phaseActive:'PHASE ACTIVE',phaseAction:'Phase jump',phaseCopy:'Pass through gates for 1.25 seconds. Wait for the ability to recharge.',
 anomalyWarning:'RIFT INCOMING',surge:'OVERDRIVE',surgeCopy:'Move faster; crystals score 2× points.',mirror:'REVERSE FLOW',mirrorCopy:'The orbit reverses. You stay in control.',magnet:'MAGNET FIELD',magnetCopy:'Crystals from both orbits come to you.',anomalyClear:'RIFT SURVIVED',nextAnomaly:'NEXT RIFT',
 mission:'SIDE MISSION',missionCollect:'Collect 18 crystals',missionPhase:'Use 2 phase jumps',missionNear:'Make 3 near misses',missionDone:'MISSION COMPLETE',missionReward:'+150 POINTS · +35 XP',
 xp:'XP',level:'LEVEL',runXP:'RUN XP',missions:'MISSIONS',phases:'PHASES',anomalies:'RIFTS',riftBest:'ANOMALY BEST',shiftGates:'SHIFTING GATES',shiftHelp:'Purple gates change orbit at a distance. They settle in their new orbit before reaching you.',newMechanics:'Survive the rifts.',menuNote:'PHASE + NOVA · 3 CORES',
};
const de:ExpansionDictionary={
 homeKicker:'RISS-SAISON · 01',homeTitle:'Sprenge die Bahn.',homeCopy:'Hier ändern sich die Regeln des Alls.',sector:'RISS-KERN',newMode:'NEU',
 rift:'Anomalie',riftCopy:'Richtungswechsel · bewegte Tore · doppelte Punkte',coreTitle:'WÄHLE DEINEN KERN',
 balanced:'Balance',balancedCopy:'9 s Phase · ausgewogenes Risiko',guardian:'Wächter',guardianCopy:'Start mit Schild · 15% weniger Punkte',volatile:'Chaos',volatileCopy:'+40% Punkte · +10% Tempo · 12 s Phase',
 phase:'PHASE',phaseReady:'BEREIT',phaseActive:'PHASE AKTIV',phaseAction:'Phasensprung',phaseCopy:'Passiere Tore für 1,25 Sekunden. Warte, bis sich die Fähigkeit auflädt.',
 anomalyWarning:'RISS NÄHERT SICH',surge:'TURBO',surgeCopy:'Höheres Tempo; Kristalle geben 2× Punkte.',mirror:'UMKEHR',mirrorCopy:'Die Umlaufbahn dreht um. Du behältst die Kontrolle.',magnet:'MAGNETFELD',magnetCopy:'Kristalle aus beiden Bahnen kommen zu dir.',anomalyClear:'RISS ÜBERSTANDEN',nextAnomaly:'NÄCHSTER RISS',
 mission:'NEBENAUFGABE',missionCollect:'18 Kristalle sammeln',missionPhase:'2 Phasensprünge nutzen',missionNear:'3 Mal knapp ausweichen',missionDone:'AUFGABE ERLEDIGT',missionReward:'+150 PUNKTE · +35 XP',
 xp:'XP',level:'STUFE',runXP:'RUNDEN-XP',missions:'AUFGABEN',phases:'PHASEN',anomalies:'RISSE',riftBest:'ANOMALIE-REKORD',shiftGates:'BEWEGTE TORE',shiftHelp:'Violette Tore wechseln ihre Bahn in der Ferne. Vor der Ankunft ist ihre neue Bahn festgelegt.',newMechanics:'Überstehe die Risse.',menuNote:'PHASE + NOVA · 3 KERNE',
};
const es:ExpansionDictionary={
 homeKicker:'TEMPORADA DE GRIETAS · 01',homeTitle:'Rompe tu órbita.',homeCopy:'Aquí cambian las reglas del espacio.',sector:'NÚCLEO DE GRIETAS',newMode:'NUEVO',
 rift:'Anomalía',riftCopy:'Flujo inverso · puertas móviles · puntos dobles',coreTitle:'ELIGE TU NÚCLEO',
 balanced:'Equilibrio',balancedCopy:'Fase de 9 s · riesgo equilibrado',guardian:'Guardián',guardianCopy:'Empieza con escudo · 15% menos puntos',volatile:'Caos',volatileCopy:'+40% puntos · +10% velocidad · fase 12 s',
 phase:'FASE',phaseReady:'LISTA',phaseActive:'FASE ACTIVA',phaseAction:'Salto de fase',phaseCopy:'Atraviesa puertas durante 1,25 segundos. Espera a que se recargue el poder.',
 anomalyWarning:'SE ACERCA UNA GRIETA',surge:'SOBRECARGA',surgeCopy:'Más velocidad; los cristales dan 2× puntos.',mirror:'FLUJO INVERSO',mirrorCopy:'La órbita cambia de sentido. Tú tienes el control.',magnet:'CAMPO MAGNÉTICO',magnetCopy:'Los cristales de ambas órbitas vienen a ti.',anomalyClear:'GRIETA SUPERADA',nextAnomaly:'PRÓXIMA GRIETA',
 mission:'MISIÓN EXTRA',missionCollect:'Recoge 18 cristales',missionPhase:'Usa 2 saltos de fase',missionNear:'Haz 3 evasiones cercanas',missionDone:'MISIÓN COMPLETA',missionReward:'+150 PUNTOS · +35 XP',
 xp:'XP',level:'NIVEL',runXP:'XP DE PARTIDA',missions:'MISIONES',phases:'FASES',anomalies:'GRIETAS',riftBest:'RÉCORD ANOMALÍA',shiftGates:'PUERTAS MÓVILES',shiftHelp:'Las puertas moradas cambian de órbita a distancia. Se fijan en su nueva órbita antes de llegar.',newMechanics:'Sobrevive a las grietas.',menuNote:'FASE + NOVA · 3 NÚCLEOS',
};
export const EXPANSION_TEXT:Record<Language,ExpansionDictionary>={tr,en,de,es};
