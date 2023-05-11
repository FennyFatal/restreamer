const React = require('react');
import videojs from "video.js";
import "video.js/dist/video-js.css";
const { createRoot } = require('react-dom/client');


const App = () => {
  const queryParameters = new URLSearchParams(window.location.search)
  const videoSelected = (queryParameters.get("ids") ?? '0,1,2,3,10,9,4,5,7,8,6').split(',').filter(x => x != '').map(x => { try { return parseInt(x) } catch { return null }}).filter(x => x != null)
  const videoRef = Array(11).fill(1).map(x => React.useRef());
  const videoIndexes = videoSelected.length ? videoSelected : Object.keys(videoRef).filter(x => x != null);

  React.useEffect(() => {
    (async () => {
      videoIndexes.map( (i) => {
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
            sources: Array(100).fill(source)
          });

          const replay = async (e) => {
            console.log('error', e)
            player.src(Array(100).fill(source))
          }
          player.on('playbackError', replay)
          player.on('error', replay)
          videoRef[i].current.handleError = replay
        }
      })
    })()
    return;
  }, [])
  
  const [hoveredVideo, setHoveredVideo] = React.useState(-1)

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        justifyContent: "start",
        height: '100%',
        alignItems: "auto",
        alignContent: "flex-end",
        overflowY: "hidden"
      }}
    >
      {videoIndexes.map((i) => (
        <div
          key={i}
          style={{
            flex: "0 0 auto",
            margin: "0px",
            width: `calc((100vh / 9) * (16 / ${
              (Math.ceil(videoIndexes.length > 3 ? (i == 6 ? 3 : 4) : videoIndexes.length))
            }) - 10px)`,
          }}
          onMouseEnter={() => setHoveredVideo(i)}
          onMouseLeave={() => setHoveredVideo(-1)}
        >
          <div>
            <div style={{ position: "relative" }}>
              {hoveredVideo === i && (
                <button
                  style={{
                    position: "absolute",
                    right: "6px",
                    top: "6px",
                    zIndex: 1,
                    borderWidth: "3px",
                    margin: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  className="dash-replay-button"
                  onClick={() => videoRef[i]?.current?.handleError()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16px"
                    height="20px"
                    style={{
                      filter: "invert(1)",
                    }}
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
              )}
            </div>
            <div data-vjs-player style={{position: 'relative', top: '0', left: '0'}}>
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
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
