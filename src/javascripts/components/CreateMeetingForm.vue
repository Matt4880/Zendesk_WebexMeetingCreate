<template>
    <div>
        <loading :active.sync="isLoading"></loading>

        <div class="l-wrapper--370 u-mb-lg">
            <div class="c-txt u-mb-sm">
                <label class="c-txt__label" for="meeting-topic">Meeting Topic</label><input id="meeting-topic" v-model="meetingDetail.topic" class="c-txt__input">
            </div>
            <div class="c-txt u-mb-sm">
            <label class="c-txt__label">Timezone</label><select v-model="meetingDetail.timezone" class="c-txt__input c-txt__input--select">
                    <option v-for="timezone in timezones" v-bind:value="timezone.timezoneId" v-bind:key="timezone.timezoneId">
                            {{timezone.description}}
                    </option>
                </select>
            </div>
            <div class="c-txt u-mb-sm">
                <label class="c-txt__label">Starts At</label><datetime type="datetime" v-model="meetingDetail.startsAt" class="datetime-wrapper"></datetime>
            </div>
            <div class="c-txt u-mb-sm">
                <label class="c-txt__label">Duration (min)</label><input v-model="meetingDetail.duration" class="c-txt__input" type="number" min="5">
            </div>
            <div class="c-txt u-mb-sm">
                <label class="c-txt__label">Password</label><input v-model="meetingDetail.password" class="c-txt__input">
            </div>
            <div class="c-txt u-mb-sm">
                <label class="c-txt__label">Attendees</label><input v-model="meetingDetail.attendees" class="c-txt__input">
            </div>
            <button @click="createMeeting" class ="c-btn c-btn--sm c-btn--primary">Create Meeting</button>
            <button @click="onCheckOverlapClick" class ="c-btn c-btn--sm">Test for Overlap</button>
            <!--button @click="test" class ="c-btn">comment</button-->

        </div>
        <!--ConflictingMeetingList :meetings="meetingConflicts"></ConflictingMeetingList-->
    </div>
</template>
<script>
import {Datetime} from 'vue-datetime';
import 'vue-datetime/dist/vue-datetime.css';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';
import webexclient from '../lib/WebexXmlClient.js';
import zendeskClient from '../lib/ZendeskAPIClient.js';
import moment from 'moment';
import ConflictingMeetingList from './ConflictingMeetingList.vue';
export default {
    name: 'CreateMeetingForm',
    data() {
        return {
            meetingDetail: {
                topic: "",
                timezone: "",
                startsAt: new moment().startOf('hour').add(1, 'hour').toISOString(),
                //new Date().toISOString(),
                duration: 15,
                password: zendeskClient.metadata().settings.defaultMeetingPassword,
                attendees: ""
            },
            isLoading: true,
            timezones: [],
            ticket: {}
        }
    },
    components: {
        Datetime,
        Loading
        //ConflictingMeetingList
    },
    created: async function() {
        var me = this;
        console.log('component created');
        const tasks = [
            webexclient.getTimezones(),
            zendeskClient.getTicket()
        ]
        Promise.all(tasks).then(
            data => {
                this.timezones = data[0];
                this.ticket = data[1];
                me.setDefaultTimezone(this.timezones, zendeskClient.metadata().settings.defaultTimezone);
                this.meetingDetail.topic = this.ticket.subject;
                let attendees = this.ticket.requester.email

                if (this.ticket.assignee.user) {attendees += ',' + this.ticket.assignee.user.email}
                this.meetingDetail.attendees = attendees;
            }
        ).catch(err => {
            console.error(err);
            zendeskClient.modalDlg({vueComponentName: 'ZendeskCallout', props: {"title": "Error",
                "msg": "Error encountered whilst initialising plugin: " + err, "msgType": "error"}});

        })
        .finally(()=> {this.isLoading = false;});
    },
    methods: {
        async createMeeting() {
            this.isLoading = true;
            try {
                let conflicts = await this.doCheckOverlap();
                if (conflicts.length > 0) {
                    showOverlapMeetingResults(conflicts)
                    return
                }
                const meetingDetail = this.meetingDetail;
                let attendeeArray = meetingDetail.attendees.split(',');
                let meetingResponse = await webexclient.createMeeting(
                        meetingDetail.password,
                        meetingDetail.topic,
                        meetingDetail.startsAt,
                        meetingDetail.duration,
                        meetingDetail.timezone,
                        attendeeArray
                );
                // success message and dialog
                const timezoneDesc = this.getTimezoneDescFromId(meetingDetail.timezone);
                let user = await zendeskClient.currentUser();
                let humanTime = moment(meetingDetail.startsAt).format('lll');
                await zendeskClient.createComment(
                    this.ticket.id,
                    `<p>WebEx meeting scheduled by <b>${user.name}</b> via plugin at: <b>${humanTime}</b> (${timezoneDesc}) </p>

                    <h4>invited attendees:</h4>
                    <ul style="list-style-type:none">
                    ${attendeeArray.map(attendee => `<li><a href="mailto:${attendee}">${attendee}</a></li>`).join('')}
                    </ul>

                    <h4>WebEx meeting URLs: </h4>
                    <ul style="list-style-type:none">
                    <li><a href="${meetingResponse.calendarURLs[0].host}">Host Meeting Link</a></li>
                    <li><a href="${meetingResponse.calendarURLs[0].attendee}">Guest Meeting Link</a></li>
                    </ul>

                    <h4>WebEx meeting key:</h4>
                    <p>${meetingResponse.meetingKey}</p>
                    `,
                    true);
                zendeskClient.modalDlg({vueComponentName: 'ZendeskCallout', props: {"title": "Meeting created",
                    "msg": "Meeting created successfully", "msgType": "success"}});

            } catch (err) {
                    console.error(err);
                    zendeskClient.modalDlg({vueComponentName: 'ZendeskCallout', props: {"title": "Error",
                        "msg": "Error encountered whilst creating meeting: " + err, "msgType": "error"}});

            }
            finally {
                this.isLoading = false;
            }
        },
        async doCheckOverlap() {
            // just the call without the UI bits
            return await webexclient.existingMeetingsOverlap(this.meetingDetail.startsAt, this.meetingDetail.duration, this.meetingDetail.timezone)
        },
        showOverlapMeetingResults(meetingList) {
            zendeskClient.modalDlg({vueComponentName: 'ConflictingMeetingsModal', props: {meetings: meetingList}});
        },
        async onCheckOverlapClick() {
            this.isLoading = true;
            try
            {
                let conflicts = await this.doCheckOverlap();
                this.showOverlapMeetingResults(conflicts);
            }
            catch(err) {
                console.error(err);
            }
            this.isLoading = false;
        },
        setDefaultTimezone: function(timezones, defaultTimezone) {
            let defaultTimezoneIdx = timezones.findIndex(x => x.description === defaultTimezone || x.shortName === defaultTimezone);
            if (defaultTimezoneIdx > -1) {
                this.meetingDetail.timezone = String(timezones[defaultTimezoneIdx].timezoneId);
            }
        },
        getTimezoneDescFromId: function(id) {
            let timezoneRec = this.timezones.find(x => x.timezoneId === id);
            return timezoneRec ? timezoneRec.description : "unknown timezone";
        },
        test: async function() {
            zendeskClient.modalDlg({vueComponentName: 'ZendeskCallout', props: {"title": "testTit",
        "msg": "testMsg", "msgType": "error"}});
        }
    }
}
</script>
<style scoped>
    .c-btn--sm {
        padding: 0 1.25em
    }
    input.vdatetime-input {
        width: '100%'!important
    }

    .vdatetime input {
        width: '100%'
    }
</style>