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
				<v-list two-line subheader class="ml-1">
					<v-subheader>Instructions</v-subheader>
					<v-list-tile v-for="item in recipe.instructions" :key="item.step">
						<v-list-tile-action>
							<v-checkbox v-model="item.complete"></v-checkbox>
						</v-list-tile-action>
						<v-list-tile-content>
							<v-list-tile-sub-title>Step {{item.step}}</v-list-tile-sub-title>
							<v-list-tile-title v-text="item.text"></v-list-tile-title>
						</v-list-tile-content>
					</v-list-tile>
				</v-list>
			</v-flex>
		</v-layout>
	</v-container>
</template>
<style></style>
<script type="text/javascript">
  import _ from 'underscore'
  // import convert from 'convert-units'
  export default {
    name: 'recipe',
    data () {
      return {
        recipe: {
          ingredients: []
        },
        currentStepper: null,
        currentStep: 0
      }
    },
    methods: {
      speak (text, callback) {
        this.$root.MoCo.say(text, callback)
      },
      getRecipe (id) {
        return this.$http.get('lookup.php', { params: { i: id } }).then((response) => {
          console.log(response)
          let recipe = response.data.meals[0]
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
          this.$root.MoCo.addCommands([
            {
              indexes: ['wait', 'hold on'],
              action: (i) => {
                this.$root.MoCo.shutUp()
              }
            },
            {
              indexes: ['what are the ingredients'],
              action: (i) => {
                this.iterateIngredients(0)
              }
            },
            {
              indexes: ['how much * do i need', 'how many * do i need'],
              smart: true,
              action: (i, wildcard) => {
                let ingredient = _.find(this.recipe.ingredients, (item) => item.name.toLowerCase() === wildcard.toLowerCase())
                this.speak(`You need ${this.formatAmountString(ingredient.amount)}`)
              }
            },
            {
              indexes: ['repeat ingredient *', 'repeat the * ingredient'],
              action: (i, wildcard) => {
                let index = 0
                switch (i) {
                  case 0:
                  case 1:
                    if (_.contains([
                      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
                      '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'
                    ], wildcard)) index = wildcard
                    this.iterateIngredients(index - 1, true)
                    break
                  case 3:
                    break
                }
              }
            },
            {
              indexes: ['what are the instructions', 'what are the steps'],
              action: (i) => {
                this.iterateInstructions(0, true)
              }
            },
            {
              indexes: ['okay Moco', 'done', 'what is next Moco', 'what\'s next Moco', 'Moco next'],
              action: (i) => {
                this.recipe.ingredients[this.currentStep].complete = true
                this.currentStep++
                this.iterateInstructions(this.currentStep, true)
              }
            },
            {
              indexes: ['step *'],
              smart: true,
              action: (i, wildcard) => {
                this.recipe.ingredients[Number(wildcard) - 1].complete = true
                this.currentStep = Number(wildcard) - 1
                this.iterateInstructions(this.currentStep, true)
              }
            }
          ])
          console.log('Commands added')
        })
      },
      iterateIngredients (index, single = false) {
        let ingredient = this.recipe.ingredients[index]
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
        this.speak(this.recipe.instructions[index].text, {
          onEnd: () => {
            if (!single) {
              index++
              if (this.recipe.instructions[index]) this.iterateInstructions(index)
            }
          }
        })
      },
      formatAmountString (amount) {
        let amountString = amount
        if (amountString.includes('pinch')) amountString = 'a ' + amountString
        if (amountString.includes('handful')) amountString = 'a ' + amountString + ' of'
        if (amountString.includes('tblsp')) amountString = amountString.replace('tblsp', 'tbsp')
        return amountString
      }
    },
    beforeRouteEnter (to, from, next) {
      next(vm => {
        vm.getRecipe(vm.$route.params.id)
      })
    },
    beforeRouteLeave (to, from, next) {
      // this.$root.MoCo.removeCommands('')
      // this.$root.MoCo.removeCommands('')
    },
    mounted () {

    }
  }
</script>