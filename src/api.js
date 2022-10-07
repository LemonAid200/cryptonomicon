/* eslint-disable camelcase */
const API_Key = 'f803a0614d11ffe8421ae96983ad4b1efe8ba29264d09309df3a6d9334f6169c'

export const loadTicker = tickerSNames => fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${tickerSNames.join(',')
        }&api_key=${API_Key}`
).then(t => t.json())
