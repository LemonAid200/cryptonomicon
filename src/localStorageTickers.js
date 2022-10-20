const localStorageTickersName = 'cryptonomicon-list-of-chosen-values'

export const saveTickersToLocalStorage = (tickers) => {
	const tickersWithNullValue = []
	tickers.forEach((item) =>
		tickersWithNullValue.push({ name: item.name, value: [] })
	)
	localStorage.setItem(
		localStorageTickersName,
		JSON.stringify(tickersWithNullValue)
	)
}

export const getTickersFromLocalStorage = () => {
	const tickersData = localStorage.getItem(localStorageTickersName)
	if (tickersData) {
		const tickers = JSON.parse(tickersData)
		return tickers
	}
}
