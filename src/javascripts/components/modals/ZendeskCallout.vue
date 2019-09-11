<template>
    <!-- class to make use of the Zendesk CSS Garden classes for a dismissible dialog-->
    <div class="c-callout" v-bind:class="[msgTypeClass, asDialog ? 'c-callout--dialog' : '' ]" >
        <!--button aria-label="close" class="c-callout__close" @click="button_click"> </button-->
        <strong class="c-callout__title">{{title}}</strong>
        <p class="c-callout__paragraph">{{msg}}</p>
    </div>
</template>
<script>
import ZendeskAPIClient from '../../lib/ZendeskAPIClient.js'
export default {
    props: {
        title: String,
        msg: String,
        msgType: String, // success, warning, error, info
        asDialog: false
    },
    computed: {
        msgTypeClass () {
            const classes = new Set([
                "success",
                "warning",
                "error",
                "info"
            ]);
            let verifiedClass = classes.has(this.msgType) ? this.msgType : "info";
            return 'c-callout--' + verifiedClass;
        }
    },
    mounted() {
    },
    methods: {
        button_click() {
            ZendeskAPIClient.destroyInstance();
        }
    }
}
</script>
<style lang="sass" scoped>

</style>