// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuetify from 'vuetify'
import axios from 'axios'
import App from './App'
import router from './router'
import {ApiAiClient} from 'api-ai-javascript'
import Artyom from 'artyom.js'
import('vuetify/dist/vuetify.min.css')

// axios.defaults.baseURL = 'https://api.edamam.com/'
const proxyUrl = 'https://cors-anywhere.herokuapp.com/'
const MyMoCo = new Artyom()
axios.defaults.baseURL = proxyUrl + 'http://www.themealdb.com/api/json/v1/1/'
// axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*'
// axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
Vue.prototype.$http = axios

Vue.use(Vuetify)
Vue.config.productionTip = false
Vue.mixin({
  methods: {
    loadingState (state = false) {
      this.$root.isLoading = state
    },
    speak (text, callback) {
      this.$root.MoCo.say(text, callback)
    },
    speakRandom (array, callback) {
      this.$root.MoCo.sayRandom(array, callback)
    },
    simulateCommand (text) {
      this.$root.MoCo.simulateInstruction(text)
    },
    formatAmountString (amount) {
      let amountString = amount
      if (amountString.includes('pinch')) amountString = 'a ' + amountString
      if (amountString.includes('handful')) amountString = 'a ' + amountString + ' of'
      if (amountString.includes('tblsp')) amountString = amountString.replace('tblsp', 'tbsp')
      return amountString
    },
    capitalizeString (string) {
      return string.charAt(0).toUpperCase() + string.slice(1)
    }
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: {App},
  data: () => ({
    DialogFlow: new ApiAiClient({accessToken: 'b73ef2bebd554b9b8aa9dbfd38d128be'}),
    APIKey: '98dcd6040bc640aac5227f95446daede',
    AppID: 'd81f4e74',
    searchResults: [],
    selectedRecipe: null,
    MoCo: MyMoCo,
    isLoading: false,
  }),
  methods: {
    textRequest (text) {
      return this.DialogFlow.textRequest(text).then(this.handleResponse).catch(this.handleError)
    },
    handleResponse (serverResponse) {
      console.log(serverResponse)
      return serverResponse
    },
    handleError (serverError) {
      console.log(serverError)
    }
  },
  created () {
    // this.textRequest('Hello!')
  }
})
