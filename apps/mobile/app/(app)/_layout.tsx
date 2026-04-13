import {Text} from 'react-native'
import {Tabs} from 'expo-router'

export default function AppLayout() {
	return (
		<Tabs screenOptions={{headerShown: false}}>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Boxes',
					tabBarIcon: ({color}) => <TabIcon label="📦" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="scan"
				options={{
					title: 'Scan',
					tabBarIcon: ({color}) => <TabIcon label="⬛" color={color} />,
				}}
			/>
			{/* Hide detail/edit/new routes from tab bar */}
			<Tabs.Screen name="box/[id]" options={{href: null}} />
			<Tabs.Screen name="box/edit/[id]" options={{href: null}} />
			<Tabs.Screen name="box/new" options={{href: null}} />
		</Tabs>
	)
}

function TabIcon({label, color}: {label: string; color: string}) {
	return <Text style={{fontSize: 20, color}}>{label}</Text>
}
