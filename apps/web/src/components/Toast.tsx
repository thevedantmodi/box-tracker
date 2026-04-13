import {useEffect, useState} from 'react'

type ToastState = {message: string; id: number} | null

let _setToast: ((t: ToastState) => void) | null = null
let _nextId = 0

export function showToast(message: string) {
	_setToast?.({message, id: ++_nextId})
}

export function Toast() {
	const [toast, setToast] = useState<ToastState>(null)
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		_setToast = setToast
		return () => {
			_setToast = null
		}
	}, [])

	useEffect(() => {
		if (!toast) return
		setVisible(true)
		const timer = setTimeout(() => {
			setVisible(false)
			setTimeout(() => setToast(null), 300)
		}, 2000)
		return () => clearTimeout(timer)
	}, [toast])

	if (!toast) return null

	return (
		<div
			style={{
				position: 'fixed',
				bottom: 32,
				left: '50%',
				transform: `translateX(-50%)`,
				background: '#1f2937',
				color: '#fff',
				padding: '12px 20px',
				borderRadius: 10,
				fontSize: 15,
				fontWeight: 500,
				boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
				zIndex: 9999,
				pointerEvents: 'none',
				opacity: visible ? 1 : 0,
				transition: 'opacity 0.3s ease',
				whiteSpace: 'nowrap',
			}}
		>
			{toast.message}
		</div>
	)
}
