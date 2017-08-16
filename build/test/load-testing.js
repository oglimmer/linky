
// export LINKY_SERVER=https://linky1.com
// node -r babel-register -r babel-polyfill server/integration-tests/load-testing.js

import request from 'request-promise';
import randomstring from 'randomstring';
import pAll from 'p-all';

import { diff } from '../../src/util/ArrayUtil';

/* eslint-disable max-len */

// taken from: https://en.wikipedia.org/wiki/List_of_most_popular_websites
// const url = ['google.com', 'youtube.com', 'facebook.com', 'baidu.com', 'wikipedia.org', 'yahoo.com', 'reddit.com', 'google.co.in', 'qq.com', 'taobao.com', 'amazon.com', 'tmall.com', 'twitter.com', 'google.co.jp', 'sohu.com', 'live.com', 'vk.com', 'instagram.com', 'sina.com.cn', '360.cn', 'google.de', 'jd.com', 'google.co.uk', 'linkedin.com', 'weibo.com', 'google.fr', 'google.ru', 'google.com.br', 'yahoo.co.jp', 'yandex.ru', 'netflix.com', 't.co', 'google.com.hk', 'hao123.com', 'imgur.com', 'google.it', 'ebay.com', 'pornhub.com', 'google.es', 'detail.tmall.com', 'wordpress.com', 'msn.com', 'aliexpress.com', 'bing.com', 'tumblr.com', 'google.ca', 'livejasmin.com', 'microsoft.com', 'stackoverflow.com', 'twitch.tv', 'soso.com', 'blogspot.com', 'amazon.co.jp', 'ok.ru', 'google.com.mx', 'apple.com', 'Naver.com', 'mail.ru', 'imdb.com', 'popads.net', 'tianya.cn', 'office.com', 'google.co.kr', 'github.com', 'pinterest.com', 'paypal.com', 'diply.com', 'google.com.tw', 'google.com.tr', 'google.com.au', 'amazon.de', 'google.co.id', 'microsoftonline.com', 'onclckds.com', 'amazon.co.uk', 'txxx.com', 'adobe.com', 'wikia.com', 'cnzz.com', 'xhamster.com', 'coccoc.com', 'bongacams.com', 'fc2.com', 'pixnet.net', 'google.pl', 'dropbox.com', 'googleusercontent.com', 'gmw.cn', 'whatsapp.com', 'google.com.eg', 'google.co.th', 'google.com.sa', 'amazon.in', 'google.com.ar', 'bbc.co.uk', 'craigslist.org', 'bbc.com', 'soundcloud.com', 'google.nl', 'xvideos.com', 'booking.com', 'rakuten.co.jp', 'nytimes.com', 'alibaba.com', 'bet365.com', 'ebay.co.uk', 'quora.com', 'avito.ru', 'google.com.vn', 'dailymail.co.uk', 'globo.com', 'google.com.ph', 'google.com.co', 'uol.com.br', 'google.com.ua', 'nicovideo.jp', 'walmart.com', 'redtube.com', 'go2cloud.org', 'xnxx.com', 'accuweather.com', 'samsung.com', 'googleweblight.in', 'answers.yahoo.com', 'news.yahoo.co.jp', 'news.google.com'];
const url = ['oglimmer.de'];

const names = ['sophia', 'emma', 'olivia', 'ava', 'mia', 'isabella', 'riley', 'aria', 'zoe', 'charlotte', 'lily', 'layla', 'amelia', 'emily', 'madelyn', 'aubrey', 'adalyn', 'madison', 'chloe', 'harper', 'abigail', 'aaliyah', 'avery', 'evelyn', 'kaylee', 'ella', 'ellie', 'scarlett', 'arianna', 'hailey', 'nora', 'addison', 'brooklyn', 'hannah', 'mila', 'leah', 'elizabeth', 'sarah', 'eliana', 'mackenzie', 'peyton', 'maria', 'grace', 'adeline', 'elena', 'anna', 'victoria', 'camilla', 'lillian', 'natalie', 'jackson', 'aiden', 'lucas', 'liam', 'noah', 'ethan', 'mason', 'caden', 'oliver', 'elijah', 'grayson', 'jacob', 'michael', 'benjamin', 'carter', 'james', 'jayden', 'logan', 'alexander', 'caleb', 'ryan', 'luke', 'daniel', 'jack', 'william', 'owen', 'gabriel', 'matthew', 'connor', 'jayce', 'isaac', 'sebastian', 'henry', 'muhammad', 'cameron', 'wyatt', 'dylan', 'nathan', 'nicholas', 'julian', 'eli', 'levi', 'isaiah', 'landon', 'david', 'christian', 'andrew', 'brayden', 'john', 'lincoln'];
const tagStr = () => {
  let tagStrRes = '';
  for (let i = 0; i < 5; i += 1) {
    tagStrRes += names[parseInt(Math.random() * names.length, 10)];
    tagStrRes += ' ';
  }
  return tagStrRes.trim();
};


const main = (count) => {
  console.log(`------------${count}--------------`);
  const email = `${randomstring.generate()}@foo.com`;
  const password = randomstring.generate();

  let token;

  const server = process.env.LINKY_SERVER ? process.env.LINKY_SERVER : 'http://localhost:8080';

  const createdLinks = [];
  // let total = 0;

  const expect = str => ({
    toBeDefined: () => {
      if (typeof str === 'undefined') {
        throw new Error(`Not defined! ${str}`);
      }
    },
    toEqual: (otherStr) => {
      if (Array.isArray(str)) {
        if (diff(str, otherStr).length > 0) {
          throw new Error(`Different ${str} !== ${otherStr}`);
        }
      } else if (str !== otherStr) {
        throw new Error(`Different ${str} !== ${otherStr}`);
      }
    },
  });

  const leavingLinks = linkid => request.get({
    url: `${server}/leave?target=${linkid}`,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `authToken=${token}`,
    },
    json: true,
  });

  const createLink = () => request.post({
    url: `${server}/rest/links`,
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: {
      url: url[parseInt(Math.random() * url.length, 10)],
      tags: tagStr(),
      rssUrl: '',
      notes: 'what ever....',
    },
    json: true,
  })
  .then((result) => {
    expect(result.id).toBeDefined();
    expect(result.linkUrl).toBeDefined();
    expect(result.tags).toBeDefined();
    expect(result.callCounter).toBeDefined();
    expect(result.lastCalled).toBeDefined();
    expect(result.createdDate).toBeDefined();
    expect(result.rssUrl).toBeDefined();
    createdLinks.push(result);
    // total += 1;
  })
  .catch((err) => {
    console.log(`Failed to create link: ${err.message}`);
  });

  console.time('create user');
  request.post({
    url: `${server}/rest/users`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      email,
      password,
    },
    json: true,
  })
  .then((result) => {
    console.timeEnd('create user');
    expect(result.id).toBeDefined();
    return result;
  })
  .then(() => {
    console.time('authenticate user');
    return request.post({
      url: `${server}/rest/authenticate`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email,
        password,
      },
      json: true,
    });
  })
  .then((result) => {
    console.timeEnd('authenticate user');
    expect(result.token).toBeDefined();
    return result;
  })
  .then((result) => { token = result.token; })
  .then(() => {
    console.time('create links');
    const ps = [];
    for (let k = 0; k < 10; k += 1) {
      ps.push(createLink);
    }
    return pAll(ps, { concurrency: 4 });
  })
  .then(() => {
    console.timeEnd('create links');
    console.time('verifying links');
    return request.get({
      url: `${server}/rest/links/all`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      json: true,
    });
  })
  .then((result) => {
    console.timeEnd('verifying links');
    result.forEach((e) => {
      const eExpected = createdLinks.find(t => t.id === e.id);
      expect(eExpected).toBeDefined();
      expect(e.id).toEqual(eExpected.id);
      expect(e.linkUrl).toEqual(eExpected.linkUrl);
      expect(e.tags).toEqual(eExpected.tags);
      expect(e.callCounter).toEqual(eExpected.callCounter);
      expect(e.lastCalled).toEqual(eExpected.lastCalled);
      expect(e.createdDate).toEqual(eExpected.createdDate);
      expect(e.rssUrl).toEqual(eExpected.rssUrl);
      expect(e.pageTitle).toEqual(eExpected.pageTitle);
      expect(e.notes).toEqual(eExpected.notes);
    });
  })
  .then(() => {
    console.time('leaving links');
    const ps = [];
    for (let k = 0; k < 10; k += 1) {
      const linkid = createdLinks[parseInt(Math.random() * createdLinks.length, 10)].id;
      ps.push(() => leavingLinks(linkid));
    }
    return pAll(ps, { concurrency: 4 }).catch(() => Promise.resolve());
  })
  .then(() => console.timeEnd('leaving links'))
  .then(() => main(count + 1))
  .catch(err => console.log(err));
};

main(0);
