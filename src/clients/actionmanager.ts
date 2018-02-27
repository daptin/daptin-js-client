import axios from "axios"

import jwtDecode from 'jwt-decode';

const ActionManager = function (appConfig, getToken) {

  const that = this;
  that.actionMap = {};

  this.setActions = function (typeName, actions) {
    that.actionMap[typeName] = actions;
  };


  this.base64ToArrayBuffer = function (base64) {
    const binaryString = window.atob(base64);
    const binaryLen = binaryString.length;
    const bytes = new Uint8Array(binaryLen);
    for (let i = 0; i < binaryLen; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  setTimeout(function () {
    that.a = document.createElement("a");
    document.body.appendChild(that.a);
    that.a.style = "display: none";
    return function (downloadData) {
      const blob = new Blob([atob(downloadData.content)], {type: downloadData.contentType}),
        url = window.URL.createObjectURL(blob);
      that.a.href = url;
      that.a.download = downloadData.name;
      that.a.click();
      window.URL.revokeObjectURL(url);
    };
  });

  this.saveByteArray = function (downloadData) {
    const blob = new Blob([atob(downloadData.content)], {type: downloadData.contentType}),
      url = window.URL.createObjectURL(blob);
    that.a.href = url;
    that.a.download = downloadData.name;
    that.a.click();
    window.URL.revokeObjectURL(url);
  };


  this.getGuestActions = function () {
    return new Promise(function (resolve, reject) {
      axios({
        url: appConfig.apiRoot + "/actions",
        method: "GET"
      }).then(function (respo) {
        console.log("Guest actions list: ", respo);
        resolve(respo.data)
      }, function (rs) {
        console.log("get actions list fetch failed", arguments);
        reject(rs)
      })
    });
  };

  this.doAction = function (type, actionName, data) {
    // console.log("invoke action", type, actionName, data);
    const that = this;
    return new Promise(function (resolve, reject) {
      axios({
        url: appConfig.apiRoot + "/action/" + type + "/" + actionName,
        method: "POST",
        headers: {
          "Authorization": "Bearer " + getToken()
        },
        data: {
          attributes: data
        }
      }).then(function (res) {
        resolve("completed");
        console.log("action response", res);
        const responses = res.data;
        for (let i = 0; i < responses.length; i++) {
          const responseType = responses[i].ResponseType;

          const data = responses[i].Attributes;
          switch (responseType) {
            case "client.notify":
              console.log("notify client", data);
              alert(JSON.stringify(data));
              break;
            case "client.store.set":
              console.log("notify client", data);
              window.localStorage.setItem(data.key, data.value);
              if (data.key === "token") {
                window.localStorage.setItem('user', JSON.stringify(jwtDecode(data.value)));
              }
              break;
            case "client.file.download":
              that.saveByteArray(data);
              break;
            case "client.redirect":
              (function (redirectAttrs) {

                setTimeout(function () {

                  const target = redirectAttrs["window"];

                  if (target === "self") {

                    if (redirectAttrs.location[0] === '/') {
                      window.location.replace(redirectAttrs.location);
                      // window.vueApp.$router.push(redirectAttrs.location)
                    } else {
                      window.location.replace(redirectAttrs.location);
                    }


                    // window.vueApp.$router.push(redirectAttrs.location);
                  } else {
                    window.open(redirectAttrs.location, "_target")
                  }

                }, redirectAttrs.delay)

              })(data);
              break;

          }
        }
      }, function (res) {
        console.log("action failed", res);
        reject("Failed");
        if (res.response.data.Message) {
          Notification.error(res.response.data.Message)
        } else {
          Notification.error("I failed to " + window.titleCase(actionName))
        }
      })

    })

  };

  this.addAllActions = function (actions) {

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const onType = action["OnType"];

      if (!that.actionMap[onType]) {
        that.actionMap[onType] = {};
      }

      that.actionMap[onType][action["Name"]] = action;
    }
  };

  this.getActions = function (typeName) {
    return that.actionMap[typeName];
  };

  this.getActionModel = function (typeName, actionName) {
    return that.actionMap[typeName][actionName];
  };

  return this;
};

export default ActionManager
