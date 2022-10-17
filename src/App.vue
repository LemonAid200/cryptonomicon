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
				@select-ticker="tickerName => selectedTicker = tickerName"
			/>
        <!-- <div
          v-for="ticker in paginatedTickers"
          :key="ticker.name"
          @click="selectedTicker = ticker.name"
          :class="{['border-4']: selectedTicker === ticker.name}"
          class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
        >
          <div class="px-4 py-5 sm:p-6 text-center">
            <dt class="text-sm font-medium text-gray-500 truncate">
              {{ ticker.name }} - USD
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {{ normalizePrice(ticker.value[ticker.value.length - 1]) || '-' }}
            </dd>
          </div>
          <div class="w-full border-t border-gray-200"></div>
          <button
            @click.stop="deleteTicker(ticker)"
            class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
          >
            <svg
              class="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="#718096"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              ></path></svg
            >Удалить
          </button>
        </div> -->
      </dl>

      <hr v-if="addedTickers.length" class="w-full border-t border-gray-600 my-4"/>

			<graph-prices
				:selected-ticker="selectedTicker"
				:raw-values="pricesToDisplay"
				@close-graph="() => selectedTicker = ''"
			/>

    </div>
  </div>
</template>

<script>
/* eslint-disable */
import { unsubscribeTicker, subscribeToTicker } from './api'
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

		updateLocalStorage () {
			const tickersWithNullValue = []
			this.addedTickers.forEach((item) =>
				tickersWithNullValue.push({ name: item.name, value: [] })
			)
			localStorage.setItem(
				'cryptonomicon-list-of-chosen-values',
				JSON.stringify(tickersWithNullValue)
			)
		},

		updateValues (tickerName, price) {
			this.addedTickers.find(t => t.name === tickerName).value.push(price)
			if (this.addedTickers.find(t => t.name === tickerName).value.length > 100) {
				this.addedTickers.find(t => t.name === tickerName).value.shift()
			}
		},



		updateTickersFromLocalStorage () {
			const tickersData = localStorage.getItem(
				'cryptonomicon-list-of-chosen-values'
			)
			if (tickersData) {
				this.addedTickers = JSON.parse(tickersData)
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

		pricesToDisplay () {
			if (this.addedTickers.length === 0 || this.selectedTicker === '') return []
			return this.addedTickers.find((t) => t.name === this.selectedTicker).value
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
			this.updateLocalStorage()
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
		this.updateTickersFromLocalStorage()
	}
}
</script>

<style src="./app.css"></style>