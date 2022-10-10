/* eslint-disable camelcase */
const API_Key = 'f803a0614d11ffe8421ae96983ad4b1efe8ba29264d09309df3a6d9334f6169c'
const allValuesLink = 'https://min-api.cryptocompare.com/data/all/coinlist?summary=true'

// function getNames () {
//   const names = []
//   for (const key of tickersHandlers.keys()) {
//     names.push(key.name)
//   }
//     console.log(tickersHandlers)
//     console.log(names)
//   return names
// }

export const loadTickersValues = () => {
  if (tickersHandlers.size === 0) return
  fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${[...tickersHandlers.keys()]
    .join(',')}&api_key=${API_Key}`
  )
    .then(t => t.json())
    .then(rawData => {
      const updatedPrices = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value])
      )
      //   console.log(rawData)
      Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
        const handlers = tickersHandlers.get(currency) ?? []
        handlers.forEach(fn => fn(newPrice, currency))
      })
    })
}

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
}

export const unsubscribeTicker = ticker => {
  tickersHandlers.delete(ticker)
}

setInterval(loadTickersValues, 6000)
