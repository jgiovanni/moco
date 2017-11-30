<template>
	<div id="app">
		<v-app id="inspire" dark>
			<!--<v-navigation-drawer clipped fixed v-model="drawer" app>
				<v-list dense>
					<v-list-tile @click="">
						<v-list-tile-action>
							<v-icon>dashboard</v-icon>
						</v-list-tile-action>
						<v-list-tile-content>
							<v-list-tile-title>Dashboard</v-list-tile-title>
						</v-list-tile-content>
					</v-list-tile>
					<v-list-tile @click="">
						<v-list-tile-action>
							<v-icon>settings</v-icon>
						</v-list-tile-action>
						<v-list-tile-content>
							<v-list-tile-title>Settings</v-list-tile-title>
						</v-list-tile-content>
					</v-list-tile>
				</v-list>
			</v-navigation-drawer>-->
			<v-toolbar app fixed clipped-left>
				<v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
				<v-toolbar-title>MoCo</v-toolbar-title>
			</v-toolbar>
			<v-content>
				<v-layout justify-center align-center>
					<v-text-field label="Name" v-model="recText"></v-text-field>
					<v-btn color="success" large @click="simulateCommand">Send</v-btn>
				</v-layout>

				<router-view/>
			</v-content>
			<v-footer app fixed>
				<span>&copy; 2017</span>
			</v-footer>
		</v-app>
	</div>
</template>

<script>
  /* eslint-disable no-unused-vars */
  import _ from 'underscore'
  export default {
    name: 'app',
    data: () => ({
      drawer: null,
      recognition: null,
      voice: null,
      isRecording: false,
      recText: 'Moko, Hello',
      isLoading: false
    }),
    methods: {
      toDialogFlow (text) {
        this.$root.textRequest(text || this.recText).then((response) => {
          this.$router.push('/')
          console.log(response.result.fulfillment.speech)
          this.speak(response.result.fulfillment.speech)
          if (response.result.parameters.query !== '') {
            this.searchRecipes(response.result.parameters.query)
          }
          if (response.result.parameters.ingredients !== '') {
            this.searchRecipesByIngredients(response.result.parameters.ingredients)
          }
          if (response.result.parameters.category !== '') {
            this.searchRecipesByCategory(response.result.parameters.category)
          }
        })
      },
      searchRecipes (query) {
        return this.$http.get('search.php', { params: { s: query } }).then((response) => {
          console.log(response)
          if (response.data.meals) {
            this.$root.searchResults = response.data.meals
            let count = response.data.meals.length
            this.speak(`I've found ${count > 1 ? count + ' recipe' : count + 'recipes'}.`)
          } else {
            this.speak(`No recipes were found `)
          }
        })
      },
      searchRecipesByIngredients (ingredients) {
        return this.$http.get('filter.php', { params: { i: ingredients } }).then((response) => {
          console.log(response)
          if (response.data.meals) {
            this.$root.searchResults = response.data.meals
            let count = response.data.meals.length
            this.speak(`I've found ${count > 1 ? count + ' recipe' : count + 'recipes'}.`)
          } else {
            this.speak(`No recipes were found `)
          }
        })
      },
      searchRecipesByCategory (category) {
        return this.$http.get('filter.php', { params: { c: this.capitalizeString(category) } }).then((response) => {
          console.log(response)
          if (response.data.meals) {
            this.$root.searchResults = response.data.meals
            let count = response.data.meals.length
            this.speak(`I've found ${count > 1 ? count + ' recipe' : count + 'recipes'}.`)
          } else {
            this.speak(`No ${category} recipes were found `)
          }
        })
      },
      speak (text, callback) {
        this.$root.MoCo.say(text, callback)
      },
      speakRandom (array, callback) {
        this.$root.MoCo.sayRandom(array, callback)
      },
      capitalizeString (string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
      },
      loadMoCoCommands () {
        this.$root.MoCo.addCommands([
          {
            indexes: ['Hello', 'Hi', 'is someone there'],
            action: (i) => {
              this.speakRandom([
                'Good Morning', 'Hello'
              ])
            }
          },
          // Recipes Commands
          {
            indexes: ['find * recipes'],
            smart: true,
            action: (i, wildcard) => {
              this.speakRandom(['Searching...', 'One moment please', `Searching for ${wildcard} recipes`])
              this.searchRecipes(wildcard)
            }
          },
          {
            indexes: ['show me * recipes'],
            smart: true,
            action: (i, wildcard) => {
              this.speakRandom(['Searching...', 'One moment please', `Searching for ${wildcard} recipes`])
              this.searchRecipesByCategory(wildcard)
            }
          },
          {
            indexes: ['find recipes with *'],
            smart: true,
            action: (i, wildcard) => {
              this.speakRandom(['Searching...', 'One moment please', `Searching for ${wildcard} recipes`])
              this.searchRecipesByIngredients(wildcard)
            }
          },
          // The smart commands support regular expressions
          {
            indexes: ['that will be all', 'that will be all, Moko'],
            action: (i, wildcard) => {
              this.speakRandom(['Bye Bye', 'Later', 'Goodbye'])
              this.$root.MoCo.fatality().then(() => {
                console.log('MoCo successfully stopped')
              })
            }
          },
          {
            indexes: ['Stop listening'],
            action: (i) => {
              this.speak('Okay')
              this.$root.MoCo.dontObey()
              console.log("MoCo isn't obeying anymore")
            }
          },
          {
            indexes: ['Moco, listen'],
            action: (i) => {
              this.speakRandom([
                'Hello', 'Hey, I\'m listening'
              ])
            }
          }
        ])
      },
      // mic free testing using text field
      simulateCommand () {
        this.$root.MoCo.simulateInstruction(this.recText)
      }
    },
    created () {
      // eslint-disable-next-line no-new
      this.loadMoCoCommands()
      this.$root.MoCo.initialize({
        lang: 'en-US',
        debug: true, // Show what recognizes in the Console
        continuous: true, // Listen forever
        soundex: true, // Use the soundex algorithm to increase accuracy
        listen: true, // Start listening after this
        speed: 0.9, // Talk a little bit slow
        mode: 'normal', // This parameter is not required as it will be normal by default
        // name: 'Moko',
        obeyKeyword: 'Moko, listen'
      }).then(() => {
        console.log('MoCo has been succesfully initialized')
      }).catch((err) => {
        console.error('MoCo couldn\'t be initialized: ', err)
      })
      this.$root.$on('Speak', this.speak)

      this.$root.$on('ASR:set', (string) => {
        this.recText = string
      })
    }
  }
</script>

<style>
	@import "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons";

	#app {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: #2c3e50;
		margin-top: 60px;
	}

	canvas { display: none !important; }
</style>
