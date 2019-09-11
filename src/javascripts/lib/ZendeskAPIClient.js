class ZendeskAPIClient {
    init(onReady) {
        this._client = ZAFClient.init()
        this._client.metadata().then(x => {this._metadata = x; onReady()});
    }
    resizeContainer(max = Number.POSITIVE_INFINITY, maxWidth = Number.POSITIVE_INFINITY) {
        // const newHeight = Math.min(document.body.clientHeight, max)
        // const newWidth = Math.min(document.body.clientWidth, maxWidth);
        return this._client.invoke('resize', { height: max , width: maxWidth})
    }
    async post(url, data, options ) {
         let requestOptions = Object.assign({
            type: 'POST',
            url: url,
            data: data
        }, options);

        //let result = await this._client.request(requestOptions);
        let result = await this._client.request(requestOptions);

        return result;

    }
    async createComment(ticketID, commentText, asHtml = false) {
        const body = {
            "ticket": {
                "comment": {
                    //"body": commentText,
                    "public": "no"
                }
            }
        }
        if (asHtml) {
            body.ticket.comment.html_body = commentText
        } else {
            body.ticket.comment.body = commentText
        }
        const requestOptions = {
            type: 'PUT',
            url: `/api/v2/tickets/${ticketID}.json`,
            data: body
        }
        let result = await this._client.request(requestOptions);
    }
    metadata() {
        return this._metadata;
    }
    async getTicket() {
        let ticket = await this._client.get('ticket');
        return ticket.ticket;
    }
    async currentUser() {
        let user = await this._client.get('currentUser');
        return user.currentUser;
    }
    modalDlg(msgObj, listeners) {
        /* msgObj = {
            vueComponentName: '',
            props: []
        }
        listeners = [
            {event: 'modal.OK,
            fn: function(data) {
            scope: this
            }
        }
        ]
        */
        this._client.context()
        .then(
            context => {
                msgObj._parent_guid = context.instanceGuid;
                let urlData = encodeURI(JSON.stringify(msgObj));
                let options = {
                    location: "modal",
                    url: "assets/modal.html#" + urlData
                }
                return this._client.invoke('instances.create', options)
            }
        )
        .then(
            data => {
                let instanceGuid = data['instances.create'][0].instanceGuid;
                let modalClient = this._client.instance(instanceGuid);
                for (let listener in listeners) {
                    modalClient.on(listener.event, data => {
                        if (listener.fn && (typeof listener.fn === "function")){
                            listener.fn.call(listener.scope || this, data);
                        }
                    });
                }
            }
        )
    }

    // for modals
    destroyInstance() {
        this._client.invoke('destroy');
    }
    emitEvent(eventName, data) {
        this._client.trigger(eventName, data);
    }
  }

  const instance = new ZendeskAPIClient();

  export default instance;