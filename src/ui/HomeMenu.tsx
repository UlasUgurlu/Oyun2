import React,{useEffect,useRef,type ReactNode} from 'react';
import {Animated,Pressable,StyleSheet,Text,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import type {Core,Mode} from '../game';
import {levelProgress,type Profile} from '../preferences';
import type {ExpansionDictionary} from '../expansionI18n';
import {DICTIONARIES} from '../i18n';

type Words=typeof DICTIONARIES.tr & ExpansionDictionary;
const font={normal:'SpaceGrotesk_400Regular',medium:'SpaceGrotesk_500Medium',bold:'SpaceGrotesk_700Bold'};
const cores=[{id:'balanced',icon:'hexagon',color:'#c4b5fd'},{id:'guardian',icon:'shield',color:'#72e5ef'},{id:'volatile',icon:'zap',color:'#ffca89'}] as const;

export function HomeIntro({t,profile,compact,reducedMotion}:{t:Words;profile:Profile;compact:boolean;reducedMotion:boolean}){
 const rank=levelProgress(profile.xp),entry=useRef(new Animated.Value(reducedMotion?1:0)).current;
 useEffect(()=>{if(reducedMotion){entry.setValue(1);return;}const animation=Animated.timing(entry,{toValue:1,duration:420,useNativeDriver:true});animation.start();return()=>animation.stop();},[entry,reducedMotion]);
 return <Animated.View style={[styles.intro,compact&&{paddingTop:6,paddingBottom:5},{opacity:entry,transform:[{translateY:entry.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}]}>
  <View style={styles.eyebrowRow}><View style={styles.dot}/><Text numberOfLines={1} style={styles.eyebrow}>{t.homeKicker}</Text></View>
  <View style={[styles.titleRow,compact&&{marginTop:5}]}><View style={{flex:1}}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.title,compact&&{fontSize:29,lineHeight:33}]}>{t.homeTitle}</Text>{!compact&&<Text style={styles.copy}>{t.homeCopy}</Text>}</View>
   <LinearGradient colors={['#293342','#172230']} style={[styles.level,compact&&{paddingVertical:4}]}><Text style={styles.levelLabel}>{t.level}</Text><Text style={[styles.levelNumber,compact&&{fontSize:18,lineHeight:20}]}>{rank.level.toString().padStart(2,'0')}</Text></LinearGradient>
  </View>
  <View style={[styles.progress,compact&&{marginTop:6}]}><View style={[styles.progressFill,{width:`${rank.progress*100}%`}]}/></View>
  {!compact&&<View style={styles.progressLabels}><Text style={styles.progressText}>{rank.current} / {rank.required} {t.xp}</Text><Text style={styles.progressText}>{t.phases} · {t.anomalies} · {t.missions}</Text></View>}
 </Animated.View>;
}

export function MenuSceneOverlay({t,mode,core}:{t:Words;mode:Mode;core:Core}){
 const selected=cores.find(item=>item.id===core)!;
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  <View style={styles.sceneTop}><View style={styles.sceneLabel}><Feather name="radio" size={11} color="#a99bee"/><Text style={styles.sceneLabelText}>{mode==='rift'?t.sector:t[mode]}</Text></View><Text style={styles.coordinates}>07 / 03</Text></View>
  <View style={styles.sceneBottom}><View style={[styles.coreDot,{backgroundColor:selected.color}]}/><Text style={styles.sceneCore}>{t[core]}</Text><View style={styles.sceneRule}/><Text style={styles.sceneHint}>{mode==='rift'?t.newMechanics:t.subtitle}</Text></View>
 </View>;
}

export function HomeChoices({t,mode,core,onMode,onCore,compact,children,onHelp}:{t:Words;mode:Mode;core:Core;onMode:(mode:Mode)=>void;onCore:(core:Core)=>void;compact:boolean;children:ReactNode;onHelp:()=>void}){
 const active=mode==='rift',description=core==='balanced'?t.balancedCopy:core==='guardian'?t.guardianCopy:t.volatileCopy;
 return <View style={styles.choices}>
  <Pressable onPress={()=>onMode('rift')} accessibilityRole="button" accessibilityLabel={t.rift} accessibilityState={{selected:active}} style={({pressed})=>[styles.riftShell,active&&styles.riftSelected,pressed&&{opacity:.85}]}>
   <LinearGradient colors={active?['#30204b','#191d35']:['#171927','#141725']} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.rift,compact&&{minHeight:52,paddingVertical:8}]}>
    <View style={[styles.riftIcon,active&&{backgroundColor:'#7757c344'}]}><Feather name="aperture" size={22} color={active?'#c8a9ff':'#8b87a1'}/></View>
    <View style={{flex:1}}><View style={styles.riftTitleRow}><Text style={styles.riftTitle}>{t.rift}</Text><View style={styles.newBadge}><Text style={styles.newText}>{t.newMode}</Text></View></View><Text numberOfLines={compact?1:2} style={styles.riftCopy}>{t.riftCopy}</Text></View>
    <Feather name={active?'check-circle':'circle'} size={18} color={active?'#c7afff':'#514b69'}/>
   </LinearGradient>
  </Pressable>
  <View style={[styles.modeRow,compact&&{marginTop:5}]}>{(['classic','sprint'] as const).map(item=><Pressable key={item} onPress={()=>onMode(item)} accessibilityRole="button" accessibilityLabel={t[item]} accessibilityState={{selected:mode===item}} style={({pressed})=>[styles.mode,mode===item&&styles.modeSelected,pressed&&{opacity:.7}]}><Feather name={item==='classic'?'repeat':'clock'} size={14} color={mode===item?'#d9c8f8':'#8b859b'}/><Text numberOfLines={1} style={[styles.modeText,mode===item&&{color:'#eadbff'}]}>{t[item]}</Text></Pressable>)}</View>
  <View style={[styles.coreHeading,compact&&{marginTop:8,marginBottom:5}]}><Text style={styles.section}>{t.coreTitle}</Text><Feather name="cpu" size={11} color="#786e98"/></View>
  <View style={styles.coreRow}>{cores.map(item=><Pressable key={item.id} onPress={()=>onCore(item.id)} accessibilityRole="button" accessibilityLabel={t[item.id]} accessibilityState={{selected:core===item.id}} hitSlop={3} style={({pressed})=>[styles.core,core===item.id&&{borderColor:item.color+'99',backgroundColor:item.color+'14'},pressed&&{opacity:.7}]}><Feather name={item.icon} size={13} color={core===item.id?item.color:'#7f7896'}/><Text numberOfLines={1} style={[styles.coreText,core===item.id&&{color:item.color}]}>{t[item.id]}</Text></Pressable>)}</View>
  <Text numberOfLines={2} style={styles.coreCopy}>{description}</Text>
  <View style={[styles.start,compact&&{marginTop:8}]}>{children}</View>
  <View style={[styles.bottom,compact&&{height:24}]}><Pressable onPress={onHelp} accessibilityRole="button" accessibilityLabel={t.help} hitSlop={7} style={styles.help}><Feather name="help-circle" size={12} color="#a69bbb"/><Text style={styles.helpText}>{t.help}</Text></Pressable><Text numberOfLines={1} style={styles.note}>{t.menuNote}</Text></View>
 </View>;
}

const styles=StyleSheet.create({
 intro:{paddingHorizontal:24,paddingTop:13,paddingBottom:7},eyebrowRow:{flexDirection:'row',gap:6,alignItems:'center'},dot:{width:5,height:5,borderRadius:3,backgroundColor:'#be93ff'},eyebrow:{fontFamily:font.bold,fontSize:8,letterSpacing:1.45,color:'#a394c7',flexShrink:1},titleRow:{flexDirection:'row',alignItems:'center',gap:13,marginTop:7},title:{fontFamily:font.bold,fontSize:34,lineHeight:39,color:'#f4efff',letterSpacing:-1.4},copy:{fontFamily:font.normal,fontSize:10,color:'#9490aa',marginTop:3},level:{minWidth:54,paddingHorizontal:10,paddingVertical:6,borderRadius:13,borderWidth:1,borderColor:'#66cede44',alignItems:'center'},levelLabel:{fontFamily:font.bold,fontSize:6.5,letterSpacing:.9,color:'#85abb9'},levelNumber:{fontFamily:font.bold,fontSize:20,lineHeight:23,color:'#b9f1f5'},progress:{height:3,backgroundColor:'#23223c',borderRadius:3,marginTop:12,overflow:'hidden'},progressFill:{height:3,backgroundColor:'#93d8e7',borderRadius:3},progressLabels:{flexDirection:'row',justifyContent:'space-between',marginTop:5},progressText:{fontFamily:font.medium,fontSize:7,color:'#737185',letterSpacing:.4},
 sceneTop:{position:'absolute',top:12,left:14,right:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},sceneLabel:{flexDirection:'row',alignItems:'center',gap:6},sceneLabelText:{fontFamily:font.bold,fontSize:7,letterSpacing:1.1,color:'#a99bbe'},coordinates:{fontFamily:font.medium,fontSize:7,color:'#554d72',letterSpacing:1.5},sceneBottom:{position:'absolute',bottom:11,left:14,right:14,flexDirection:'row',alignItems:'center',gap:6},coreDot:{width:5,height:5,borderRadius:3},sceneCore:{fontFamily:font.bold,fontSize:8,color:'#c5bbd5'},sceneRule:{height:1,width:14,backgroundColor:'#554863'},sceneHint:{fontFamily:font.normal,fontSize:7.5,color:'#7c718f',flexShrink:1},
 choices:{paddingHorizontal:20,paddingTop:3},riftShell:{borderWidth:1,borderColor:'#2b2842',borderRadius:16,overflow:'hidden'},riftSelected:{borderColor:'#9673d488'},rift:{paddingVertical:11,paddingHorizontal:13,minHeight:62,flexDirection:'row',alignItems:'center',gap:11},riftIcon:{height:34,width:34,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:'#272238'},riftTitleRow:{flexDirection:'row',alignItems:'center',gap:7},riftTitle:{fontFamily:font.bold,fontSize:14,color:'#e7def8'},newBadge:{paddingVertical:2,paddingHorizontal:5,borderRadius:4,backgroundColor:'#bc9bf329'},newText:{fontFamily:font.bold,fontSize:6,color:'#c9aff9',letterSpacing:.6},riftCopy:{fontFamily:font.normal,fontSize:8.3,lineHeight:12,color:'#a196b7',marginTop:3},modeRow:{flexDirection:'row',gap:8,marginTop:7},mode:{flex:1,height:37,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,borderRadius:11,borderWidth:1,borderColor:'#2b2840',backgroundColor:'#131524'},modeSelected:{borderColor:'#8f74b8',backgroundColor:'#31233e'},modeText:{fontFamily:font.medium,fontSize:10,color:'#a198b3',flexShrink:1},coreHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:11,marginBottom:6},section:{fontFamily:font.bold,fontSize:7.3,letterSpacing:1.1,color:'#8b809e'},coreRow:{flexDirection:'row',gap:7},core:{flex:1,height:34,borderWidth:1,borderColor:'#2c2c41',borderRadius:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:'#171827',paddingHorizontal:5},coreText:{fontFamily:font.bold,fontSize:9,color:'#978da6',flexShrink:1},coreCopy:{fontFamily:font.normal,fontSize:8.5,lineHeight:12,minHeight:15,marginTop:6,color:'#8a839b',textAlign:'center'},start:{marginTop:9},bottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',height:30,gap:8},help:{flexDirection:'row',alignItems:'center',gap:5},helpText:{fontFamily:font.medium,fontSize:9,color:'#a69bbb'},note:{fontFamily:font.bold,fontSize:6.1,letterSpacing:.65,color:'#625b7b',flexShrink:1},
});
