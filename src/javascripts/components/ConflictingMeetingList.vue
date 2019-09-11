<template>
    <div>
        <span class="no-conflict" v-if="meetings && meetings.length===0">No conflicting meetings</span>
        <span class="conflict-header" v-if="meetings && meetings.length>0">Conflicting meetings found:</span>
        <ul>
            <li v-for="meeting in meetings" v-bind:key="meeting.meetingKey">
                Meeting: <span class="meetname">{{meeting.meetingName}}</span><br>
                Start: <span class="timestart">{{meeting.meetingStart}}</span><br>
                Timezone: <span class="timezone">{{meeting.timezoneDesc}}</span><br>
                Duration: <span class="duration">{{meeting.duration}}</span><br>
            </li>
        </ul>
    </div>
</template>
<script>
export default {
    props: {
        meetings : Array
    }
}
</script>
<style scoped>

</style>