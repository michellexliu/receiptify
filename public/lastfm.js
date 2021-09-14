// require("dotenv").config();

const lastfmKey = config.lastfmKey;

/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */

var displayName = "RECEIPTIFY";
var dateOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
};
var today = new Date();

function hiddenClone(element) {
  // Create clone of element
  var clone = element.cloneNode(true);

  // Position element relatively within the
  // body but still out of the viewport
  var style = clone.style;
  style.position = "relative";
  style.top = window.innerHeight + "px";
  style.left = 0;
  // Append clone to body and return the clone
  document.body.appendChild(clone);
  return clone;
}

let receiptSource = document.getElementById("receipt-template").innerHTML,
  userProfileTemplate = Handlebars.compile(receiptSource),
  userProfilePlaceholder = document.getElementById("receipt");

function retrieveTracks(user, timeRangeSlug, domNumber, domPeriod) {
  const userUrl = "https://ws.audioscrobbler.com/2.0/";
  $.ajax({
    url: userUrl,
    data: {
      method: "user.gettoptracks",
      user: user,
      period: timeRangeSlug,
      limit: 10,
      api_key: lastfmKey,
      format: "json"
    },
    success: function (response) {
      if ($("#receipt").hasClass("hidden")) {
        $("#receipt").removeClass("hidden");
      }

      const trackList = response.toptracks.track;
      let totalPlays = 0;
      let totalTime = 0;
      const date = today.toLocaleDateString("en-US", dateOptions).toUpperCase();

      for (var i = 0; i < trackList.length; i++) {
        trackList[i].name = trackList[i].name.toUpperCase();
        trackList[i].artist.name = trackList[i].artist.name.toUpperCase();
        let playsInt = parseInt(trackList[i].playcount, 10);
        let durationInt = parseInt(trackList[i].duration, 10);
        totalPlays += playsInt;
        totalTime += playsInt * durationInt;
        let minutes = Math.floor(durationInt / 60);
        let seconds = (durationInt % 60).toFixed(0);
        trackList[i].duration = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
      }
      let days = Math.floor(totalTime / 86400);
      let hours = Math.floor((totalTime - days * 86400) / 3600);
      minutes = Math.floor((totalTime - days * 86400 - hours * 3600) / 60);
      seconds = totalTime - days * 86400 - hours * 3600 - minutes * 60;
      totalTime =
        (days > 0 ? days + ":" : "") +
        (days > 0 && hours < 10 ? "0" : "") +
        hours +
        ":" +
        (minutes < 10 ? "0" : "") +
        minutes +
        ":" +
        (seconds < 10 ? "0" : "") +
        seconds;
      userProfilePlaceholder.innerHTML = userProfileTemplate({
        tracks: trackList,
        totalPlays: totalPlays,
        totalTime: totalTime,
        time: date,
        num: domNumber,
        name: user.toUpperCase(),
        period: domPeriod
      });
      document.getElementById("download").addEventListener("click", function () {
        var offScreen = document.querySelector(".receiptContainer");
        window.scrollTo(0, 0);
        var clone = hiddenClone(offScreen);
        // Use clone with htm2canvas and delete clone
        html2canvas(clone, { scrollY: -window.scrollY }).then((canvas) => {
          var dataURL = canvas.toDataURL("image/png", 1.0);
          document.body.removeChild(clone);
          var link = document.createElement("a");
          console.log(dataURL);
          link.href = dataURL;
          link.download = `${timeRangeSlug}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      });
    }
  });
}

const user = document.getElementById("user-search");
user.addEventListener("submit", async function (e) {
  e.preventDefault();
  const username = new FormData(user).get("username");
  console.log(username);
  //const userUrl = `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastfmKey}`;
  const userUrl = "https://ws.audioscrobbler.com/2.0/";
  $.ajax({
    url: userUrl,
    data: {
      method: "user.getinfo",
      user: username,
      api_key: lastfmKey
    },
    success: function (response) {
      if (!$("#error-message").hasClass("hidden")) {
        $("#error-message").addClass("hidden");
      }
      if (!$("#receipt").hasClass("hidden")) {
        $("#receipt").addClass("hidden");
      }

      $("#options").removeClass("hidden");

      document.getElementById("week").addEventListener(
        "click",
        function () {
          retrieveTracks(username, "7day", 1, "LAST WEEK");
        },
        false
      );
      document.getElementById("month").addEventListener(
        "click",
        function () {
          retrieveTracks(username, "1month", 2, "LAST MONTH");
        },
        false
      );
      document.getElementById("three_months").addEventListener(
        "click",
        function () {
          retrieveTracks(username, "3month", 3, "LAST 3 MONTHS");
        },
        false
      );
      document.getElementById("six_months").addEventListener(
        "click",
        function () {
          retrieveTracks(username, "6month", 4, "LAST 6 MONTHS");
        },
        false
      );
      document.getElementById("year").addEventListener(
        "click",
        function () {
          retrieveTracks(username, "12month", 5, "LAST YEAR");
        },
        false
      );
    },
    error: function () {
      if (!$("#options").hasClass("hidden")) {
        $("#options").addClass("hidden");
      }
      $("#error-message").removeClass("hidden");
    }
  });
});
