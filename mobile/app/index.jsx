import { useState } from 'react'
import { Pressable, SafeAreaView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowRight, Beaker, Bot, ChevronRight, Globe2, Sparkles } from 'lucide-react-native'
import { Logo } from '../components/Logo'
import { colors } from '../constants/theme'

const slides = [
  { icon: Sparkles, title: 'Explore science', text: 'Turn every question into a hands-on discovery.' },
  { icon: Beaker, title: 'Experiment freely', text: 'Use virtual labs to test ideas safely and confidently.' },
  { icon: Bot, title: 'Understand more', text: 'Get clear explanations when you need a little help.' },
]

export default function Onboarding() {
  const [index, setIndex] = useState(0)
  const slide = slides[index]
  const Icon = slide.icon
  const next = () => index === slides.length - 1 ? router.replace('/dashboard') : setIndex(index + 1)
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><View style={{ flex: 1, padding: 26, justifyContent: 'space-between' }}>
    <View style={{ alignItems: 'flex-end' }}><Pressable onPress={() => router.replace('/dashboard')}><Text style={{ color: colors.muted, fontSize: 13 }}>Skip</Text></Pressable></View>
    <View style={{ alignItems: 'center' }}><Logo /><View style={{ backgroundColor: colors.blueLight, width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginVertical: 52 }}><Icon size={64} color={colors.blue} /></View><Text style={{ color: colors.navy, fontSize: 28, fontWeight: '700', textAlign: 'center' }}>{slide.title}</Text><Text style={{ color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 13, maxWidth: 290 }}>{slide.text}</Text></View>
    <View><View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 22 }}>{slides.map((_, dot) => <View key={dot} style={{ width: dot === index ? 24 : 7, height: 7, borderRadius: 5, backgroundColor: dot === index ? colors.blue : '#D8E3F3' }} />)}</View><Pressable onPress={next} style={{ backgroundColor: colors.blue, padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}><Text style={{ color: '#fff', fontWeight: '700' }}>{index === slides.length - 1 ? 'Get started' : 'Next'}</Text>{index === slides.length - 1 ? <ArrowRight size={17} color="#fff" /> : <ChevronRight size={17} color="#fff" />}</Pressable></View>
  </View></SafeAreaView>
}
