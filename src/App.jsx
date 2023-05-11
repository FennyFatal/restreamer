import React, { useRef, useState, useLayoutEffect } from "react";
import videojs from "video.js";
import { createRoot } from 'react-dom/client';
import useWebsocket from 'react-use-websocket'
import useStayScrolled from 'react-stay-scrolled';
import "video.js/dist/video-js.css";
import "./style.css"
import "@fontsource/jetbrains-mono";

const App = () => {
  const queryParameters = new URLSearchParams(window.location.search)
  const videoSelected = (queryParameters.get("ids") ?? '0,1,2,3,10,9,4,5,7,8,6,chat').split(',').filter(x => x != '').map(x => {
    const val = parseInt(x)
    return !Number.isNaN(val) ? val: x 
  }).filter(x => x != null)
  const videoRef = Array(11).fill(1).map(x => React.useRef());
  const [token, setToken] = useState();
  const videoIndexes = videoSelected.length ? videoSelected : Object.keys(videoRef).filter(x => x != null);
  console.log(videoIndexes)
  const {
    lastMessage,
  } = useWebsocket(token)
  const messageListRef = useRef([])
  const listRef = useRef()
  let stayScrolled;
  if (videoIndexes.includes('chat'))
    stayScrolled = useStayScrolled(listRef).stayScrolled

  React.useEffect(() => {
    if (!lastMessage) return;
    try {
    const data = JSON.parse(lastMessage.data)
    if (data.command != 'message') return;
    if (messageListRef.current.length > 100)
      messageListRef.current.shift()
    messageListRef.current.push(data)
    console.log(data)
    try {
      stayScrolled();
    } catch {}
    } catch {}
  }, [lastMessage])

  React.useEffect(() => {
    (async () => {
      videoIndexes.filter(x => x != undefined && x != 'chat').map( (i) => {
        const videoNode = videoRef[i].current;

        const source = {
          src: `/api/manifest/${i}/video.m3u8`,
          type: "application/x-mpegURL"
        }

        if (videoNode) {
          const player = videojs(videoNode, {
            fill: true,
            fluid: true,
            autoplay: true,
            controls: true,
            preload: "metadata",
            sources: [source]
          });

          const replay = async (e) => {
            console.log('error', e)
            player.src([source])
          }
          player.on('playbackError', replay)
          player.on('error', replay)
          videoRef[i].current.handleError = replay
        }
      })
      setToken(`wss://prod.chat.fishtank.live/?authToken=${await fetch('/api/token').then(x => x.text())}`)
    })()
  }, [])
  
  const [hoveredVideo, setHoveredVideo] = React.useState(-1)

  const renderRefreshButton = (i) => (
    <button
      className="refresh-button dash-replay-button"
      onClick={() => videoRef[i]?.current?.handleError()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16px"
        height="20px"
        className="refresh-icon"
        viewBox="0 0 16 20"
      >
        <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
          <g fill="#000" transform="translate(-2 -127)">
            <g transform="translate(2 127)">
              <path d="M8 4V0L3 5l5 5V6c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H0c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8z"></path>
            </g>
          </g>
        </g>
      </svg>
    </button>
  );

  const aspectRatio = window.innerWidth / window.innerHeight;
  const isWide = aspectRatio >= 16 / 9;

  const calculateFactor = (total) => {
    if ( total <= 2 ) return 1;
    if ( total <= 4 ) return 2;
    return 3;
  };

  const total = videoIndexes.length

  const factor = calculateFactor(total);

  const renderChat = (total) => {
    const heightValue = isWide ? `calc(100vh / ${factor})` : `calc(100vh - (100vw * (9 / 16)))`;
    const widthValue = isWide
      ? `calc((((100vh / 9) * 16) - ((100vh / 9) * 8) - ((100vh / 9) * (16 / 3))) * ${3 / factor} )`
      : `100vw`;
  
    return (
      <div
        ref={listRef}
        className="chat-container"
        style={{
          width: widthValue,
          height: heightValue,
        }}
      >
        {messageListRef.current.map((x) => (
          <p className="chat-message">
            <span style={{ color: x?.payload?.user?.customUsernameColor ?? 'white' }}>
              {x?.payload?.user?.displayName ?? 'UNKNOWN USER'}
            </span>
            : {`${x?.payload?.message}`}
          </p>
        ))}
      </div>
    );
  };
  
  const renderVideo = (i) => {
    const heightValue = isWide ? `calc(100vh / ${factor})` : `calc((100vw / ${factor}) * (9 / 16))`;
    const widthValue = isWide
      ? `calc((100vh / ${factor * ((i === 6 ? 3 : 4) / 3)}) * (16 / 9))`
      : `calc((100vw / ${factor * ((i === 6 ? 3 : 4) / 3)})`;
  
    return (
      <div
        key={i}
        className="video-container"
        onMouseEnter={() => setHoveredVideo(i)}
        onMouseLeave={() => setHoveredVideo(-1)}
        style={{
          width: widthValue,
          height: heightValue,
        }}
      >
        <div>
          <div style={{ position: 'relative' }}>{hoveredVideo === i && renderRefreshButton(i)}</div>
          <div data-vjs-player className="video-player">
            <video
              onError={() => videoRef[i]?.current?.handleError()}
              muted={true}
              controls={true}
              ref={videoRef[i]}
              className="video-js"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: isWide ? 'calc(((16/9) * 100vh))' : '100vw',
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        justifyContent: "start",
        height: '100%',
        alignItems: "auto",
        alignContent: "flex-end",
        overflowY: "hidden",
        margin: "-10px",
      }}
    >
      {videoIndexes.map((i) => (i == 'chat' ? renderChat(videoIndexes.length) : renderVideo(i)))}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
