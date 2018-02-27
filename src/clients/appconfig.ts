const AppConfig = function (endpoint) {

  endpoint = endpoint || window.location.host;

  const that = this;

  that.location = {
    host: endpoint,
    apiRoot: window.location.protocol + "//" + endpoint
  };

  that.data = {};

  that.localStorage = {
    getItem: function (key) {
      return that.data[key]
    },
    setItem: function (key, item) {
      that.data[key] = item;
    }
  };

  return that;
};

export default AppConfig
