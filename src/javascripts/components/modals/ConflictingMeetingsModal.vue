<template>
    <div>
        <ZendeskCallout v-if="meetings && meetings.length===0" title="No conflicting meetings found" msg="No conflicting meetings were found over this time period" msgType="success"></ZendeskCallout>
        <!--ZendeskCallout v-else class="conflict-header" title="Conflicting meetings found" msg="The following conflicting meetings were found:" msgType="warning"></ZendeskCallout-->

        <table v-else class = "c-table u-bg-white" ref="meetingTable">
            <caption class="c-table__caption u-fs-lg u-semibold u-mb-sm">Conflicting meetings found:</caption>
            <thead>
                <tr class="c-table__row c-table__row--header">
                <th class="c-table__row__cell c-table__row__cell--truncate">Start</th>
                <th class="c-table__row__cell c-table__row__cell--truncate">Duration</th>
                <th class="c-table__row__cell c-table__row__cell--truncate">Title</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="meeting in meetings" v-bind:key="meeting.meetingKey" class="c-table__row" tabindex="0">
                    <td class="c-table__row__cell"><span class="startTime">{{formatDate(meeting.meetingStart)}}</span> <span class="timezone c-tag c-tag--pill">{{formatTimezone(meeting.timezoneDesc)}}</span></td>
                    <td class="c-table__row__cell">{{formatTime(meeting.duration)}}</td>
                    <td class="c-table__row__cell" v-bind:title="meeting.meetingName">{{meeting.meetingName}}</td>
                </tr>
            </tbody>
        </table>
        <!--ul>
            <li v-for="meeting in meetings" v-bind:key="meeting.meetingKey">
                <label class="c-txt__label">Meeting: </label><span class="meetname">{{meeting.meetingName}}</span><br>
                Start: <span class="timestart">{{meeting.meetingStart}}</span><br>
                Timezone: <span class="timezone">{{meeting.timezoneDesc}}</span><br>
                Duration: <span class="duration">{{meeting.duration}}</span><br>
            </li>
        </ul-->
    </div>
</template>
<script>
import ZendeskCallout from './ZendeskCallout.vue';
import moment from 'moment';
import momentdurationformat from 'moment-duration-format';
import ZendeskAPIClient from '../../lib/ZendeskAPIClient';
import Vue from 'vue';
export default {
    components: {
        ZendeskCallout
    },
    props: {
        meetings : Array
    },
    mounted(){
        let meetingCount = this.meetings.length;
        let x = meetingCount ? 800 : 500;
        let y = this.meetings.length ? Math.min(this.$refs.meetingTable.clientHeight + 50, 900) : 120;
        ZendeskAPIClient.resizeContainer(y, x);
    },
    methods: {
        formatDate(date) {
            return moment(date).format('lll');
        },
        formatTimezone(tz) {
            // attempt to extract timezone data from Webex timezone string
            // assumes always = GMT+XX, LongTimezone - split on comma
            return String(tz).split(',')[0];
        },
        formatTime(mins) {
            // convert #mins into nice hh:mm format
            let duration = moment.duration(parseInt(mins), 'minutes');
            return duration.format("h:mm", {trim:false});
        }
    }
}
</script>
<style scoped>

</style>