import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Recipe from '@/components/recipe'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Recipes',
      component: HelloWorld
    },
    {
      path: '/recipe/:id',
      name: 'Recipe',
      component: Recipe
    }
  ]
})
