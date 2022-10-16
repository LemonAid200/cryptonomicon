<template>
 <section>
		<div class="flex">
			<div class="max-w-xs">
				<label for="wallet" class="block text-sm font-medium text-gray-700"
					>Тикер</label
				>
				<!-- solve problem with	@keydown="isAlreadyAddedError = false" -->
				<div class="mt-1 relative rounded-md shadow-md">
					<input
						v-model="ticker"
						@keydown.enter="addNewTicker"
						type="text"
						name="wallet"
						id="wallet"
						class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
						placeholder="Например DOGE"
					/>
				</div>
				<div class="flex bg-white shadow-md p-1 rounded-md flex-wrap">
					<span
						v-for="prompt in prompts"
						:key="prompt"
						@click="
							ticker = prompt,
							addNewTicker()
						"
						class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
					>
						{{ prompt }}
					</span>
				</div>
				<div v-if="isAlreadyAddedError" class="text-sm text-red-600">
					Такой тикер уже добавлен
				</div>
			</div>
		</div>
		<add-button	@click="addNewTicker"/>
  </section>
</template>

<script>
import AddButton from './AddButton.vue'
import { getAllTickerNames } from './../api'

export default {
	components: {
		AddButton
	},
	props: {
		isAlreadyAddedError: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	data () {
		return {
			ticker: '',
			listOfAllValues: []
		}
	},
	methods: {
		addNewTicker () {
			this.$emit('add-new-ticker', this.ticker)
			this.ticker = ''
		},

		getClosestTickerFromList (tickerName) {
			tickerName = tickerName.toUpperCase()
			let start = 0
			let end = this.listOfAllValues.length
			let middle = Math.floor(start + (end - start) / 2)

			while (end - start > 1) {
				const comparedTickerName = this.listOfAllValues[middle].toUpperCase()
				if (tickerName > comparedTickerName) {
					start = middle
				} else {
					end = middle
				}
				middle = Math.floor(start + (end - start) / 2)
			}
			return middle + 1
		},

		async getAndSetValues () {
			this.listOfAllValues = await getAllTickerNames()
		}
	},
	computed: {
		promptsIndex () {
			return this.getClosestTickerFromList(this.ticker)
		},

		prompts () {
			if (this.ticker) {
				return [
					this.listOfAllValues[this.promptsIndex],
					this.listOfAllValues[this.promptsIndex + 1],
					this.listOfAllValues[this.promptsIndex + 2],
					this.listOfAllValues[this.promptsIndex + 3]
				]
			} else {
				return ['BTC', 'DOGE', 'BCH', 'CHD']
			}
		}
	},

	watch: {
		ticker (first) {
			if (first === '') return
			this.$emit('user-is-inputting')
		}
	},

	created: function () {
		this.getAndSetValues()
	}
}
</script>
