const ADS = {
  home_vrec_1: '22871344907',
  home_header: '22871344910',
  home_vrec_2: '22871344922',
  lastfm_mrec_1: '22870824082',
  lastfm_vrec_2: '22870824085',
  lastfm_vrec_1: '22871344919',
};

const HOME_ADS = ['home_header', 'home_vrec_1', 'home_vrec_2'];
const LASTFM_ADS = ['lastfm_mrec_1', 'lastfm_vrec_1', 'lastfm_vrec_2'];

const fusetag = window.fusetag || (window.fusetag = { que: [] });

loadAd = (id) => {
  const adID = ADS[id];
  document.querySelector(
    `#${id}`
  ).innerHTML = `<div id="fuse-ad-${adID}" data-fuse="${adID}"/>`;
  fusetag.que.push(function () {
    fusetag.registerZone(`fuse-ad-${adID}`);
    console.log('registered zone', `fuse-ad-${adID}`);
  });
};
loadHome = (page = 'home') => {
  console.log(page);
  fusetag.que.push(function () {
    fusetag.pageInit();
  });

  (page === 'home' ? HOME_ADS : LASTFM_ADS).forEach((id) => {
    loadAd(id);
  });
};
