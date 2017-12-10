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
				<!--<v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>-->
				<v-toolbar-title>MoCo</v-toolbar-title>
				<v-spacer></v-spacer>
				<!--<v-layout justify-center align-center>
					<v-text-field label="Command" v-model="recText"></v-text-field>
					<v-btn color="success" large @click="simulateCommand(recText)">Send</v-btn>
				</v-layout>-->
			</v-toolbar>
			<v-content>
				<v-alert color="info" icon="info" v-model="$root.isLoading">
					{{ loadingText }}
				</v-alert>
				<router-view/>
			</v-content>
			<!--<v-footer app fixed>
				<span>&copy; 2017</span>
			</v-footer>-->
		</v-app>
	</div>
</template>

<script>
  /* eslint-disable no-unused-vars */
  import _ from 'underscore'
  import $ from 'jquery'
  import Funnies from 'funnies'
  const funnies = new Funnies()

  export default {
    name: 'app',
    data: () => ({
      drawer: null,
      recognition: null,
      voice: null,
      isRecording: false,
      recText: '',
      loadingText: funnies.message(),
      mocoOptions: {
        lang: 'en-US',
        debug: true, // Show what recognizes in the Console
        continuous: true, // Listen forever
        soundex: true, // Use the soundex algorithm to increase accuracy
        listen: true, // Start listening after this
        speed: 0.9, // Talk a little bit slow
        mode: 'normal', // This parameter is not required as it will be normal by default
        // name: 'Moko',
        obeyKeyword: 'Moko, listen'
      }
    }),
    watch: {
      '$root.isLoading' (value) {
        if (value) this.loadingText = funnies.message()
      }
    },
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
      restartMoco () {
        // this.$root.MoCo.fatality() // Stop artyom
        setTimeout(function () {
          /* this.$root.MoCo.initialize(this.mocoOptions).then(function () {
            console.log('MoCo listening again')
          }) */
        }, 250)
      }
    },
    created () {
      // eslint-disable-next-line no-new
      this.$root.$on('Speak', this.speak)

      this.$root.$on('ASR:set', (string) => {
        this.recText = string
      })

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
        this.$root.MoCo.when('SPEECH_SYNTHESIS_END', () => { this.$root.MoCo.ArtyomWebkitSpeechRecognition.abort() })
        console.log('MoCo has been successfully initialized')
        let voices = this.$root.MoCo.getVoices()
        console.log(_.where(voices, {lang: 'en-US'}))
      }).catch((err) => {
        console.error('MoCo couldn\'t be initialized: ', err)
      })

      this.$root.$on('Background:SET', (url) => {
        let contentSelector = $('.content')
        contentSelector.css('background-image', `url("${url}")`)
        contentSelector.css('background-attachment', `fixed`)
        contentSelector.css('background-size', `cover`)
        contentSelector.css('background-position', `center center`)
      })
      this.$root.$on('Background:CLEAR', (url) => {
        $('.content').css('background-image', 'none')
      })
      this.$root.$on('Commands:load', () => {
        this.loadMoCoCommands()
      })
    }
  }
</script>

<style>
	@import "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons";

	#app {
		/*font-family: 'Avenir', Helvetica, Arial, sans-serif;*/
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: #2c3e50;
		/*margin-top: 60px;*/
	}

	/*canvas { display: none !important; }*/
</style>
