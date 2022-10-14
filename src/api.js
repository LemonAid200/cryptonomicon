/* eslint-disable camelcase */
const API_Key = 'f803a0614d11ffe8421ae96983ad4b1efe8ba29264d09309df3a6d9334f6169c'
const allValuesLink = 'https://min-api.cryptocompare.com/data/all/coinlist?summary=true'

// fetch-based function for getting tickers prices without webSocket but via fetch
// export const loadTickersValues = () => {
//   if (tickersHandlers.size === 0) return
//   fetch(
//     `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${[...tickersHandlers.keys()]
//     .join(',')}&api_key=${API_Key}`
//   )
//     .then(t => t.json())
//     .then(rawData => {
//       const updatedPrices = Object.fromEntries(
//         Object.entries(rawData).map(([key, value]) => [key, value])
//       )
//       Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
//         const handlers = tickersHandlers.get(currency) ?? []

//         handlers.forEach(fn => fn(1 / newPrice, currency))
//       })
//     })
// }
// setInterval(loadTickersValues, 6000)

class CryptoWebSocket extends WebSocket {
	subscribe (tickerName) {
		if (this.readyState === CryptoWebSocket.OPEN) {
			this.send(JSON.stringify(
				{
					action: 'SubAdd',
					subs: [`5~CCCAGG~${tickerName}~USD`]
				}
			))
			return
		}
		this.addEventListener('open', () => {
			this.send(JSON.stringify(
				{
					action: 'SubAdd',
					subs: [`5~CCCAGG~${tickerName}~USD`]
				}
			))
		})
	}

	unsubscribe (tickerName) {
		this.send(JSON.stringify(
			{
				action: 'SubRemove',
				subs: [`5~CCCAGG~${tickerName}~USD`]
			}

		))
	}
}

const socket = new CryptoWebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_Key}`)
socket.addEventListener('message', e => {
	const message = JSON.parse(e.data)
	if (message.TYPE === '5' && message.PRICE) {
		const handlers = tickersHandlers.get(message.FROMSYMBOL) ?? []
		handlers.forEach(fn => fn(message.PRICE, message.FROMSYMBOL))
	}
})

export const getAllTickerNames = () => fetch(allValuesLink).then(coinList => coinList.json())
	.then(data => {
		const array = []
		for (const key in data.Data) { array.push(data.Data[key].Symbol) }; return array
	}).then(array => {
		array.sort(function (a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase())
		}); return array
	})

const tickersHandlers = new Map()
window.tickers = tickersHandlers

export const subscribeToTicker = (ticker, cb) => {
	const subscribers = tickersHandlers.get(ticker) || []
	tickersHandlers.set(ticker, [...subscribers, cb])
	socket.subscribe(ticker)
}

export const unsubscribeTicker = ticker => {
	tickersHandlers.delete(ticker)
	socket.unsubscribe(ticker)
}
