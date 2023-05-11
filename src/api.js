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
  const responsetext = await response.text();
  const resonsejson = JSON.parse(responsetext);
  console.log('StreamList Refetch')
  return resonsejson
}

const getStreams = async () => {
  authtoken = await refreshAuthtoken()
  return await fetchData('https://www.fishtank.live/api/live-streams')
}

let streams = {};
(async () => streams = await getStreams())()

// Define the `getUrl` route
const manifest = async (req, res) => {
  const { videoId, videoPath } = req.params;
  try {
    if (videoPath == 'video.m3u8') {
     const videoSrc = `#EXTM3U\r
#EXT-X-VERSION:6\r
#EXT-X-INDEPENDENT-SEGMENTS\r
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="group_audio",NAME="original",LANGUAGE="en-20",DEFAULT=YES,AUTOSELECT=YES,URI="/api/manifest/${videoId}/stream_t2_r999999999.m3u8"\r
#EXT-X-STREAM-INF:RESOLUTION=960x720,CODECS="avc1.64001f,mp4a.40.2",BANDWIDTH=569977,AVERAGE-BANDWIDTH=552067,SCORE=4.0,FRAME-RATE=30.000,AUDIO="group_audio"\r
/api/manifest/${videoId}/stream_t1_r720001.m3u8\r
`
      res.send(videoSrc);
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