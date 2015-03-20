var guid = function() {
  var s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var notify = {
  gid: null,
  RETRY_WAIT: 10,

  scheduleAttempt: function(functionName) {
    var wait = this.RETRY_WAIT, _this = this;
    console.debug("Scheduling '" + functionName + "' in " + wait + " seconds");

    var timer = setTimeout(function(){
      timer = null;
      _this[functionName]();
    }, wait * 1000);
  },

  hasConnection: false,
  parkConnection: function() {
    if (this.hasConnection) {
      console.warn("We already have an established push connection");
      return
    }

    var xhr = new XMLHttpRequest(), _this = this;
    xhr.open("POST", "/sse?gid=" + this.gid, !0)
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.withCredentials = false;
    xhr.timeout = 600 * 1000;

    xhr.ontimeout = function() {
      _this.hasConnection = false;
      _this.scheduleAttempt("parkConnection");
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          try {
            var value = JSON.parse(decodeURI(xhr.responseText));
            if (value.success) {
              $('.title').text('Sign In...');
              window.location.href = value.token_authentication_url;
            }
          } catch (ex) {
            console.debug("no data");
          }

          _this.hasConnection = false;
          var _timeout = setTimeout(function() {
            _this.parkConnection();
            clearTimeout(_timeout)
          }, 500);
        }

        if (xhr.status == 408) {
          console.debug("409: Request Time-out")
          _this.hasConnection = false;
          _this.scheduleAttempt("parkConnection");
        }

        if (xhr.status == 409) {
          console.debug("409: Re-parked multiple connections with the same pushToken")
          _this.hasConnection = false;
          _this.scheduleAttempt("parkConnection");
        }

        if (xhr.status == 403 || xhr.status == 401) {
          console.debug("403: The pushToken has expired")
          _this.hasConnection = false;
        }

        if (xhr.status == 0) {
          console.debug("Unknown error: The park push connection closed unexpectedly")
          _this.hasConnection = false;
          _this.scheduleAttempt("parkConnection");
        }
      }
    }
    this.hasConnection = true;
    xhr.send(null)
  }
}
