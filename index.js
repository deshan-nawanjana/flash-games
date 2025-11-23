// clear any existing hash
if (location.href.includes("#")) { location.href = "" }

// file picker options
const fileOptions = {
  // multiple files not allowed
  multiple: false,
  // other file types not allowed
  excludeAcceptAllOption: true,
  // allow specific file type
  types: [
    {
      description: "Flash Profile File",
      accept: {
        "application/x-fp": [".fp"]
      }
    }
  ]
}

// app instance
new Vue({
  // root element
  el: "#app",
  // app data
  data: {
    // login interface
    login: { tab: "create" },
    // profile details
    profile: null,
    // game library
    library: null,
    // current game id
    current: null,
    // input values
    inputs: { name: "", search: "", sort: "Played Time" },
    // file handler
    handler: null,
    // guest mode
    guest: !window.showSaveFilePicker
  },
  // computed values
  computed: {
    // current game url
    currentURL() { return "./games/play.html?id=" + this.current },
    // game results
    results() {
      // get query term
      const query = this.inputs.search.trim().toLowerCase()
      // filter library items
      return this.library.filter(item => {
        // return if no query
        if (!query) return true
        // match with name
        return item.name.toLowerCase().includes(query)
      }).sort((a, b) => {
        // switch sort mode
        if (this.inputs.sort === "Game Name") {
          // sort by name
          return a.name.localeCompare(b.name)
        } else {
          // find games in profile
          const time_a = this.profile.games[a.id]?.time ?? 0
          const time_b = this.profile.games[b.id]?.time ?? 0
          // sort by time
          return time_a > time_b ? -1 : 1
        }
      })
    }
  },
  // app methods
  methods: {
    // method to create profile
    createProfile() {
      // get profile name
      const name = this.inputs.name.trim()
      // return if no name
      if (!name) return this.$refs.login.focus()
      // show save file picker
      window.showSaveFilePicker({
        ...fileOptions, suggestedName: name.replaceAll(" ", "_")
      }).then(async handler => {
        // store file handler
        this.handler = handler
        // set profile data
        this.profile = { name, games: {} }
        // save profile
        await this.saveProfile()
      })
    },
    // method to load profile
    async loadProfile() {
      // show open file picker
      window.showOpenFilePicker(fileOptions).then(async handler => {
        // store file handler
        this.handler = handler[0]
        // get file from handler
        const file = await handler[0].getFile()
        // parse profile data
        const data = JSON.parse(await file.text())
        // store profile data
        this.profile = data
        // save profile
        await this.saveProfile()
      })
    },
    // method to load guest mode
    loadGuest() {
      // set guest data
      this.profile = { name: "Guest Mode", games: {} }
    },
    // method to save profile
    async saveProfile() {
      // return if in guest mode
      if (this.guest) return
      // create writable
      const writable = await this.handler.createWritable()
      // write default profile data
      await writable.write(JSON.stringify(this.profile))
      // close file
      await writable.close()
    },
    // method to launch game
    launchGame(id) {
      // clear local storage
      localStorage.clear()
      // find game by id
      const game = this.profile.games[id]
      // check data availability
      if (game && game.data) {
        // update game time
        game.time = Date.now()
        // for each data key
        Object.keys(game.data).forEach(key => {
          // restore in local storage
          localStorage.setItem(key, game.data[key])
        })
      } else {
        // set game time
        this.profile.games[id] = { time: Date.now() }
      }
      // set current game id
      this.current = id
      // set game id on hash
      location.hash = id
      // save profile
      this.saveProfile()
    },
    // method to save game
    async saveGame(id) {
      // return if no id
      if (!id) return
      // return if invalid id
      if (!this.library.some(item => item.id === id)) return
      // get key from storage
      const keys = Object.keys(localStorage).filter(key => (
        // get only keys starting with host
        key.startsWith(location.host)
      ))
      // get profile games
      const games = this.profile.games
      // check keys count
      if (keys.length) {
        // initiate game node with time
        games[id] = { time: Date.now() }
        // initiate data node
        games[id].data = {}
        // for each key
        for (let i = 0; i < keys.length; i++) {
          // current key
          const key = keys[i]
          // store game data on profile
          games[id].data[key] = localStorage[key]
        }
      }
      // reload games list
      this.profile.games = { ...games }
      // save profile
      await this.saveProfile()
    },
    // method to toggle sort mode
    toggleSort() {
      this.inputs.sort = this.inputs.sort === "Game Name"
        ? "Played Time" : "Game Name"
    },
    // method to get image url
    imageURL(id) {
      return { backgroundImage: `url(./games/sources/${id}.jpg)` }
    },
    // method to get game time string
    timeString(id) {
      // get game by id
      const game = this.profile.games[id]
      // return if never played game
      if (!game) return "N/A"
      // return time string
      return new Date(game.time).toLocaleString()
    }
  },
  // mounted listener
  async mounted() {
    // load games library
    this.library = await fetch("index.json").then(resp => resp.json())
    // hash change listener
    window.addEventListener("hashchange", () => {
      // clear hash if no profile
      if (!this.profile) return location.hash = ""
      // check hash
      if (location.hash) {
        // check hash with current game
        if (location.hash !== "#" + this.current) {
          // clear invalid hash
          location.hash = ""
        }
      } else {
        // scroll to top
        this.$el.scrollTop = 0
        // save game on close
        this.saveGame(this.current)
        // close current game
        this.current = null
      }
    })
    // storage change listener
    window.addEventListener("storage", () => {
      // save game data
      this.saveGame(this.current)
    })
  }
})
