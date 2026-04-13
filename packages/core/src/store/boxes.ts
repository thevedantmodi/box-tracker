import {create} from 'zustand'
import {Box} from '../types'

type SyncStatus = 'online' | 'offline' | 'syncing'

type BoxesStore = {
	// State
	boxes: Box[]
	searchQuery: string
	isLoading: boolean
	syncStatus: SyncStatus

	// Actions
	setBoxes: (boxes: Box[]) => void
	setSearchQuery: (query: string) => void
	setSyncStatus: (status: SyncStatus) => void
}

export const useBoxesStore = create<BoxesStore>()((set) => ({
	boxes: [],
	searchQuery: '',
	isLoading: false,
	syncStatus: 'offline',

	setBoxes: (boxes) => set({boxes}),
	setSearchQuery: (searchQuery) => set({searchQuery}),
	setSyncStatus: (syncStatus) => set({syncStatus}),
}))
