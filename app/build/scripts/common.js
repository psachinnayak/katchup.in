class _f {
    static byId(id) {
        return document.getElementById(id);
    }
    static on(elem, event, handler) {
        if (typeof (elem) == "string") {
            elem = _f.byId(elem);
        }
        elem.addEventListener(event, handler);
    }

    static async post(url, body, { contentType = "application/json", expectedContentType = "json" } = {}) {
        let headers = { "content-type": contentType };
        if (contentType == "application/json") {
            body = JSON.stringify(body);
        }
        return await _f.request("post", url, body, { headers, expectedContentType });
    }

    static async request(method, url, body, { expectedContentType, headers }) {
        return new Promise((resolve, reject) => {
            let xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = () => {
                if (xmlHttp.readyState == 4) {
                    if (xmlHttp.status == 200) {
                        let response = xmlHttp.responseText;

                        if (expectedContentType == "json") {
                            response = JSON.parse(response);
                        }

                        resolve(response);
                    } else {
                        let errorMsg = `Non success error ${xmlHttp.status} received while connecting to API ${url}`;
                        console.error(`${errorMsg}. Response is ${xmlHttp.responseText}`);
                        reject(new Error(errorMsg));
                    }
                }
            };
            xmlHttp.open(method, url);

            if (headers) {
                console.log("headers", headers);
                Object.getOwnPropertyNames(headers).forEach((header) => {
                    xmlHttp.setRequestHeader(header, headers[header]);
                });

            }
            xmlHttp.send(body);
        })

    }
}