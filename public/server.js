/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */
const SPOTIFY_ROOT = 'https://api.spotify.com/v1';
var userProfileSource = document.getElementById(
    'user-profile-template'
  ).innerHTML,
  userProfileTemplate = Handlebars.compile(userProfileSource),
  userProfilePlaceholder = document.getElementById('receipt');
const downloadBtn = () => document.getElementById('download');
const newTabBtn = () => document.getElementById('new-tab');
const logoutBtn = () => document.getElementById('logout');
const savePlaylistBtn = () => document.getElementById('save-playlist');

let displayName = 'RECEIPTIFY';
let username = null;

const customReceipt = [];

const DATE_OPTIONS = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};
const TODAY = new Date();

const TIME_RANGE_OPTIONS = {
  short_term: {
    num: 1,
    period: 'LAST MONTH',
  },
  medium_term: {
    num: 2,
    period: 'LAST 6 MONTHS',
  },
  long_term: {
    num: 3,
    period: 'ALL TIME',
  },
};

const EVENT_LISTENERS = [
  'short_term',
  'medium_term',
  'long_term',
  'ten-tracks',
  'fifty-tracks',
  'classic',
  'international',
];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const uppercaseLatinAccentedChars = [
  '’',
  'Á',
  'À',
  'Â',
  'Ä',
  'Ã',
  'Å',
  'Æ',
  'Ç',
  'Ð',
  'É',
  'È',
  'Ê',
  'Ë',
  'Í',
  'Ì',
  'Î',
  'Ï',
  'Ñ',
  'Ó',
  'Ò',
  'Ô',
  'Ö',
  'Õ',
  'Ø',
  'Œ',
  'ß',
  'Þ',
  'Ú',
  'Ù',
  'Û',
  'Ü',
  'Ý',
  'Ÿ',
];

const alphanumericAndAsciiSet = new Set();
const latinSet = new Set(uppercaseLatinAccentedChars);
// Adding uppercase English letters
for (let i = 65; i <= 90; i++) {
  alphanumericAndAsciiSet.add(String.fromCharCode(i));
}

// Adding lowercase English letters
for (let i = 97; i <= 122; i++) {
  alphanumericAndAsciiSet.add(String.fromCharCode(i));
}

// Adding numbers
for (let i = 48; i <= 57; i++) {
  alphanumericAndAsciiSet.add(String.fromCharCode(i));
}

// Adding standard ASCII characters (from space to tilde)
for (let i = 32; i <= 126; i++) {
  alphanumericAndAsciiSet.add(String.fromCharCode(i));
}

function wrapNonAlphanumericChars(str) {
  // Map each character to either itself or a wrapped version in a <span>
  const mappedChars = Array.from(str).map((char) =>
    alphanumericAndAsciiSet.has(char)
      ? char
      : latinSet.has(char)
      ? `<span class="latin">${char}</span>`
      : `<span class="smaller">${char}</span>`
  );

  // Join all the elements back into a single string
  return mappedChars.join('');
}

const getMinSeconds = (duration_ms) => {
  const minutes = Math.floor(duration_ms / 60000);
  const seconds = ((duration_ms % 60000) / 1000).toFixed(0);
  const durationFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  return durationFormatted;
};
const getNameUpper = (item) => {
  return wrapNonAlphanumericChars(item?.name?.toUpperCase() ?? '');
};
const getArtists = (item) =>
  item.artists.map((artist) =>
    wrapNonAlphanumericChars(artist.name.trim().toUpperCase())
  );
const getDurationUnformatted = (item) => parseFloat(`${item.duration_ms}`);
const getDuration = (item) => {
  const duration_ms = getDurationUnformatted(item);
  return getMinSeconds(duration_ms);
};

const TYPE_FUNCTIONS = {
  tracks: {
    getResponseItems: (response, stats) => response.items,
    itemFns: {
      name: (item) => `${getNameUpper(item)} - `,
      artists: getArtists,
      duration_ms: getDuration,
    },
    totalIncrement: getDurationUnformatted,
    explanation: [
      {
        label: 'QTY',
        explanation:
          'The ranking of a track in your most played. The higher up on the list, the more played it is.',
      },
      {
        label: 'AMT',
        explanation: 'The length of a song',
      },
    ],
  },
  artists: {
    getResponseItems: (response, stats) => response.items,
    itemFns: {
      name: getNameUpper,
      artists: () => [],
      duration_ms: (item) => parseFloat(item.popularity),
    },
    totalIncrement: (item) => parseFloat(item.popularity),
    explanation: [
      {
        label: 'QTY',
        explanation:
          'The ranking of an artist in your most played. The higher up on the list, the more played it is.',
      },
      {
        label: 'AMT',
        explanation:
          'The popularity of an artist, from 0-100. 100 is the most popular, and 0 is the least popular.',
      },
    ],
  },
  genres: {
    getResponseItems: (response, stats) => getTopGenres(response.items),
    itemFns: {
      name: getNameUpper,
      artists: () => [],
      duration_ms: (num) => `${getDurationUnformatted(num).toFixed(2)}%`,
    },
    totalIncrement: getDurationUnformatted,
    explanation: [
      {
        label: 'QTY',
        explanation: 'The ranking of a genre in your most played artists.',
      },
      {
        label: 'AMT',
        explanation:
          'The % of your top artists that a genre appears in. For example, 25% means that 25% of your top artists fall under the genre.',
      },
    ],
  },
  stats: {
    getResponseItems: (response, stats) => stats,
    itemFns: {
      name: getNameUpper,
      artists: () => [],
      duration_ms: (item) => item.duration_ms,
    },
    totalIncrement: getDurationUnformatted,
    explanation: [
      {
        label: 'Popularity Score',
        explanation:
          'The average popularity score of your top 50 artists, form 0-100. The lower the number, the more "obscure" your music taste is.',
      },
      {
        label: 'Average Track Age',
        explanation:
          'The average number of years since release of each of your top tracks. The higher this number, the "older" your music taste is.',
      },
      {
        label: 'Tempo',
        explanation: 'The average BPM of your top tracks',
      },
      {
        label: 'Happiness',
        explanation:
          'A measure from 0 to 100 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).',
      },
      {
        label: 'Danceability',
        explanation:
          'Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0 is least danceable and 100 is most danceable.',
      },
      {
        label: 'Energy',
        explanation:
          'The average "energy level" of your top tracks out of 100. Typically, energetic tracks feel fast, loud, and noisy. The higher this number is, the more energetic your music is.',
      },
      {
        label: 'Acousticness',
        explanation:
          'This value describes how acoustic a song is. A score of 100 means the song is most likely to be an acoustic one.',
      },
      {
        label: 'Instrumentalness',
        explanation:
          'Predicts whether a track contains no vocals. "Ooh" and "aah" sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly "vocal". The closer the instrumentalness value is to 100, the greater likelihood the track contains no vocal content. Values above 50 are intended to represent instrumental tracks.',
      },
    ],
  },
  'show-search': {
    getResponseItems: (response, stats) => response.tracks.items,
    itemFns: {
      name: getNameUpper,
      artists: () => [],
      duration_ms: getDuration,
    },
    totalIncrement: getDurationUnformatted,
    explanation: [
      {
        label: 'QTY',
        explanation: 'The order of a track in an album.',
      },
      {
        label: 'AMT',
        explanation: 'The length of a track.',
      },
    ],
  },
  'build-receipt': {
    getResponseItems: (response, stats) => response,
    itemFns: {
      name: (item) => `${getNameUpper(item)} - `,
      artists: getArtists,
      duration_ms: getDuration,
    },
    totalIncrement: getDurationUnformatted,
    explanation: [],
  },
};

const hideReceipt = () => {
  $('#loggedin').hide();
  $('#receipt').hide();
  $('#logout-btn').hide();
  $('#login').show();
  // $('.desktop-ad')?.show();
};

const showReceipt = () => {
  $('#login').hide();
  $('#receipt').show();
  $('#loggedin').show();
  $('#logout-btn').show();
  // $('.desktop-ad')?.hide();
};

const getFont = () => {
  return (
    document.querySelector('input[name="font-select"]:checked')?.value ??
    'classic'
  );
};

const getType = () => {
  return document.getElementById('type-select-dropdown')?.value;
};

const getPeriod = () => {
  return (
    document.querySelector('input[name="period-select"]:checked')?.value ??
    'short_term'
  );
};

const getNum = () => {
  return (
    document.querySelector('input[name="num-select"]:checked')?.value ?? 'ten'
  );
};

const offScreen = () => document.querySelector('.receiptContainer');

const initSearch = () => {
  const type = getType();
  $('#search-form').show();
  console.log(type);
  if (type === 'show-search' || customReceipt.length === 0) {
    $('#start-searching').show();
    $('#receipt').hide();
    $('#track-edit').hide();
  }
  if (type === 'build-receipt') {
    $('#track-edit').show();
    $('#custom-name').show();
    const onchange = _.debounce((e) => $('.logo').html(e?.target?.value), 300);
    $('#custom-name').on('input', onchange);
    $('.logo').html($('#custom-name').val());
    displayReceipt(customReceipt);
  }
  $('#options').hide();
  $('#num-options').hide();
  $('#options-header').hide();
  $('#num-header').hide();
  const searchBox = $('#searchBox');

  const obj = type === 'build-receipt' ? 'track' : 'album';

  searchBox.autocomplete({
    minLength: 3,
    source: _.debounce((request, response) => {
      console.log(type === 'build-receipt' ? 'track' : 'album');
      $.ajax({
        url: `${SPOTIFY_ROOT}/search?q=${request.term}&type=${obj}&limit=10`,
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
        success: function (data) {
          console.log(data);

          const items = ((data.albums ?? data.tracks)?.items ?? []).map(
            (item) => ({
              label: `${item.name} - ${item.artists
                .map((artist) => artist.name)
                .join(', ')}`,
              value: item.id,
            })
          );
          response(items);
        },
        error: function (error) {
          console.error('Error:', error);
        },
      });
    }, 300),
    select: function (event, ui) {
      $.ajax({
        url: `${SPOTIFY_ROOT}/${obj}s/${ui.item.value}`,
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
        success: function (data) {
          $('#receipt').show();
          if (obj === 'track') {
            customReceipt.push(data);
            displayReceipt(customReceipt);
          } else {
            const selectedAlbum = data;
            searchBox.val('');
            displayReceipt(selectedAlbum);
          }
        },
        error: function (error) {
          console.error('Error:', error);
        },
      });
      return false;
    },
  });
};

const getHashParams = () => {
  var hashParams = {};
  var e,
    r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
};

const hiddenClone = (element) => {
  // Create clone of element
  var clone = element.cloneNode(true);

  // Position element relatively within the
  // body but still out of the viewport
  var style = clone.style;
  style.position = 'relative';
  style.top = window.innerHeight + 'px';
  style.left = 0;
  // Append clone to body and return the clone
  document.body.appendChild(clone);
  return clone;
};

const downloadImg = () => {
  const type = getType();
  const period = getPeriod();

  const fileName = `top_${type}_${period}`;
  window.scrollTo(0, 0);
  var clone = hiddenClone(offScreen());
  // Use clone with htm2canvas and delete clone
  html2canvas(clone, { scrollY: -window.scrollY }).then((canvas) => {
    var dataURL = canvas.toDataURL('image/png', 1.0);
    document.body.removeChild(clone);
    var link = document.createElement('a');
    link.href = dataURL;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};

const newTab = () => {
  const type = getType();
  const period = getPeriod();

  const fileName = `top_${type}_${period}`;
  window.scrollTo(0, 0);
  var clone = hiddenClone(offScreen());
  // Use clone with htm2canvas and delete clone
  html2canvas(clone, { scrollY: -window.scrollY }).then((canvas) => {
    var dataURL = canvas.toDataURL('image/png', 1.0);
    document.body.removeChild(clone);
    const newWindow = window.open('about:blank');
    let img = newWindow.document.createElement('img');

    // Set the src attribute to the data URL
    img.src = dataURL;

    // Append the img element to the body of the new window
    newWindow.document.body.appendChild(img);
  });
};

const getMonthYear = () => {
  // Create a new Date object for the current date and time

  // Get the name of the current month
  const monthName = MONTH_NAMES[TODAY.getMonth()].toLowerCase();

  // Get the full year
  const year = TODAY.getFullYear();

  return `${monthName} ${year}`;
};

const addSongsToPlaylist = (playlistId, uris, spotifyUrl) => {
  $.ajax({
    url: `${SPOTIFY_ROOT}/playlists/${playlistId}/tracks`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + access_token,
    },
    data: JSON.stringify({
      uris,
      position: 0,
    }),
    success: function (data) {
      $('#save-playlist').text('Save as Playlist');
      window.open(spotifyUrl);
    },
    error: function (error) {
      console.error('Error:', error);
    },
  });
};

const createPlaylist = (uris) => {
  if (username == null || uris == null || uris.length === 0) return;

  const period = getPeriod();

  $.ajax({
    url: `${SPOTIFY_ROOT}/users/${username}/playlists`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + access_token,
    },
    data: JSON.stringify({
      name: `${TIME_RANGE_OPTIONS[period].period.toLowerCase()}${
        period === 'long_term' ? '' : "'s"
      } top tracks - ${getMonthYear()}`,
      description: 'generated by receiptify (receiptify.herokuapp.com)',
      public: true,
    }),
    success: function (data) {
      const playlistId = data.id;
      addSongsToPlaylist(playlistId, uris, data.external_urls.spotify);
    },
    error: function (error) {
      console.error('Error:', error);
    },
  });
};

const saveAsPlaylist = (response) => {
  $('#save-playlist').text('loading...');
  const tracks = response.items;
  const uris = tracks.map(({ uri }) => uri);

  createPlaylist(uris);
};

const logout = () => {
  const url = 'https://accounts.spotify.com/logout';
  const spotifyLogoutWindow = window.open(
    url,
    'Spotify Logout',
    'width=700,height=500,top=40,left=40'
  );
  setTimeout(() => {
    spotifyLogoutWindow.close();
    location.href = '/index.html';
  }, 2000);
};

function getTopGenres(artists) {
  const genres = {};
  $('#num-options').hide();
  $('#num-header').hide();

  artists.forEach((artist) => {
    artist.genres?.forEach((genre) => {
      if (!genres[genre]) {
        genres[genre] = 0;
      }
      genres[genre] += 1;
    });
  });

  const genreArr = Object.keys(genres).map(function (key) {
    return {
      name: key.toUpperCase(),
      duration_ms: (genres[key] / artists.length) * 100,
    };
  });

  // Sort the array based on the second element
  genreArr.sort(function (first, second) {
    return second.duration_ms - first.duration_ms;
  });
  return genreArr.slice(0, 10);
}

const removeTrack = (i) => {
  console.log(i);
  if (i >= 0 && i < customReceipt.length) {
    customReceipt.splice(i, 1); // Removes 1 element at index i
    displayReceipt(customReceipt);
  }
};
const displayReceipt = (response, stats) => {
  const type = getType();
  const font = getFont();
  const timeRange = getPeriod();
  const showSearch = type === 'show-search' || type === 'build-receipt';
  if (type !== 'show-search')
    if (!$('#receipt').is(':visible')) $('#receipt').show();
  $('#start-searching').hide();

  const fns = TYPE_FUNCTIONS[type];
  const { getResponseItems, itemFns, totalIncrement } = fns;

  if (type === 'build-receipt') {
    $('#track-edit').show();
    const trackHTML = customReceipt
      .map((item, i) => {
        return `<div>
                <p>${item.name} - ${getArtists(item)}</p>
                <p class="remove" onclick="removeTrack(${i})">remove</p>
              </div>`;
      })
      .join('');
    $('#track-edit').html(
      `${
        customReceipt.length > 0
          ? '<p class="customize-header explanation-header">Tracklist</p>'
          : ''
      }${trackHTML}`
    );
  } else {
    $('#track-edit').hide();
  }

  if (fns.explanation != null && fns.explanation.length > 0) {
    $('#explanation').show();
    const defs = fns.explanation.map(({ label, explanation }) => {
      return `<p>
                <b>${label}</b> - ${explanation}
              </p>`;
    });
    $('#definitions').html(defs.join(''));
  } else {
    $('#explanation').hide();
  }

  const responseItems = getResponseItems(response, stats);

  let total = 0;
  const date = TODAY.toLocaleDateString('en-US', DATE_OPTIONS).toUpperCase();
  const tracksFormatted = responseItems.map((item, i) => {
    total += totalIncrement(item);
    return {
      id: (i + 1 < 10 ? '0' : '') + (i + 1),
      url: item.external_urls?.spotify,
      ...Object.fromEntries(
        Object.entries(itemFns).map(([key, fn]) => [key, fn(item)])
      ),
    };
  });
  const totalFormatted =
    type === 'tracks' || showSearch ? getMinSeconds(total) : total.toFixed(2);

  userProfilePlaceholder.innerHTML = userProfileTemplate({
    tracks: tracksFormatted,
    total: totalFormatted,
    time: date,
    num: showSearch ? 1 : TIME_RANGE_OPTIONS[timeRange].num,
    name: showSearch && response.label ? response.label : displayName,
    period: showSearch
      ? response.artists?.map((artist) => artist.name.trim()).join(', ') ??
        undefined
      : TIME_RANGE_OPTIONS[timeRange].period,
    receiptTitle:
      showSearch && response.name ? response.name.toUpperCase() : 'receiptify',
    itemCount: tracksFormatted.length,
    isStats: type === 'stats',
    isInternational: font === 'international',
  });

  if (type === 'build-receipt') {
    $('.logo').html(
      $('#custom-name').val() == null || $('#custom-name').val() === ''
        ? 'receiptify'
        : $('#custom-name').val()
    );
  }

  if (type !== 'build-receipt') window.scrollTo(0, 0);

  downloadBtn().addEventListener('click', downloadImg);
  newTabBtn().addEventListener('click', newTab);
  logoutBtn().addEventListener('click', logout);

  if (type === 'tracks') {
    $('#save-playlist').show();
    document
      .getElementById('save-playlist')
      ?.addEventListener('click', () => saveAsPlaylist(response));
  } else {
    $('#save-playlist').hide();
  }
};

function getAvg(arr) {
  return arr.reduce((a, b) => a + b) / arr.length;
}

function getAvgPopularity(artists) {
  const popularity = artists.map(({ popularity }) => popularity);
  return getAvg(popularity);
}

function getAvgAge(tracks) {
  const years = tracks.map((track) => track?.album?.release_date);
  const songAges = years.map((year) => parseInt(TODAY - new Date(year)));

  // convert to years
  return (getAvg(songAges) / 31536000000).toFixed(1);
}

function getAudioFeatures(response) {
  const features = {};
  const keys = [
    'tempo',
    'valence',
    'danceability',
    'energy',
    'acousticness',
    'instrumentalness',
  ];
  keys.forEach((key) => {
    const avgVal = getAvg(response?.audio_features?.map((track) => track[key]));
    if (key === 'tempo') {
      features[key] = `${avgVal.toFixed(1)} BPM`;
    } else {
      features[key] = `${(avgVal * 100).toFixed(2)}`;
    }
  });
  return features;
}

function displayStats(response, artists, tracks) {
  $('#num-header').hide();
  $('#num-options').hide();
  const popularity = getAvgPopularity(artists).toFixed(2);
  const trackIDs = tracks.map(({ id }) => id);
  const age = getAvgAge(tracks);
  $.ajax({
    url: `${SPOTIFY_ROOT}/audio-features?ids=${trackIDs.join(',')}`,
    headers: {
      Authorization: 'Bearer ' + access_token,
    },
    success: (response) => {
      const features = getAudioFeatures(response);
      const stats = {
        'POPULARITY SCORE': `${popularity}/100`,
        'AVERAGE TRACK AGE': `${age} YRS`,
        ...features,
      };
      const statsArr = Object.keys(stats).map(function (key) {
        return {
          name: key === 'valence' ? 'HAPPINESS' : key.toUpperCase(),
          duration_ms: stats[key],
        };
      });
      displayReceipt(response, statsArr);
    },
  });
}

function mostPlayedSongs(recentlyPlayedSongs) {
  // Create an object to store the count of each song
  const songCount = {};

  // Iterate over the recently played songs array
  recentlyPlayedSongs.forEach((song) => {
    const songId = song.id;

    // If the song ID exists in the songCount object, increment its count
    if (songCount.hasOwnProperty(songId)) {
      songCount[songId]++;
    } else {
      // If the song ID doesn't exist, initialize its count to 1
      songCount[songId] = 1;
    }
  });

  // Sort the songCount object by count in descending order
  const sortedSongs = Object.entries(songCount).sort((a, b) => b[1] - a[1]);

  // Get the top 10 most played songs
  // const top10Songs = sortedSongs.slice(0, 10);
  const top10Songs = sortedSongs;

  // Extract the song details (title, artist name) and number of times played
  const top10SongsWithDetails = top10Songs.map(([songId, playCount]) => {
    const song = recentlyPlayedSongs.find((song) => song.id === songId);
    return {
      id: songId,
      title: song.attributes.name,
      artist: song.attributes.artistName,
      playCount: playCount,
    };
  });
}

async function nRecentlyPlayed(n, music) {
  const trackPromises = [];
  let offset = 0;
  let continueRequesting = true;

  while (continueRequesting && offset < n) {
    const promise = music.api.music(
      `v1/me/recent/played/tracks?limit=30&offset=${offset * 30}`
    );
    trackPromises.push(promise);

    offset++;

    promise.then((result) => {
      if (result.data.length === 0) {
        continueRequesting = false;
      }
    });
  }

  const results = await Promise.all(trackPromises);
  const recentlyPlayedSongs = results.map((result) => result.data.data);

  return recentlyPlayedSongs.flat();
}

function retrieveItems() {
  $('#search-form').hide();
  $('#custom-name').hide();
  $('#options').show();
  $('#options-header').show();

  const type = getType();
  if (type === 'show-search' || type === 'build-receipt') {
    initSearch();
    return;
  }
  if (type === 'stats') {
    retrieveStats();
    return;
  }
  let num = 10;

  if (type === 'artists' || type === 'tracks') {
    $('#num-options').show();
    $('#num-header').show();
    if (getNum() === 'fifty') {
      num = 50;
    }
  } else {
    $('#num-options').hide();
    $('#num-header').hide();
  }
  const selectedType = type === 'genres' ? 'artists' : type;
  const timeRangeSlug = getPeriod();
  const limit = num;

  if (type === 'genres') {
    $.ajax({
      url: `${SPOTIFY_ROOT}/me/top/artists?limit=49&time_range=${timeRangeSlug}`,
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
      success: (response) => {
        if (response.next != null) {
          $.ajax({
            url: response.next,
            headers: {
              Authorization: 'Bearer ' + access_token,
            },
            success: (response2) => {
              displayReceipt({
                ...response,
                items: [...response.items, ...response2.items],
              });
            },
          });
        }
      },
    });
  } else {
    $.ajax({
      url: `${SPOTIFY_ROOT}/me/top/${
        selectedType ?? 'tracks'
      }?limit=${limit}&time_range=${timeRangeSlug}`,
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
      success: displayReceipt,
    });
  }
}

function retrieveStats() {
  const timeRangeSlug = getPeriod();
  const limit = 50;
  $.ajax({
    url: `${SPOTIFY_ROOT}/me/top/artists?limit=${limit}&time_range=${timeRangeSlug}`,
    headers: {
      Authorization: 'Bearer ' + access_token,
    },
    success: (response) => {
      const artists = response?.items;
      $.ajax({
        url: `${SPOTIFY_ROOT}/me/top/tracks?limit=${limit}&time_range=${timeRangeSlug}`,
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
        success: (response) => {
          const tracks = response?.items;
          displayStats(response, artists, tracks);
        },
      });
    },
  });
}

function retrieveItemsApple(hist) {
  // $('#spotify-logo').hide();
  document.querySelectorAll('.btn-group').forEach((el) => {
    el.style.display = 'none';
  });
  let data = {
    responseItems: hist,
    total: 0,
    date: TODAY.toLocaleDateString('en-US', DATE_OPTIONS).toUpperCase(),
    json: true,
  };
  let albumInfoArr = [];
  for (var i = 0; i < data.responseItems.length; i++) {
    const attributes = data.responseItems[i].attributes;
    const isAlbum = data.responseItems[i].type.includes('albums');
    const albumInfo = {
      id: (i + 1 < 10 ? '0' : '') + (i + 1),
      duration_ms: isAlbum ? attributes.trackCount : 1,
      name: isAlbum
        ? attributes.name.toUpperCase() + ' - ' + attributes.artistName
        : attributes.name.toUpperCase(),
    };
    albumInfoArr.push(albumInfo);
    data.total += albumInfo.duration_ms;
  }
  userProfilePlaceholder.innerHTML = userProfileTemplate({
    tracks: albumInfoArr,
    total: data.total,
    time: data.date,
    num: 1,
    name: displayName,
    period: 'HEAVY ROTATION',
    receiptTitle: 'receiptify',
    itemCount: albumInfoArr.length,
  });

  const logoutBtn = logoutBtn;
  const spotifyLogo = document.getElementById('spotify-logo');
  if (logoutBtn) {
    logoutBtn().style.display = 'none';
  }
  if (spotifyLogo) {
    spotifyLogo.style.display = 'none';
  }

  newTabBtn().style.display = 'none';
  document
    .getElementById('download')
    .addEventListener('click', () => downloadImg('heavy_rotation'));
}

let params = getHashParams();

let access_token = params.access_token,
  dev_token = params.dev_token,
  client = params.client,
  error = params.error;

if (error) {
  alert('There was an error during the authentication');
} else {
  if (client === 'spotify' && access_token) {
    $.ajax({
      url: `${SPOTIFY_ROOT}/me`,
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
      success: function (response) {
        displayName = response.display_name.toUpperCase();
        username = response.id;
        showReceipt();
        retrieveItems();
      },
    });
  } else if (client === 'applemusic' && dev_token) {
    document.addEventListener('musickitloaded', async function () {
      // Call configure() to configure an instance of MusicKit on the Web.
      try {
        await MusicKit.configure({
          developerToken: dev_token,
          app: {
            name: 'receiptify',
            build: '1.0.0',
          },
        });
      } catch (err) {
        console.log(err);
      }

      const music = MusicKit.getInstance();
      await music.authorize();
      const { data: result } = await music.api.music(
        'v1/me/history/heavy-rotation'
      );
      // const { data: result } = await music.api.music(
      //   'v1/me/recent/played/tracks?limit=10&offset=0'
      // );
      // const recent = await nRecentlyPlayed(10, music);
      showReceipt();
      // mostPlayedSongs(recent);
      retrieveItemsApple(result.data);
    });
    $('#loggedin').hide();
  } else {
    // render initial screen
    hideReceipt();
  }

  EVENT_LISTENERS.forEach((id) =>
    document.getElementById(id).addEventListener('click', retrieveItems, false)
  );

  document
    .getElementById('type-select-dropdown')
    .addEventListener('change', retrieveItems);
}

document
  .querySelector('.hamburger-menu')
  .addEventListener('click', function () {
    document.querySelector('.navColor ul').classList.toggle('show');
  });
$('#logout-btn').hide();
