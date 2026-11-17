import { Text, View } from 'react-native'
import { Zap } from 'lucide-react-native'
import { colors } from '../../constants/theme'

export function Logo({ subtitle = true }) {
  return <View style={{ alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <View style={{ backgroundColor: colors.blue, borderRadius: 10, padding: 8 }}><Zap size={20} color="#fff" fill="#fff" /></View>
      <Text style={{ color: colors.navy, fontSize: 24, fontWeight: '700' }}>Lab<Text style={{ color: colors.blue }}>X</Text>AI</Text>
    </View>
    {subtitle && <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>Ask. Explore. Experiment. Understand.</Text>}
  </View>
}
