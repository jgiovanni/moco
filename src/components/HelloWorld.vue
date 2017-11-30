<template>
	<v-container fluid grid-list-md>
		<v-layout row wrap>
			<v-flex xs6 v-for="meal in $root.searchResults" :key="meal.idMeal">
				<v-card :to="`recipe/${meal.idMeal}`">
					<v-card-media :src="meal.strMealThumb" height="150px">
						<v-container fill-height fluid>
							<v-layout fill-height>
								<v-flex xs12 align-end flexbox>

								</v-flex>
							</v-layout>
						</v-container>
					</v-card-media>
					<v-card-title primary-title>
						<div>
							<h3 class="headline mb-0"><a @click="getRecipe(meal.idMeal)" class="headline white--text" v-text="meal.strMeal"></a></h3>
						</div>
					</v-card-title>
					<v-card-actions class="">
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
					</v-card-actions>
				</v-card>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
  export default {
    name: 'HelloWorld',
    data () {
      return {}
    },
    methods: {},
    created () {

    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
