import {useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import jsQR from 'jsqr'
import {getBoxByQrCode} from '@boxtrack/core'

const DEBOUNCE_MS = 2000
const POLL_MS = 300

export default function Scan() {
	const navigate = useNavigate()
	const navigateRef = useRef(navigate)
	navigateRef.current = navigate

	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const cooldownRef = useRef(false)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const [permissionDenied, setPermissionDenied] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let stopped = false

		function tick() {
			const video = videoRef.current
			const canvas = canvasRef.current
			if (!video || !canvas || video.readyState < 2 || cooldownRef.current) return

			const ctx = canvas.getContext('2d')
			if (!ctx) return

			canvas.width = video.videoWidth
			canvas.height = video.videoHeight
			ctx.drawImage(video, 0, 0)

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
			const code = jsQR(imageData.data, imageData.width, imageData.height)
			if (!code) return

			cooldownRef.current = true
			if (intervalRef.current) clearInterval(intervalRef.current)

			getBoxByQrCode(code.data)
				.then((box) => {
					if (box) {
						navigateRef.current(`/box/${box.id}`)
					} else {
						navigateRef.current(`/box/new?qr_code=${encodeURIComponent(code.data)}`)
					}
				})
				.catch(() => {
					setTimeout(() => {
						cooldownRef.current = false
						intervalRef.current = setInterval(tick, POLL_MS)
					}, DEBOUNCE_MS)
				})
		}

		async function startCamera() {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {facingMode: 'environment'},
				})
				if (stopped) {
					stream.getTracks().forEach((t) => t.stop())
					return
				}
				streamRef.current = stream
				if (videoRef.current) {
					videoRef.current.srcObject = stream
					await videoRef.current.play()
				}
				intervalRef.current = setInterval(tick, POLL_MS)
			} catch (e: unknown) {
				if (e instanceof DOMException && e.name === 'NotAllowedError') {
					setPermissionDenied(true)
				} else {
					setError('Could not access camera')
				}
			}
		}

		startCamera()

		return () => {
			stopped = true
			if (intervalRef.current) clearInterval(intervalRef.current)
			streamRef.current?.getTracks().forEach((t) => t.stop())
			streamRef.current = null
		}
	}, [])

	if (permissionDenied) {
		return (
			<div style={styles.permContainer}>
				<p style={styles.permTitle}>Camera access needed</p>
				<p style={styles.permText}>
					BoxTrack needs camera access to scan QR codes. Please enable it in your browser
					settings, then reload the page.
				</p>
				<button style={styles.overlayBtn} onClick={() => navigate(-1)}>Go back</button>
			</div>
		)
	}

	if (error) {
		return (
			<div style={styles.permContainer}>
				<p style={styles.permTitle}>{error}</p>
				<button style={styles.overlayBtn} onClick={() => navigate(-1)}>Go back</button>
			</div>
		)
	}

	return (
		<div style={styles.container}>
			<video ref={videoRef} style={styles.video} muted playsInline />
			<canvas ref={canvasRef} style={{display: 'none'}} />
			<div style={styles.overlay}>
				<button style={styles.backBtn} onClick={() => navigate(-1)}>‹ Back</button>
				<div style={styles.frame} />
				<p style={styles.hint}>Point camera at a QR code</p>
			</div>
		</div>
	)
}

const styles: Record<string, React.CSSProperties> = {
	container: {
		position: 'fixed',
		inset: 0,
		background: '#000',
	},
	video: {
		width: '100%',
		height: '100%',
		objectFit: 'cover',
	},
	overlay: {
		position: 'absolute',
		inset: 0,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
	},
	backBtn: {
		position: 'absolute',
		top: 20,
		left: 20,
		background: 'rgba(0,0,0,0.5)',
		color: '#fff',
		borderRadius: 8,
		padding: '8px 16px',
		fontSize: 17,
	},
	frame: {
		width: 220,
		height: 220,
		border: '3px solid #fff',
		borderRadius: 12,
	},
	hint: {
		color: '#fff',
		marginTop: 20,
		fontSize: 15,
	},
	permContainer: {
		height: '100vh',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32,
		gap: 16,
		background: '#111',
	},
	permTitle: {
		fontSize: 20,
		fontWeight: 600,
		color: '#fff',
		textAlign: 'center',
	},
	permText: {
		fontSize: 15,
		color: '#aaa',
		textAlign: 'center',
		lineHeight: 1.6,
	},
	overlayBtn: {
		background: '#2563eb',
		color: '#fff',
		borderRadius: 8,
		padding: '12px 24px',
		fontSize: 16,
		fontWeight: 600,
	},
}
