const prettyDate = (unixtime) => {
  return new Date(unixtime * 1000).toDateString()
}

const marketUrl = (pubkey, tags) => {
  const stallId = tags.find((tag) => tag[0] === 'd')?.[1]
  return `https://market.nostr.com/?merchant=${pubkey}&stall=${stallId}#/`
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

const renderResults = (data) => {
  let html = ''
  // sort markets by more recent first
  const sorted = data.sort((a, b) => b.created_at - a.created_at)
  for (const { content, created_at, pubkey, tags } of sorted) {
    const { name, description, shipping } = JSON.parse(content)
    // market (aka stall) url
    const url = marketUrl(pubkey, tags)
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

// button click handler
const fetchMarkets = async () => {
  // reset UI
  $('#fetching-status').html('')
  $('#fetching-progress').css('visibility', 'hidden')
  $('#fetching-progress').val(0)
  $('#file-download').html('')
  $('#markets-found').text('')
  // messages to show to user
  const checkMark = '&#10003;'
  const txt = {
    fetching: 'Fetching from relays... ',
    download: `Downloading markets file... ${checkMark}`,
  }
  // disable button (will be re-enable at the end of the process)
  $('#fetch-markets').prop('disabled', true)
  // inform user that app is fetching from relays
  $('#fetching-status').html(txt.fetching)
  // show and update fetching progress bar
  $('#fetching-progress').css('visibility', 'visible')
  const fetchInterval = setInterval(() => {
    // update fetching progress bar
    const currValue = parseInt($('#fetching-progress').val())
    $('#fetching-progress').val(currValue + 1)
  }, 1_000)
  // get all events from relays
  const filter = { kinds: [30017] }
  const markets = await getEvents(filter)
  // inform user fetching is done
  $('#fetching-status').html(txt.fetching + checkMark)
  // end progress bar
  clearInterval(fetchInterval)
  $('#fetching-progress').val(20)
  // inform user that markets file (js format) is being downloaded
  $('#file-download').html(txt.download)
  // downloadFile(data, 'markets.js')
  // re-enable fetch markets button
  $('#fetch-markets').prop('disabled', false)
  // render table with markets found
  renderResults(markets)
}
