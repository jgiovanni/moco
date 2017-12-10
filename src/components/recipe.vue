<template>
	<v-container fluid>
		<v-layout row wrap>
			<v-flex xs12 class="mb-2 text-xs-left">
				<h1 v-text="recipe.name"></h1>
			</v-flex>
			<v-flex xs4>
				<v-list subheader>
					<v-subheader>Ingredients</v-subheader>
					<v-list-tile avatar v-for="item in recipe.ingredients" :key="item.name">
						<v-list-tile-avatar>
							<img v-bind:src="item.image"/>
						</v-list-tile-avatar>
						<v-list-tile-content>
							<v-list-tile-title v-text="item.name"></v-list-tile-title>
							<v-list-tile-sub-title v-text="item.amount"></v-list-tile-sub-title>
						</v-list-tile-content>
						<v-list-tile-action>
							<v-checkbox v-model="item.have"></v-checkbox>
						</v-list-tile-action>
					</v-list-tile>
				</v-list>
			</v-flex>
			<v-flex xs8>
				<v-list three-line subheader class="ml-1">
					<v-subheader>Instructions</v-subheader>
					<template v-for="item in recipe.instructions">
						<v-list-tile :key="item.step">
							<v-list-tile-action>
								<v-checkbox v-model="item.complete"></v-checkbox>
							</v-list-tile-action>
							<v-list-tile-content>
								<v-list-tile-title>Step {{item.step}}</v-list-tile-title>
								<v-list-tile-sub-title v-text="item.text"></v-list-tile-sub-title>
							</v-list-tile-content>
						</v-list-tile>
						<v-divider :inset="false"></v-divider>
					</template>

				</v-list>
			</v-flex>
		</v-layout>
	</v-container>
</template>
<style>
	.list--subheader { background-color: rgba(66, 66, 66, .6) !important;}
</style>
<script type="text/javascript">
  import _ from 'underscore'
  import wordsToNumbers from 'words-to-numbers'
  // import convert from 'convert-units'
  export default {
    name: 'recipe',
    data () {
      return {
        recipe: {
          name: '',
          image: '',
          ingredients: [],
          instructions: [],
          video: false
        },
        currentStepper: null,
        currentStep: 0
      }
    },
    methods: {
      getRecipe (id) {
        return this.$http.get('lookup.php', { params: { i: id } }).then((response) => {
          console.log(response)
          let recipe = response.data.meals[0]
          if (!recipe) {
            this.$router.push('Recipes')
            return false
          }
          this.$root.$emit('Background:SET', recipe.strMealThumb)
          let instructions = recipe.strInstructions.split(/\.\s+/g)
          let instructionsArr = []
          _.each(instructions, (value, index) => {
            instructionsArr.push({ step: index + 1, text: value, complete: false })
          })
          this.recipe = _.extend(this.recipe, {
            id: recipe.idMeal,
            name: recipe.strMeal,
            image: recipe.strMealThumb,
            instructions: instructionsArr,
            video: recipe.strYoutube === null || recipe.strYoutube.length > 10 ? recipe.strYoutube : false
          })
          _.each(recipe, (value, key) => {
            if (key.includes('strIngredient') && value) {
              this.recipe.ingredients.push({
                name: value,
                image: `http://www.themealdb.com/images/ingredients/${value}-small.png`,
                amount: recipe[`strMeasure${key.substr(13)}`],
                have: false
              })
            }
          })
          // Add recipe commands
          this.$root.MoCo.emptyCommands()
          this.$root.MoCo.addCommands([
            {
              indexes: ['wait', 'hold on'],
              action: (i) => {
                this.$root.MoCo.shutUp()
              }
            },
            {
              indexes: ['how much * do i need', 'how many * do i need'],
              smart: true,
              action: (i, wildcard) => {
                if (wildcard.includes('chili')) wildcard = wildcard.replace('chili', 'chilli')
                const ingredient = _.find(this.recipe.ingredients, (item) => item.name.toLowerCase() === wildcard.toLowerCase())
                this.speak(`You need ${this.formatAmountString(ingredient.amount)}`)
              }
            },
            {
              indexes: ['repeat ingredient *', 'repeat the * ingredient'],
              action: (i, wildcard) => {
                switch (i) {
                  case 0:
                  case 1:
                    this.iterateIngredients(wordsToNumbers(wildcard) - 1, true)
                    break
                  case 3:
                    break
                }
              }
            },
            {
              indexes: ['okay', 'done', 'next', 'got it'],
              action: (i) => {
                if (this.currentStepper === 'ingredients') {
                  this.recipe.ingredients[this.currentStep].have = true
                  this.currentStep++
                  this.iterateIngredients(this.currentStep, true)
                } else {
                  this.recipe.instructions[this.currentStep].complete = true
                  this.currentStep++
                  this.iterateInstructions(this.currentStep, true)
                }
              }
            },
            {
              indexes: ['i have all the ingredients'],
              action: (i) => {

              }
            },
            {
              indexes: ['i don`t have *', 'i have *'],
              smart: true,
              action: (i, wildcard) => {
                let ingredient
                // add ability to handle multiple ingredients
                if (i === 0) {
                  ingredient = _.find(this.recipe.ingredients, (item) => item.name.toLowerCase() === wildcard.toLowerCase())
                  ingredient.have = false
                }
                if (i === 1) {
                  // have all the ingredients
                  if (_.includes(['all ingredients', 'all the ingredients'], wildcard)) {
                    _.each(this.recipe.ingredients, function (item) {
                      item.have = true
                    })
                    return false
                  }

                  if (wildcard.includes('and')) { // chances are, there are multiple ingredients
                    let multicard = wildcard.replace(/and/g, '').replace(/the/g, '').split(/\s+/)
                    let i = 0
                    while (multicard.length > 0) {
                      let iMax = 1
                      // i need to simplify this recursion...
                      ingredient = _.find(this.recipe.ingredients, (item) => item.name.toLowerCase() === multicard[i].toLowerCase())
                      if (!ingredient) {
                        iMax++
                        ingredient = _.find(this.recipe.ingredients, (item) => item.name.toLowerCase() === `${multicard[i].toLowerCase()} ${multicard[i + 1].toLowerCase()}`)
                        if (!ingredient) {
                          iMax++
                          ingredient = _.find(this.recipe.ingredients, (item) => item.name.toLowerCase() === `${multicard[i].toLowerCase()} ${multicard[i + 1].toLowerCase()} ${multicard[i + 2].toLowerCase()}`)
                        }
                      }

                      if (ingredient) ingredient.have = true
                      multicard = _.rest(multicard, iMax)
                    }
                  } else {
                    ingredient = _.find(this.recipe.ingredients, (item) => item.name.toLowerCase() === wildcard.toLowerCase())
                    ingredient.have = true
                  }
                }
              }
            },
            {
              indexes: ['what is step *', 'what is *', 'what are *'],
              smart: true,
              action: (i, wildcard) => {
                if (i === 0) {
                  this.recipe.ingredients[wordsToNumbers(wildcard) - 1].complete = true
                  this.currentStep = wordsToNumbers(wildcard) - 1
                  this.iterateInstructions(this.currentStep, true)
                }
                if (i === 2) {
                  if (_.contains(['the instructions', 'the steps'], wildcard)) {
                    this.iterateInstructions(0, true)
                    return false
                  }
                  if (wildcard === 'the ingredients') {
                    this.iterateIngredients(0, true)
                    return false
                  }
                }
                this.loadingState(true)
                let sourceLang = 'en'
                // this.speakRandom(['One moment...', 'Checking...'])
                const proxyUrl = 'https://cors-anywhere.herokuapp.com/'
                if (wildcard.includes('chili')) wildcard = wildcard.replace('chili', 'chilli')
                this.$http.get(`${proxyUrl}https://od-api.oxforddictionaries.com/api/v1/entries/${sourceLang}/${wildcard}`, {
                  headers: { app_id: '836f966a', app_key: '79caaed2a0642d6d612d79cce66a45b6' }
                }).then((response) => {
                  this.loadingState()
                  let definition = response.data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]
                  this.speak(`${wildcard} is: ${definition}`)
                }).catch(() => {
                  let firstWord = wildcard.split(/\s/)[0]
                  this.$http.get(`${proxyUrl}https://od-api.oxforddictionaries.com/api/v1/entries/${sourceLang}/${firstWord}`, {
                    headers: { app_id: '836f966a', app_key: '79caaed2a0642d6d612d79cce66a45b6' }
                  }).then((response) => {
                    this.loadingState()
                    let definition = response.data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]
                    this.speak(`${firstWord} is: ${definition}`)
                  }).catch(() => {
                    this.loadingState()
                    this.speak('I\'m sorry, I don\'t know what that is')
                  })
                })
              }
            },
            {
              indexes: ['want choose another recipe', 'want to pick another recipe', 'show me other recipes'],
              action: (i) => {
                this.$router.push('Recipes')
              }
            }
          ])
          console.log('Commands added')
          this.speak('Would you like to hear the ingredients or the instructions?')
        })
          .catch((response) => {
            this.$router.push('Recipes')
          })
      },
      iterateIngredients (index, single = false) {
        let ingredient = this.recipe.ingredients[index]
        this.currentStepper = 'ingredients'
        this.speak(`${this.formatAmountString(ingredient.amount)} ${ingredient.name}`, {
          onStart: () => {
            this.currentStep = index
          },
          onEnd: () => {
            if (!single) {
              index++
              if (this.recipe.ingredients[index]) this.iterateIngredients(index)
            }
          }
        })
      },
      iterateInstructions (index, single = false) {
        this.currentStepper = 'instructions'
        this.speak(this.recipe.instructions[index].text, {
          onEnd: () => {
            if (!single) {
              index++
              if (this.recipe.instructions[index]) this.iterateInstructions(index)
            }
          }
        })
      }
    },
    beforeRouteLeave (to, from, next) {
      this.$root.MoCo.emptyCommands()
      next()
    },
    mounted () {
      this.getRecipe(this.$route.params.id)
    }
  }
</script>