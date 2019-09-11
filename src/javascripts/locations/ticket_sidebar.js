//import App from '../modules/app'
import Vue from 'vue'
import App from '../components/App.vue'
import ZendeskAPIClient from '../lib/ZendeskAPIClient.js'

const MAX_HEIGHT = 545;

ZendeskAPIClient.init(()=>{
  new Vue({
    render: h => h(App),
  }).$mount('#app');
  ZendeskAPIClient.resizeContainer(MAX_HEIGHT);
})


