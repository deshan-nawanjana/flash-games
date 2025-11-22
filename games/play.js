// avoid console messages
window.console.log = () => null
window.console.warn = () => null
window.console.error = () => null
window.console.debug = () => null

// avoid popups
window.open = () => null

// set ruffle global configurations
RufflePlayer.config.contextMenu = "off"
RufflePlayer.config.allowNetworking = "none"

// create ruffle player
const player = RufflePlayer.sources.local.createPlayer()
// append player into body
document.body.appendChild(player)

// get search params
const params = new URLSearchParams(location.search)

// load game
player.load({
  autoplay: "on",
  unmuteOverlay: "hidden",
  url: `./sources/${params.get("id")}.swf`
}).then(() => {
  // avoid fetch requests
  window.fetch = () => new Promise((_, reject) => reject())
})
