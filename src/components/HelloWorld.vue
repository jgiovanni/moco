<template>
	<v-container fluid grid-list-md>
		<v-layout row wrap>
			<v-flex xs6 v-for="meal in $root.searchResults" :key="meal.idMeal">
				<v-card ripple :to="{ name: 'Recipe',  params: { id: meal.idMeal } }">
					<v-card-media :src="meal.strMealThumb" height="150px">
						<v-container fill-height fluid>
							<v-layout fill-height>
								<v-flex xs12 align-end flexbox class="text-xs-left">
									<a @click="getRecipe(meal.idMeal)" class="headline white--text shadowed" v-text="meal.strMeal"></a>
								</v-flex>
							</v-layout>
						</v-container>
					</v-card-media>
					<!--<v-card-actions class="">
						<v-spacer></v-spacer>
						<v-btn icon>
							<v-icon>mic</v-icon>
						</v-btn>
						<v-btn icon>
							<v-icon>bookmark</v-icon>
						</v-btn>
						<v-btn icon>
							<v-icon>share</v-icon>
						</v-btn>
					</v-card-actions>-->
				</v-card>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
  import _ from 'underscore'
  import wordsToNumbers from 'words-to-numbers'

  export default {
    name: 'HelloWorld',
    data () {
      return {
        isLoading: false,
        tempRecipe: null,
        conditionals: {
          stepper: null,
          step: 0,
          nameThem: false,
          listThem: false
        },
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
      }
    },
    methods: {
      searchRecipes (query) {
        this.loadingState(true)
        return this.$http.get('search.php', { params: { s: query } }).then((response) => {
          console.log(response)
          if (response.data.meals) {
            this.$root.searchResults = response.data.meals
            let count = response.data.meals.length
            this.speak(`I've found ${count > 1 ? count + ' recipes' : count + 'recipe'}. Would you like me to name some?`)
            this.conditionals.nameThem = true
          } else {
            this.speak(`No recipes were found `)
          }
          this.loadingState()
        }).catch(() => {
          this.loadingState()
        })
      },
      searchRecipesByIngredients (ingredients) {
        this.loadingState(true)
        return this.$http.get('filter.php', { params: { i: ingredients } }).then((response) => {
          console.log(response)
          if (response.data.meals) {
            this.$root.searchResults = response.data.meals
            let count = response.data.meals.length
            this.speak(`I've found ${count > 1 ? count + ' recipes' : count + 'recipe'}.`)
          } else {
            this.speak(`No recipes were found `)
          }
          this.loadingState()
        }).catch(() => {
          this.loadingState()
        })
      },
      searchRecipesByCategory (category) {
        this.loadingState(true)
        return this.$http.get('filter.php', { params: { c: this.capitalizeString(category) } }).then((response) => {
          console.log(response)
          if (response.data.meals) {
            this.$root.searchResults = response.data.meals
            let count = response.data.meals.length
            this.speak(`I've found ${count > 1 ? count + ' recipes' : count + 'recipe'}.`)
          } else {
            this.speak(`No ${category} recipes were found `)
          }
          this.loadingState()
        }).catch(() => {
          this.loadingState()
        })
      },
      loadMoCoCommands () {
        this.$root.MoCo.addCommands([
          {
            indexes: ['Hello Moco', 'Hi Moco', 'Hey Moco'],
            action: (i) => {
              this.speakRandom([
                'Good Morning', 'Hey'
              ])
            }
          },
          // Recipes Commands
          {
            indexes: ['wait', 'hold on'],
            action: (i) => {
              this.$root.MoCo.shutUp()
            }
          },
          {
            indexes: ['find * recipes', 'show me * recipes', 'search for * recipes'],
            smart: true,
            action: (i, wildcard) => {
              this.speakRandom(['Searching...', 'One moment please', `Searching for ${wildcard} recipes`])
              this.searchRecipes(wildcard)
            }
          },
          /* {
            indexes: ['show me * recipes'],
            smart: true,
            action: (i, wildcard) => {
              this.speakRandom(['Searching...', 'One moment please', `Searching for ${wildcard} recipes`])
              this.searchRecipesByCategory(wildcard)
            }
          }, */
          {
            indexes: ['find recipes with *'],
            smart: true,
            action: (i, wildcard) => {
              this.speakRandom(['Searching...', 'One moment please', `Searching for recipes with ${wildcard}`])
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
            indexes: ['Stop listening', 'Moco, stop listening'],
            action: (i) => {
              this.speak('Okay')
              this.$root.MoCo.dontObey()
              console.log("MoCo isn't obeying anymore")
            }
          },
          {
            indexes: ['Moco, listen'],
            action: (i) => {
              this.speakRandom(['Hello', 'Hey, I\'m listening'])
            }
          },
          {
            indexes: ['select recipe *', 'select *'],
            smart: true,
            action: (i, wildcard) => {
              debugger
              switch (i) {
                case 0:
                  let num = _.isString(wildcard) && wildcard.length === 3 ? wordsToNumbers(wildcard) : wildcard
                  console.log(num)
                  this.$router.push(`recipes/${this.$root.searchResults[num].idMeal}`)
                  break
                case 1:
                  let result = _.find(this.$root.searchResults, (item) => item.strMeal.toLowerCase() === wildcard.toLowerCase())
                  if (result) {
                    this.$router.push({ name: 'Recipe', params: { id: result.idMeal } })
                  } else this.speak(`I'm sorry, I can't find ${wildcard}.`)
                  break
              }
            }
          },
          {
            indexes: ['what ingredients do i need for *', 'what ingredients do i need to make *'],
            smart: true,
            action: (i, wildcard) => {
              let recipe = _.find(this.$root.searchResults, (item) => item.strMeal.toLowerCase() === wildcard.toLowerCase()) || null
              if (recipe) {
                // populate tempRecipe
                this.tempRecipe = {
                  name: recipe.strMeal,
                  image: recipe.strMealThumb,
                  ingredients: [],
                  instructions: [],
                  video: recipe.strYoutube === null || recipe.strYoutube.length > 10 ? recipe.strYoutube : false
                }
                let ingredients = []
                // grab all ingredients
                _.each(recipe, (value, key) => {
                  if (key.includes('strIngredient') && value) {
                    ingredients.push({
                      name: value,
                      amount: recipe[`strMeasure${key.substr(13)}`]
                    })
                  }
                })
                this.tempRecipe.ingredients = ingredients
                this.conditionals.listThem = true
                this.speak(`There are ${this.tempRecipe.ingredients.length} ingredients, should I list them all?`)
              } else this.speak(`I'm sorry, I can't seem to find ${wildcard}.`)
            }
          },
          // Contextual Responses
          {
            indexes: ['sure', 'yes', 'yeah', 'yea', 'list all'],
            action: (i) => {
              if (this.conditionals.nameThem) {
                this.conditionals.nameThem = false
                const recipeNames = _.pluck(this.$root.searchResults, 'strMeal')
                let randNames = []
                let maxLength = recipeNames.length > 5 ? 5 : recipeNames.length
                while (randNames.length < maxLength) {
                  let name = recipeNames[_.random(0, recipeNames.length - 1)]
                  randNames.push(name)
                  randNames = _.uniq(randNames)
                }

                for (let i in randNames) {
                  this.speak(randNames[i])
                }
              }
              if (this.conditionals.listThem) {
                this.conditionals.listThem = false
                this.iterateIngredients()
              }
            }
          },
          {
            indexes: ['no'],
            action: (i) => {
              if (this.conditionals.nameThem) this.conditionals.nameThem = false
              if (this.conditionals.listThem) {
                this.conditionals.listThem = false
                let ingredients = _.clone(this.tempRecipe.ingredients)
                this.speak(`Ok, Here are a few: `)
                for (let i = 0; i < 5; i++) {
                  this.speak(`${this.formatAmountString(ingredients[i].amount)} ${ingredients[i].name}`)
                }
              }
            }
          }
        ])
      },
      // mic free testing using text field
      iterateIngredients (index = 0, single = false) {
        let ingredient = this.tempRecipe.ingredients[index]
        this.conditionals.stepper = 'ingredients'
        this.speak(`${this.formatAmountString(ingredient.amount)} ${ingredient.name}`, {
          onStart: () => {
            this.conditionals.step = index
          },
          onEnd: () => {
            if (!single) {
              index++
              if (this.tempRecipe.ingredients[index]) this.iterateIngredients(index)
            }
          }
        })
      }

    },
    created () {
      this.loadMoCoCommands()
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
	.shadowed { text-shadow: 0px 1px black; }
</style>
