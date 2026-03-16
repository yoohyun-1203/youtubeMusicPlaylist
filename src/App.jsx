import { useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import './App.css'

// ✅ 초보자용 설명
// - 이 앱은 "페이지 2개"로 구성돼요.
//   1) "/" : 링크 입력만 하는 아주 심플한 페이지
//   2) "/play?list=..." : 노래(플레이리스트)를 트는 페이지
//
// - playlistId는 URL 쿼리스트링(?list=...)로 전달해요.
//   그래서 새로고침해도 같은 플레이리스트가 유지됩니다.

function extractPlaylistIdFromUrl(text) {
  // 사용자가 공백을 섞어서 붙여넣는 경우가 많아, 앞뒤 공백을 제거합니다.
  const trimmedText = (text ?? '').trim()
  if (!trimmedText) return ''

  // 1) "PLxxxx" 같은 ID만 붙여넣는 경우도 지원
  //    - YouTube playlist id는 보통 PL, OL, RD, UU 등으로 시작할 수 있어요.
  //    - 너무 빡빡한 검증은 오히려 정상 케이스를 막을 수 있어, 최소한의 형태만 확인합니다.
  const looksLikeId = /^[A-Za-z0-9_-]{10,}$/.test(trimmedText)
  if (looksLikeId && !trimmedText.includes('/') && !trimmedText.includes('?') && !trimmedText.includes('=')) {
    return trimmedText
  }

  // 2) 일반적인 URL 케이스: https://music.youtube.com/playlist?list=...
  //    - URL() 파싱이 실패하면, 정규식으로 한 번 더 시도합니다.
  try {
    const parsedUrl = new URL(trimmedText)
    const listParam = parsedUrl.searchParams.get('list')
    return (listParam ?? '').trim()
  } catch {
    const match = trimmedText.match(/[?&]list=([^&]+)/)
    return (match?.[1] ?? '').trim()
  }
}

function buildYoutubeEmbedUrl(playlistIdValue, shouldAutoplay) {
  // 유튜브 공식 임베드: listType=playlist & list=<ID>
  // 참고: 일부 음악/지역/연령 제한 콘텐츠는 임베드에서 재생이 안 될 수 있어요(유튜브 정책).
  const params = new URLSearchParams({
    listType: 'playlist',
    list: playlistIdValue,
    autoplay: shouldAutoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    // playsinline: iOS에서 전체화면 강제 방지에 도움
    playsinline: '1',
  })
  return `https://www.youtube.com/embed?${params.toString()}`
}

function InputPage() {
  const navigate = useNavigate()

  const [playlistUrlInput, setPlaylistUrlInput] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function handleGoPlayerPage() {
    const extractedPlaylistId = extractPlaylistIdFromUrl(playlistUrlInput)
    if (!extractedPlaylistId) {
      setErrorMessage('플레이리스트 URL(또는 list=...)에서 playlistId를 찾지 못했어요. 다시 확인해 주세요.')
      return
    }

    setErrorMessage('')
    navigate(`/play?list=${encodeURIComponent(extractedPlaylistId)}`)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') handleGoPlayerPage()
  }

  return (
    <div className="page pageInputOnly">
      <main className="inputOnlyWrap">
        <div className="inputOnlyBrand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandText">
            <div className="title">Playlist Player</div>
            <div className="subtitle">플레이리스트 링크만 넣으면 바로 재생해요</div>
          </div>
        </div>

        <label className="inputOnlyField">
          <span className="srOnly">플레이리스트 URL</span>
          <input
            className="input inputOnlyInput"
            value={playlistUrlInput}
            onChange={(event) => setPlaylistUrlInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="유튜브(뮤직) 플레이리스트 URL을 붙여넣어 주세요"
            inputMode="url"
            autoFocus
          />
        </label>

        <button className="primaryButton inputOnlyButton" onClick={handleGoPlayerPage}>
          재생 페이지로 이동
        </button>

        {errorMessage ? <div className="error">{errorMessage}</div> : null}

        <div className="inputOnlyHelp">
          예시: <code>https://music.youtube.com/playlist?list=...</code>
        </div>
      </main>
    </div>
  )
}

function PlayerPage() {
  const [searchParams] = useSearchParams()

  // 초보자용: 쿼리스트링에서 list 값을 가져옵니다. 예) /play?list=PLxxxx
  const playlistId = (searchParams.get('list') ?? '').trim()

  const [autoplayEnabled, setAutoplayEnabled] = useState(true)
  const embedUrl = useMemo(() => {
    if (!playlistId) return ''
    return buildYoutubeEmbedUrl(playlistId, autoplayEnabled)
  }, [playlistId, autoplayEnabled])

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandText">
            <div className="title">Playlist Player</div>
            <div className="subtitle">재생 중</div>
          </div>

          <div className="headerRight">
            <Link className="headerBackLink" to="/">
              ← 링크 다시 입력
            </Link>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="card">
          <div className="cardHeader">
            <h1 className="cardTitle">재생 설정</h1>
            <p className="cardDesc">필요하면 자동 재생을 끄고 켤 수 있어요.</p>
          </div>

          <div className="controls">
            <label className="toggle">
              <input
                type="checkbox"
                checked={autoplayEnabled}
                onChange={(event) => setAutoplayEnabled(event.target.checked)}
              />
              <span className="toggleText">자동 재생</span>
            </label>

            {playlistId ? (
              <div className="hint">
                <span className="hintLabel">playlistId</span>
                <code className="hintCode">{playlistId}</code>
              </div>
            ) : (
              <div className="error">URL에 list 값이 없어요. 위의 “링크 다시 입력”으로 돌아가 주세요.</div>
            )}
          </div>
        </section>

        <section className="playerCard">
          <div className="playerHeader">
            <h2 className="playerTitle">플레이어</h2>
            {playlistId ? (
              <a
                className="openLink"
                href={`https://music.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`}
                target="_blank"
                rel="noreferrer"
              >
                유튜브 뮤직에서 열기
              </a>
            ) : null}
          </div>

          <div className="playerFrameWrap">
            {embedUrl ? (
              <iframe
                className="playerFrame"
                src={embedUrl}
                title="YouTube Playlist Player"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="playerEmpty">플레이리스트를 찾을 수 없어요.</div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Playlist Player</span>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/play" element={<PlayerPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
