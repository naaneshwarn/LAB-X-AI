import { Text, View } from 'react-native'
import { colors } from '../constants/theme'

export function ScreenHeader({ eyebrow, title, action }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
    <View><Text style={{ color: colors.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' }}>{eyebrow}</Text><Text style={{ color: colors.navy, fontSize: 29, fontWeight: '700', marginTop: 8 }}>{title}</Text></View>
    {action}
  </View>
}
