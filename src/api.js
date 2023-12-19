const express = require('express');
const app = express();
const segment = require('../api/parts')
const tokenResolver = require('../api/token')
const { refreshAuthtoken } = tokenResolver;

let cloudFlareRes = {}, authtoken = {}

const fetchData = async (url, headers, body) => {
  const response = await fetch(url, {
    headers: {
      authtoken,
      ...(headers ?? {}),
      ...(cloudFlareRes.solution?.headers ?? {}),
      cookie: cloudFlareRes.solution?.cookies?.reduce((accum, next) => accum + (
        (next.expiry > Math.floor(new Date().getUTCMilliseconds() / 1000))
        ? (`${next.name}=${next.value}` + ' ')
        : ''
      ),'') ?? [],
      'user-agent': cloudFlareRes.solution?.userAgent,
    },
    body,
    method: body ? "POST" : "GET"
  })
  console.log(response);
  const responsetext = await response.text();
  console.log(responsetext)
  const resonsejson = JSON.parse(responsetext);
  console.log('StreamList Refetch')
  return resonsejson
}

const getStreams = async () => {
  authtoken = await refreshAuthtoken()
  return await fetchData('http://localhost:3000/api/live-streams')
}

let streams = {};
(async () => streams = await getStreams())()

// Define the `getUrl` route
const manifest = async (req, res) => {
  streams = await getStreams()
  const { videoId, videoPath } = req.params;
  try {
    if (videoPath == 'video.m3u8') {
      const streamUrl = streams[parseInt(videoId)].stream;
      // extract basepath
      const basePath = /(https:\/\/([^\/?]+[\/]){3})/.exec(streamUrl)[1]
      // extract jwt
      const jwt = /jwt=(.+)/.exec(streamUrl)[1]
      res.set('Content-Type', 'application/x-mpegURL')
      const body = await (await fetch(streamUrl)).text();
      // streamcatcher
      const newBody = body.replaceAll(
        /^(?<header>#[^\r\n]+\r?\n)(?<teneighty>(?:(?:#[^\r\n]+\r?\n){1}[^\r\n]+\r?\n?))(?<seventwenty>(?:(?:#[^\r\n]+\r?\n){1}[^\r\n]+\r?\n?))(?<sixfourty>(?:(?:#[^\r\n]+\r?\n){1}[^\r\n]+\r?\n?))/g,
        '$1$3$3$3$3$3$3$3$3$3'
      ).replaceAll(/\n([0-9]_.+)\r/g, '\n' + basePath + `$1&jwt=${jwt}\r`)
      res.send(newBody);
      /*
     const videoSrc = `#EXTM3U\r
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=425472,RESOLUTION=1920x1080,FRAME-RATE=30,CODECS="avc1.4d4028,mp4a.40.2"\r
${streamUrl}\r
`
      res.send(videoSrc);
/api/manifest/${videoId}/stream_t1_r720001.m3u8\r
`
      res.send(videoSrc);
      */
    } else {
      streams = (!streams.expiry || (streams.expiry - 60) < (new Date().getTime() / 1000)) ? await getStreams() : streams
      res.set('Content-Type', 'application/x-mpegURL')
      const body = await (await fetch(`https://customer-jwh6wms36w6479b4.cloudflarestream.com/${streams.liveStreams[parseInt(videoId)].url}/manifest/${videoPath}`)).text()
      res.send(body.replace(/[.][.][/][.][.][/]/g, '/api/parts/'));
    }
  } catch (e) {
    console.log(e)
    res.send(null);
  }
};

app.get('/api/manifest/:videoId/:videoPath', manifest)
app.get('/api/parts/:streamId/:streamType/:quality/:segment', segment)
app.get('/api/token', tokenResolver)
app.use(express.static('public'));

module.exports = app