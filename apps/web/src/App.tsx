import {useEffect, useState} from 'react'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import {connector} from './lib/powersync'
import {Toast} from './components/Toast'
import Login from './pages/Login'
import Home from './pages/Home'
import BoxDetail from './pages/BoxDetail'
import BoxNew from './pages/BoxNew'
import BoxEdit from './pages/BoxEdit'
import Scan from './pages/Scan'

function RequireAuth({children}: {children: React.ReactNode}) {
	const [checking, setChecking] = useState(true)
	const [authed, setAuthed] = useState(false)

	useEffect(() => {
		const supabase = connector.getSupabaseClient()
		supabase.auth.getSession().then(({data}) => {
			setAuthed(!!data.session)
			setChecking(false)
		})

		const {data: sub} = supabase.auth.onAuthStateChange((_event, session) => {
			setAuthed(!!session)
		})
		return () => sub.subscription.unsubscribe()
	}, [])

	if (checking) return null
	if (!authed) return <Navigate to="/login" replace />
	return <>{children}</>
}

export default function App() {
	return (
		<BrowserRouter>
			<Toast />
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route
					path="/"
					element={
						<RequireAuth>
							<Home />
						</RequireAuth>
					}
				/>
				<Route
					path="/scan"
					element={
						<RequireAuth>
							<Scan />
						</RequireAuth>
					}
				/>
				<Route
					path="/box/new"
					element={
						<RequireAuth>
							<BoxNew />
						</RequireAuth>
					}
				/>
				<Route
					path="/box/:id"
					element={
						<RequireAuth>
							<BoxDetail />
						</RequireAuth>
					}
				/>
				<Route
					path="/box/:id/edit"
					element={
						<RequireAuth>
							<BoxEdit />
						</RequireAuth>
					}
				/>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	)
}
