<template>
	<div>
		<div>{{ recipe }}</div>
	</div>
</template>
<style></style>
<script type="text/javascript">
  export default {
    name: 'recipe',
    data () {
      return {
        recipe: null,
        instructions: [],
        ingredients: []
      }
    },
    methods: {
      getRecipe (id) {
        return this.$http.get('lookup.php', { params: { i: id } }).then((response) => {
          console.log(response)
          this.recipe = response.data.meals[0]
          this.instructions = this.recipe.strInstructions.split(/\.\s+/g)
          this.ingredients = []
        })
      }
    },
    beforeRouteEnter (to, from, next) {
      next(vm => {
        vm.getRecipe(vm.$route.params.id)
      })
    },
    mounted () {}
  }
</script>