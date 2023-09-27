// download js file
const downloadFile = (data, fileName) => {
  const prettyJs = 'const data = ' + JSON.stringify(data, null, 2)
  const tempLink = document.createElement('a')
  const taBlob = new Blob([prettyJs], { type: 'text/javascript' })
  tempLink.setAttribute('href', URL.createObjectURL(taBlob))
  tempLink.setAttribute('download', fileName)
  tempLink.click()
}

// fetch events from relay, returns a promise
const fetchFromRelay = async (relay, filter, events) =>
  new Promise((resolve, reject) => {
    try {
      // prevent hanging forever
      setTimeout(() => reject('timeout'), 20_000)
      // open websocket
      const ws = new WebSocket(relay)
      // subscription id
      const subsId = 'my-sub'
      // subscribe to events filtered by author
      ws.onopen = () => {
        ws.send(JSON.stringify(['REQ', subsId, filter]))
      }

      // Listen for messages
      ws.onmessage = (event) => {
        const [msgType, subscriptionId, data] = JSON.parse(event.data)
        // event messages
        if (msgType === 'EVENT' && subscriptionId === subsId) {
          const { id } = data
          // prevent duplicated events
          if (events[id]) return
          else events[id] = data
          // show how many events were found until this moment
          $('#markets-found').text(
            `${Object.keys(events).length} markets found`
          )
        }
        // end of subscription messages
        if (msgType === 'EOSE' && subscriptionId === subsId) resolve()
      }
      ws.onerror = (err) => reject(err)
    } catch (exception) {
      reject(exception)
    }
  })

// query relays for events published by this pubkey
const getEvents = async (filter) => {
  // events hash
  const events = {}
  // wait for all relays to finish
  await Promise.allSettled(
    relays.map((relay) => fetchFromRelay(relay, filter, events))
  )
  // return data as an array of events
  return Object.keys(events).map((id) => events[id])
}
