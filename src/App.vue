<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
		<loading-cover v-if="loadingPage"/>
    <div class="container">
			<add-ticker
				@add-new-ticker="addNewTicker"
				@user-is-inputting="() => {isAlreadyAddedError = false}"
				:is-already-added-error="isAlreadyAddedError"
			/>

      <div>
        Фильтр: <input v-model="filter" @input="page = 1" /> <br />
        <button
          class="my-4 inline-flex items-center py-2 px-4 mx-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          v-if="page > 1"
          @click="page--"
        >
          Назад
        </button>
        <button
          class="my-4 inline-flex items-center py-2 px-4 mx-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          v-if="hasNextPage"
          @click="page++"
        >
          Вперед
        </button>
      </div>

      <hr v-if="addedTickers.length" class="w-full border-t border-gray-600 my-4"/>

      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
				<ticker-card v-for="ticker in paginatedTickers"
					:key="ticker.name"
					:ticker="ticker"
					:isSelected="ticker.name === selectedTicker"
					@delete-ticker="deleteTicker"
					@select-ticker="tickerName => selectedTicker = tickerName"/>
			</dl>

      <hr v-if="addedTickers.length" class="w-full border-t border-gray-600 my-4"/>

			<graph-prices
				:ticker="tickerToDisplayInGraph"
				@close-graph="() => selectedTicker = ''"
			/>

    </div>
  </div>
</template>

<script>
/* eslint-disable */
import { unsubscribeTicker, subscribeToTicker } from './api'
import { saveTickersToLocalStorage, getTickersFromLocalStorage } from './localStorageTickers'

import AddTicker from './components/AddTicker.vue'
import LoadingCover from './components/LoadingCover.vue'
import GraphPrices from './components/GraphPrices.vue'
import TickerCard from './components/TickerCard.vue'

export default {
	name: 'app',
	components: {
		AddTicker,
		LoadingCover,
		GraphPrices,
		TickerCard
	},
	methods: {
		addNewTicker (ticker) {
			this.isAlreadyAddedError = false
			if (ticker === '') {
				return
			}
			ticker = ticker.toUpperCase()

			this.addedTickers.forEach((item) => {
				if (item.name === ticker) {
					this.isAlreadyAddedError = true
				}
			})
			if (this.isAlreadyAddedError === false) {
				const newTicker = { name: ticker, value: [] }
				this.addedTickers = [...this.addedTickers, newTicker]
				subscribeToTicker(newTicker.name, price => {
					this.updateValues(newTicker.name, price)
				})
				this.filter = ''
			}

			ticker = ''
		},

		deleteTicker (tickerToDelete) {
			unsubscribeTicker(tickerToDelete.name)

			this.addedTickers = this.addedTickers.filter(
				(ticker) => ticker !== tickerToDelete
			)

			if (tickerToDelete.name === this.selectedTicker) {
				this.selectedTicker = ''
			}
		},

		updateValues (tickerName, price) {
			this.addedTickers.find(t => t.name === tickerName).value.push(price)
			if (this.addedTickers.find(t => t.name === tickerName).value.length > 100) {
				this.addedTickers.find(t => t.name === tickerName).value.shift()
			}
		},

		getAndSubscribeToTickersFromLocalStorage () {
			const tickersData = getTickersFromLocalStorage()
			if (tickersData) {
				this.addedTickers = tickersData
				this.addedTickers.forEach(ticker => {
					subscribeToTicker(ticker.name, price => {
						this.updateValues(ticker.name, price)
					})
				})
			}
		},

		setFilterAndPageFromURL () {
			const windowData = Object.fromEntries(
				new URL(window.location).searchParams.entries()
			)
			this.filter = windowData.filter ?? ''
			this.page = windowData.page ?? 1
		}
	},

	computed: {
		startIndex () {
			return (this.page - 1) * 6
		},

		tickerToDisplayInGraph () {
			if (this.addedTickers.length === 0 || this.selectedTicker === '') return []
			return this.addedTickers.find((t) => t.name === this.selectedTicker)
		},

		endIndex () {
			return this.page * 6
		},

		filteredTickers () {
			return this.addedTickers.filter((ticker) =>
				ticker.name.includes(this.filter.toUpperCase())
			)
		},

		paginatedTickers () {
			return this.filteredTickers.slice(this.startIndex, this.endIndex)
		},

		hasNextPage () {
			return this.endIndex < this.addedTickers.length
		},

		pageStateOptions () {
			return {
				filter: this.filter,
				page: this.page
			}
		}
	},

	data () {
		return {
			loadingPage: true,
			isAlreadyAddedError: false,
			selectedTicker: '',
			addedTickers: [],
			filter: '',
			page: 1
		}
	},

	watch: {
		addedTickers () {
			saveTickersToLocalStorage(this.addedTickers)
		},

		pageStateOptions (value) {
			window.history.pushState(
				null,
				document.title,
				`${window.location.pathname}?filter=${value.filter}&page=${value.page}`
			)
		},

		paginatedTickers () {
			if (this.paginatedTickers.length === 0 && this.page > 1) {
				this.page--
			}
		}
	},

	created: function () {
		setTimeout(() => {
			this.loadingPage = !this.loadingPage
		}, 400)

		this.setFilterAndPageFromURL()
		this.getAndSubscribeToTickersFromLocalStorage()
	}
}
</script>

<style src="./app.css"></style>