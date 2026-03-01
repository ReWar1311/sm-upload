# StarMaker Upload Proxy

Automates the StarMaker song upload pipeline via two REST endpoints.

## Setup

```bash
npm install
npm start
```

Server starts on `http://localhost:3000` (override with `PORT` env var).

---

## Endpoints

### 1. `POST /api/login`

Proxy login to StarMaker. Returns `oauth_token` and `user_id` needed for uploads.

**Body** (JSON):
| Field      | Type   | Required | Description              |
|------------|--------|----------|--------------------------|
| `email`    | string | Yes      | StarMaker account email  |
| `password` | string | Yes      | StarMaker account password |

**Example:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPass123"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "10696049130629862",
    "oauth_token": "boNEi7Gxc72wSGLfosuNcrjEQorx2TQB",
    "stage_name": "ReWaR",
    "profile_image": "https://..."
  }
}
```

---

### 2. `POST /api/upload`

Full upload pipeline: Track → Thumbnail → Lyrics → Final Submit.

**Body** (multipart/form-data):
| Field         | Type   | Required | Description                          |
|---------------|--------|----------|--------------------------------------|
| `track`       | file   | Yes      | MP3 instrumental file                |
| `thumbnail`   | file   | Yes      | JPG/PNG cover image                  |
| `lyrics`      | file   | No       | LRC lyrics file                      |
| `oauth_token` | string | Yes      | From login response                  |
| `user_id`     | string | Yes      | From login response                  |
| `artist_name` | string | Yes      | Artist / display name                |
| `song_name`   | string | Yes      | Song title                           |
| `album_name`  | string | No       | Album name                           |
| `tags`        | string | No       | Comma-separated tags                 |
| `language`    | string | No       | Language code (default `en`)         |
| `email`       | string | No       | Contact email                        |

**Example:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "track=@song.mp3" \
  -F "thumbnail=@cover.jpg" \
  -F "lyrics=@lyrics.lrc" \
  -F "oauth_token=boNEi7Gxc72wSGLfosuNcrjEQorx2TQB" \
  -F "user_id=10696049130629862" \
  -F "artist_name=ReWar" \
  -F "song_name=My Song" \
  -F "tags=tag1,tag2"
```

**Response:**
```json
{
  "success": true,
  "message": "Song uploaded successfully!",
  "data": {
    "instrumental_url": "http://starmaker-sg-..../instrumental.xxx.mp3",
    "cover_img_url": "http://starmaker-sg-..../song_cover.xxx.jpg",
    "lyric_url": "http://starmaker-sg-..../lyric.xxx.lrc",
    "starmaker_response": { "code": 0, "msg": "Upload success", "data": null }
  }
}
```

---

## Error Handling

All errors return JSON with `success: false` and an `error` message. Upload pipeline errors also include a `step` field indicating which stage failed (`upload_track`, `upload_thumbnail`, `upload_lyrics`, or `final_upload`).
