//require
//import axios from 'axios';
import zendeskProxy from './ZendeskAPIClient.js'
import moment from 'moment'

function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }
function XMLBaseTemplate(body) {
    let metadata = zendeskProxy.metadata();
    const webexID = metadata.settings.webExID || '',
          webexPassword = metadata.settings.password || '',
          webexEscapedSitename = escapeHtml(metadata.settings.siteName || '');
    return  `<?xml version="1.0" encoding="utf-8"?>
        <serv:message xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:serv="http://www.webex.com/schemas/2002/06/service">
            <header>
                <securityContext>
                    <webExID>${webexID}</webExID>
                    <password>${webexPassword}</password>
                    <siteName>${webexEscapedSitename}</siteName>
                </securityContext>
            </header>
            <body>
                ${body}
            </body>
        </serv:message>`;
}

function textToXmlDoc (inText) {
    var oParser = new DOMParser();
    var oDOM = oParser.parseFromString(inText, "application/xml");
    return oDOM;
}

function cleanupXMLTag(xml, tagname) {
    let element = xml.getElementsByTagName(tagname)
    if (element.length)
        {return element[0].firstChild.nodeValue;}
    else {return ''}
}

function mapTimeZoneResultToJSON (timezoneXML) {
    /* convert an XML document containing
    			<ns1:timeZone>
				<ns1:timeZoneID>0</ns1:timeZoneID>
				<ns1:gmtOffset>720</ns1:gmtOffset>
				<ns1:description>GMT+12:00, Dateline (Marshall Islands)</ns1:description>
				<ns1:shortName>Marshall Islands</ns1:shortName>
				<ns1:hideTimeZoneName>false</ns1:hideTimeZoneName>
				<ns1:fallInDST>false</ns1:fallInDST>
			</ns1:timeZone>
			<ns1:timeZone>
				<ns1:timeZoneID>1</ns1:timeZoneID>
				<ns1:gmtOffset>-660</ns1:gmtOffset>
				<ns1:description>GMT-11:00, Samoa (Samoa)</ns1:description>
				<ns1:shortName>Samoa</ns1:shortName>
				<ns1:hideTimeZoneName>true</ns1:hideTimeZoneName>
				<ns1:fallInDST>false</ns1:fallInDST>
			</ns1:timeZone>
            ...
            into JSON structure
            [{
                timezoneId : "1"
                gmtOffset: "-660"
                description: "GMT-11:00, Samoa (Samoa)"
                shortName: "Samoa"
            }]

*/
    let elementArray = Array.from(timezoneXML.getElementsByTagName("ns1:timeZone"));
    let result = elementArray.map(x => {
        return {
            timezoneId : cleanupXMLTag(x, 'ns1:timeZoneID'),
            gmtOffset : cleanupXMLTag(x, 'ns1:gmtOffset'),
            description : cleanupXMLTag(x, 'ns1:description'),
            shortName : cleanupXMLTag(x, 'ns1:shortName')
        }
    });
    return result;
}

function mapMeetingListResultToJSON(meetingXml) {
   /* convert an XML document containing
			<meet:meeting>
				<meet:meetingKey>703346811</meet:meetingKey>
				<meet:confName>#10132 External Transports in AC</meet:confName>
				<meet:meetingType>3</meet:meetingType>
				<meet:hostWebExID>webexsupport</meet:hostWebExID>
				<meet:otherHostWebExID>webexsupport</meet:otherHostWebExID>
				<meet:timeZoneID>7</meet:timeZoneID>
				<meet:timeZone>GMT-05:00, Central (Chicago)</meet:timeZone>
				<meet:status>NOT_INPROGRESS</meet:status>
				<meet:startDate>09/11/2019 13:00:00</meet:startDate>
				<meet:duration>60</meet:duration>
				<meet:listStatus>PUBLIC</meet:listStatus>
				<meet:hostJoined>false</meet:hostJoined>
				<meet:participantsJoined>false</meet:participantsJoined>
				<meet:telePresence>false</meet:telePresence>
            </meet:meeting>
            <meet:meeting>
              ...
            </meet:meeting>
            ...
            into JSON structure
            [{
                meetingKey : "1"
                meetingName: "-660"
                timezoneId: "GMT-11:00, Samoa (Samoa)"
                timezoneDesc: "Samoa"
                meetingStart: "Samoa"
                duration: "Samoa"
            }]
    */
    let elementArray = Array.from(meetingXml.getElementsByTagName("meet:meeting"));
    let result = elementArray.map(x => {
        return {
            meetingKey : cleanupXMLTag(x, 'meet:meetingKey'),
            meetingName : cleanupXMLTag(x, 'meet:confName'),
            timezoneId : cleanupXMLTag(x, 'meet:timeZoneID'),
            timezoneDesc : cleanupXMLTag(x, 'meet:timeZone'),
            meetingStart : moment(cleanupXMLTag(x, 'meet:startDate'), WEBEX_DATE_FORMAT),
            duration : cleanupXMLTag(x, 'meet:duration')

        }
    });
    return result;
}

function mapMeetingCreateResultToJSON (meetingXml) {
       /* convert an XML document containing
            <meet:meetingkey>48591508</meet:meetingkey>
            <meet:iCalendarURL>
                <serv:host>https://www.webex.com/calendarurl1/j.php?ED=48591508&U
                    ID=BA24987F&ICS=MIFH&ST=12</serv:host>
                <serv:attendee>https://www.webex.com/calendarurl1/j.php?ED=485915
                    08&UID=BA24987F&ICS=MIFA&ST=12</serv:attendee>
            </meet:iCalendarURL>
            <meet:guestToken>f10324e2af4823c278fa1a6efadc426c</meet:guestToken>            ...
            into JSON structure
            {
                meetingKey: 48591508
                calendarURLs: [{
                    host:
                    attendee:
                },{
                    host:
                    attendee:
                },{
                    ...
                }]],
                guestToken: 'f10324e2af4823c278fa1a6efadc426c'
            }
    */
   let elementArray = Array.from(meetingXml.getElementsByTagName("serv:bodyContent"));
   let result = {
       meetingKey: cleanupXMLTag(elementArray[0], 'meet:meetingkey'),
       guestToken : cleanupXMLTag(elementArray[0], 'meet:guestToken'),
       calendarURLs: []
   }
   let calendarURLArray = Array.from(meetingXml.getElementsByTagName("meet:iCalendarURL"));
   result.calendarURLs = calendarURLArray.map(x => {
       return {
            host: cleanupXMLTag(x, 'serv:host'),
            attendee: cleanupXMLTag(x, 'serv:attendee')
   }});

   return result;
}

const WEBEX_DATE_FORMAT = 'MM/DD/YYYY HH:mm:ss';

class WebexAPIWrapper {
    constructor() {
        this._proxy = zendeskProxy;
    }
    getBaseURL() {
        let metadata = this._proxy.metadata();
        return metadata.settings.serviceUrl || '';
    }
    getAPICallConfig() {
        return {
            headers: {
                'Content-Type': 'text/xml',
            },
            'dataType': 'text'
            //,secure: true
        }
    }
    parseAPIError(xml) {
        let resultNode = xml.getElementsByTagName("serv:result");
        if (resultNode && resultNode[0].innerHTML === 'FAILURE')
        {
            let reasonNode = xml.getElementsByTagName("serv:reason");
            let exceptionId = xml.getElementsByTagName("serv:exceptionID")[0].innerHTML;
            if (exceptionId == 15) {return xml;} // this is just no results found - not a fail
            let errMsg = "";
            if (reasonNode) {
                errMsg = 'error during XML API call: ' + reasonNode[0].innerHTML
            } else {
                errMsg = 'Unknown error during XML API call.';
            }
            console.error(errMsg);
            throw errMsg;
        }
        return xml;
    }
    async zendeskCall(xmlBody) {
        let result = await this._proxy.post(this.getBaseURL(), XMLBaseTemplate(xmlBody), this.getAPICallConfig());
        let xml = textToXmlDoc(result);
        this.parseAPIError(xml);
        return xml;
    }
    async getTimezones() {
        const xmlBody = '<bodyContent xsi:type="site.LstTimeZone"></bodyContent>';
        let xmlResult = await this.zendeskCall(xmlBody);
        var asJSON = mapTimeZoneResultToJSON(xmlResult);
        return asJSON;
    }
    async createMeeting(meetingPassword, meetingTopic, meetingStartDate, meetingDuration, timeZoneId, attendeeEmailArray) {
        //first check for overlaps - handled elsewhere
        // let overlaps = await this.existingMeetingsOverlap(startDate, duration, timeZoneId);
        // if (overlaps.length) {
        //     throw {
        //         msg: 'overlapping meetings',
        //         meetings: overlaps
        //     }
        // }
        const startDateWebex = moment(meetingStartDate).format(WEBEX_DATE_FORMAT);
        const xmlBody = `
            <bodyContent xsi:type="java:com.webex.service.binding.meeting.CreateMeeting">
                <accessControl>
                    <meetingPassword>${meetingPassword}</meetingPassword>
                </accessControl>
                <metaData>
                    <confName>${meetingTopic}</confName>
                </metaData>
                <telephony>
                    <telephonySupport>CALLIN</telephonySupport>
                    <intlLocalCallIn>TRUE</intlLocalCallIn>
                    <tollFree>TRUE</tollFree>
                </telephony>
                <attendeeOptions>
                    <emailInvitations>TRUE</emailInvitations>
                </attendeeOptions>
                <schedule>
                    <startDate>${startDateWebex}</startDate>
                    <duration>${meetingDuration}</duration>
                    <timeZoneID>${timeZoneId}</timeZoneID>
                </schedule>
                <participants>
                    <attendees>
                        ${attendeeEmailArray.map(attendee => `<attendee><person><email>${attendee}</email></person></attendee>`).join('')}
                    </attendees>
                </participants>
            </bodyContent>`
       let xmlResult = await this.zendeskCall(xmlBody);

            //let result = await  axios.post(this.getBaseURL(), XMLBaseTemplate(xmlBody), this.getAPICallConfig());
       return mapMeetingCreateResultToJSON(xmlResult);

    }
    async getMeetingList(startDate, endDate, timeZoneId) {
        const startDateWebex = moment(startDate).format(WEBEX_DATE_FORMAT);
        const endDateWebex = moment(endDate).format(WEBEX_DATE_FORMAT);
        const xmlBody =     `<bodyContent xsi:type="java:com.webex.service.binding.meeting.LstsummaryMeeting">
                                <dateScope>
                                    <startDateStart>${startDateWebex}</startDateStart>
                                    <startDateEnd>${endDateWebex}</startDateEnd>
                                    <endDateStart>${startDateWebex}</endDateStart>
                                    <endDateEnd>${endDateWebex}</endDateEnd>
                                    <timeZoneID>${timeZoneId}</timeZoneID>
                                </dateScope>
                            </bodyContent>`;

        let xmlResult = await this.zendeskCall(xmlBody);
        return mapMeetingListResultToJSON(xmlResult);
    }
    async existingMeetingsOverlap(startDate, duration, timezoneId) {
        // return an array of meetings that overlap with the current settings
        let endDate = moment(startDate).add(duration, 'minutes');
        let meetingList = await this.getMeetingList(startDate, endDate, timezoneId);
        console.log(meetingList);
        return meetingList
    }
    toWebexDate(date) {
        return moment(date, WEBEX_DATE_FORMAT);
    }
}

const instance = new WebexAPIWrapper();

export default instance;