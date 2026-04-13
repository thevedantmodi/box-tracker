import {useState, useRef, useCallback} from 'react'
import {View, Text, TouchableOpacity, StyleSheet, Linking} from 'react-native'
import {CameraView, useCameraPermissions, type BarcodeScanningResult} from 'expo-camera'
import {useRouter} from 'expo-router'
import {useFocusEffect} from '@react-navigation/native'
import {getBoxByQrCode} from '@boxtrack/core'

const DEBOUNCE_MS = 2000

export default function ScanScreen() {
	const router = useRouter()
	const [permission, requestPermission] = useCameraPermissions()
	const [active, setActive] = useState(true)
	const cooldownRef = useRef(false)

	// Re-enable scanner each time screen is focused
	useFocusEffect(
		useCallback(() => {
			setActive(true)
			cooldownRef.current = false
		}, [])
	)

	async function handleBarcodeScan(result: BarcodeScanningResult) {
		if (cooldownRef.current) return
		cooldownRef.current = true
		setActive(false)

		const code = result.data
		try {
			const box = await getBoxByQrCode(code)
			if (box) {
				router.push(`/box/${box.id}`)
			} else {
				router.push({pathname: '/box/new', params: {qr_code: code}})
			}
		} catch {
			// On error, re-enable scanner after cooldown
			setTimeout(() => {
				cooldownRef.current = false
				setActive(true)
			}, DEBOUNCE_MS)
		}
	}

	// Permission not yet determined
	if (permission === null) {
		return <View style={styles.container} />
	}

	// Permission denied
	if (!permission.granted) {
		return (
			<View style={styles.container}>
				<Text style={styles.permTitle}>Camera access needed</Text>
				<Text style={styles.permText}>
					BoxTrack needs camera access to scan QR codes on your boxes.
				</Text>
				{permission.canAskAgain ? (
					<TouchableOpacity style={styles.button} onPress={requestPermission}>
						<Text style={styles.buttonText}>Grant access</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity style={styles.button} onPress={() => Linking.openSettings()}>
						<Text style={styles.buttonText}>Open Settings</Text>
					</TouchableOpacity>
				)}
			</View>
		)
	}

	return (
		<View style={styles.container}>
			{active ? (
				<CameraView
					style={StyleSheet.absoluteFill}
					facing="back"
					onBarcodeScanned={handleBarcodeScan}
					barcodeScannerSettings={{barcodeTypes: ['qr']}}
				/>
			) : null}
			<View style={styles.overlay}>
				<View style={styles.frame} />
				<Text style={styles.hint}>Point camera at a QR code</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
		justifyContent: 'center',
		alignItems: 'center',
	},
	permTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#fff',
		marginBottom: 12,
		textAlign: 'center',
		paddingHorizontal: 32,
	},
	permText: {
		fontSize: 15,
		color: '#aaa',
		textAlign: 'center',
		paddingHorizontal: 32,
		marginBottom: 24,
	},
	button: {
		backgroundColor: '#2563eb',
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 10,
	},
	buttonText: {color: '#fff', fontWeight: '600', fontSize: 16},
	overlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
	},
	frame: {
		width: 220,
		height: 220,
		borderWidth: 3,
		borderColor: '#fff',
		borderRadius: 12,
		backgroundColor: 'transparent',
	},
	hint: {
		color: '#fff',
		marginTop: 20,
		fontSize: 15,
	},
})
