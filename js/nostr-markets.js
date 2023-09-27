let markets

const prettyDate = (unixtime) => {
  return new Date(unixtime * 1000).toDateString()
}

const timeAgo = (time) => {
  const now = parseInt(Date.now() / 1000)
  const delta = now - time
  if (delta < 60) return 'a few seconds ago'
  if (delta < 600) return 'a few minutes ago'
  if (delta < 86_400) return 'a few hours ago'
  if (delta < 604_800) return 'a few days ago'
  if (delta < 18_144_000) return 'a few weeks ago'
  if (delta < 217_728_000) return 'a few months ago'
  return 'more then a year ago'
}

const renderResults = () => {
  let html = ''
  // sort markets by more recent first
  const sorted = markets.sort((a, b) => b.created_at - a.created_at)
  for (const { content, created_at, pubkey, stall_id } of sorted) {
    const { name, description, shipping } = JSON.parse(content)
    // market (aka stall) url
    const url = `https://market.nostr.com/?merchant=${pubkey}&stall=${stall_id}#/`
    // remove id from shipping
    shipping?.forEach((r) => delete r['id'])
    // add market to html
    html += `
      <details>
        <summary>${name} &middot; ${timeAgo(created_at)}</summary>
        <p><a target="_blank" href="${url}">Visit market</a></p>
        <p>
          <strong>Description:</strong><br />
          ${description}
        </p>
        <p>
          <strong>Created at:</strong><br />
          ${prettyDate(created_at)}</p>
        <p>
          <strong>Shipping:</strong><br/>
          ${JSON.stringify(shipping, null, 2)}
        </p>
      </details>
    `
  }
  $('#results').html(html)
}

const getMarkets = async () => {
  const markets = new Map()
  const filter = { kinds: [30017] }
  const events = await getEvents(filter)
  const sorted = events.sort((a, b) => a.created_at - b.created_at)
  for (const event of sorted) {
    const { tags } = event
    const stall_id = tags.find((tag) => tag[0] === 'd')?.[1]
    if (stall_id) markets.set(stall_id, { ...event, stall_id })
  }
  return Array.from(markets.values())
}

// button click handler
const fetchMarkets = async () => {
  // reset UI
  $('#fetching-status').html('')
  $('#fetching-progress').css('visibility', 'hidden')
  $('#fetching-progress').val(0)
  $('#file-download').css('visibility', 'hidden')
  $('#events-found').text('')
  // messages to show to user
  const checkMark = '&#10003;'
  const fetching = 'Fetching from relays... '
  // disable button (will be re-enable at the end of the process)
  $('#fetch-markets').prop('disabled', true)
  // inform user that app is fetching from relays
  $('#fetching-status').html(fetching)
  // show and update fetching progress bar
  $('#fetching-progress').css('visibility', 'visible')
  const fetchInterval = setInterval(() => {
    // update fetching progress bar
    const currValue = parseInt($('#fetching-progress').val())
    $('#fetching-progress').val(currValue + 1)
  }, 1_000)
  // get all markets from relays
  markets = await getMarkets()
  $('#markets-found').text(`${markets.length} markets found`)
  // inform user fetching is done
  $('#fetching-status').html(fetching + checkMark)
  // end progress bar
  clearInterval(fetchInterval)
  $('#fetching-progress').val(20)
  // show download button
  $('#file-download').css('visibility', 'visible')
  // re-enable fetch markets button
  $('#fetch-markets').prop('disabled', false)
  // render table with markets found
  renderResults()
}

const download = () => downloadFile(markets, 'markets.js')
