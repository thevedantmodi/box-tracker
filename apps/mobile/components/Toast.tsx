import {useEffect, useRef, useState} from 'react'
import {Animated, Text, StyleSheet} from 'react-native'

type ToastState = {message: string; id: number} | null

// Global setter — populated when Toast mounts
let _setToast: ((t: ToastState) => void) | null = null
let _nextId = 0

export function showToast(message: string) {
	_setToast?.({message, id: ++_nextId})
}

export function Toast() {
	const [toast, setToast] = useState<ToastState>(null)
	const opacity = useRef(new Animated.Value(0)).current

	useEffect(() => {
		_setToast = setToast
		return () => {
			_setToast = null
		}
	}, [])

	useEffect(() => {
		if (!toast) return
		opacity.setValue(0)
		Animated.sequence([
			Animated.timing(opacity, {toValue: 1, duration: 200, useNativeDriver: true}),
			Animated.delay(1800),
			Animated.timing(opacity, {toValue: 0, duration: 300, useNativeDriver: true}),
		]).start(() => setToast(null))
	}, [toast, opacity])

	if (!toast) return null

	return (
		<Animated.View style={[styles.container, {opacity}]} pointerEvents="none">
			<Text style={styles.text}>{toast.message}</Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 100,
		left: 24,
		right: 24,
		backgroundColor: '#1f2937',
		borderRadius: 10,
		padding: 14,
		alignItems: 'center',
		zIndex: 999,
		shadowColor: '#000',
		shadowOpacity: 0.25,
		shadowOffset: {width: 0, height: 4},
		shadowRadius: 8,
		elevation: 8,
	},
	text: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '500',
	},
})
