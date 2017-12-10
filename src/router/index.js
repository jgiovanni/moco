import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Recipe from '@/components/recipe'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '*',
      redirect: '/recipes/all'
    },
    {
      path: '/recipes/all',
      name: 'Recipes',
      component: HelloWorld
    },
    {
      path: '/recipes/:id(\\d+)',
      name: 'Recipe',
      component: Recipe
    }
  ]
})
