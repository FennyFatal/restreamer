const express = require('express');
let authtoken

const refreshAuthtoken = async () => {
  const { refreshToken } = await (await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBOOpV21k6o3cJc56-4uRNb0jDMzIxShMY", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
    },
    "referrerPolicy": "no-referrer",
    "body": `{\"returnSecureToken\":true,\"email\":\"${process.env.email}\",\"password\":\"${process.env.password}\"}`,
    "method": "POST"
  })).json();
  let { access_token } = await (await fetch("https://securetoken.googleapis.com/v1/token?key=AIzaSyBOOpV21k6o3cJc56-4uRNb0jDMzIxShMY", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded",
    },
    "body": `grant_type=refresh_token&refresh_token=${refreshToken}`,
    "method": "POST"
  })).json();
  authtoken = access_token
  console.log(authtoken)
}

let cloudFlareRes = {}

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
  await refreshAuthtoken()
  return await fetchData('https://www.fishtank.live/api/live-streams')
}

let streams = {};
(async () => streams = await getStreams())()

// Define the `getUrl` route
manifest = async (req, res) => {
  console.log(streams.expiry, new Date().getTime() / 1000)
  streams = (!streams.expiry || (streams.expiry - 60) < (new Date().getTime() / 1000)) ? await getStreams() : streams

  const { videoId, videoPath } = req.params;
  // Implement your logic here to generate the video source URL based on the video ID
  // For example:
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
      res.set('Content-Type', 'application/x-mpegURL')
      const body = await (await fetch(`https://customer-jwh6wms36w6479b4.cloudflarestream.com/${streams.liveStreams[parseInt(videoId)].url}/manifest/${videoPath}`)).text()
      res.send(body.replace(/[.][.][/][.][.][/]/g, 'https://customer-jwh6wms36w6479b4.cloudflarestream.com/'));
    }
  } catch (e) {
    console.log(e)
    res.send(null);
  }
};

const app = express();

app.get('/api/manifest/:videoId/:videoPath', manifest)

// Serve the client-side assets
app.use(express.static('public'));

module.exports = app