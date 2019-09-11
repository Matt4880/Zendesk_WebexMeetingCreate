# Zendesk_WebexMeetingCreate
An application designed for internal use to enable easy scheduling of Webex tickets using a Zendesk API V2 plugin.

The app consists of 2 instances of Zendesk Apps - one for the main sidebar app (src/javascripts/locations/ticket_sidebar.js) and a dynamic view builder for modal dialogs (src/javascripts/locations/modal.js)

As this is a learning exercise as well as much as a tool, there is a lot of the scaffold code still unused (Jest testing, i18n, images) but not removed

Uses Vue for UI and is built upon the Zendesk official scaffold

Communication via Zendesk REST API and Zendesk Application Framework (https://developer.zendesk.com/apps/docs/developer-guide/using_sdk). Webex integration via XML API (https://developer.cisco.com/docs/webex-xml-api-reference-guide/#!xml-request-and-response-documents)