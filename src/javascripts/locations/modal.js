import Vue from 'vue';
import ZendeskAPIClient from '../lib/ZendeskAPIClient.js';
import MessageBox from '../components/modals/MessageBox.vue';
import ZendeskCallout from '../components/modals/ZendeskCallout.vue';
import ConflictingMeetingsModal from '../components/modals/ConflictingMeetingsModal.vue';

// Initialise the Zendesk JavaScript API client
// https://developer.zendesk.com/apps/docs/apps-v2
ZendeskAPIClient.init(()=>{
  ZendeskAPIClient.resizeContainer(200, 600);
  init();
});

function init(){
  var params = parseParams(window.location.hash);

  new Vue({
    components: {
      MessageBox,
      ZendeskCallout,
      ConflictingMeetingsModal
    },
    el: '#modal-app',
    render(createElement) {
      return createElement(params.vueComponentName, {
        props: params.props
      });
    }
  });
}

function parseParams(param_string){
  let param_sub = param_string.replace('#','');
  let param_obj = JSON.parse(decodeURI(param_sub));
  return param_obj;  //Might be overbuilt but I like it because it returns a very pretty object
};

