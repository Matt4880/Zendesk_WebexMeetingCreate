<template>
    <div>
        <div class = "modal-header"><h3>{{title}}</h3></div>
        <div class = "modal-body">{{msg}}</div>
        <div class="modal-button-group" v-for="button in buttons" v-bind:key="button.text">
            <button class="modal-button" @click="button_click($event)"> {{button.text}}</button>
        </div>
    </div>
</template>
<script>
import ZendeskAPIClient from '../../lib/ZendeskAPIClient.js'
export default {
    props: {
        title: String,
        msg: String,
        buttons: Array /* {text, }*/
    },
    mounted() {
        debugger;
    },
    methods: {
        button_click(event) {
            console.log(event);
            ZendeskAPIClient.emitEvent('messageBox.click', {event});
            ZendeskAPIClient.destroyInstance();
        }
    }
}
</script>
<style lang="sass" scoped>

</style>