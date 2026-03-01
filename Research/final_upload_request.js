var request = fetch("https://www.starmakerstudios.com/songbook/datas", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
    "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryY8K30eZH4yMr4WIE",
    "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie": "h5_device=cd7b26f9-d7b7-4ce3-bdb5-d6d3e5e6abad; h5_uuid=42c8e837-323c-4137-94c4-c5e3bfbf7b53; g_state={\"i_l\":0,\"i_ll\":1772280748647,\"i_b\":\"oDaBDdAkjwM/haGcR/D/l5yXQxWCmHuLiD2p5TcH6+s\",\"i_e\":{\"enable_itp_optimization\":0}}; oauth_token=aBsQ2wQKwZFpFYjN9X3wSexHFp9yug86; user_id=10696049130629862; _gcl_au=1.1.1171215922.1772280784; _ga_Y5QLWEHNZ4=GS2.1.s1772280784$o1$g0$t1772280784$j60$l0$h0; _ga=GA1.1.984622795.1772280784; PHPSESSID=rgno9ec2ovf6qgctaqqgbbud2q",
    "Referer": "https://www.starmakerstudios.com/tune/upload"
  },
  "body": "------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"cover_img\"\r\n\r\nhttp://starmaker-sg-1256122840.cos.ap-singapore.myqcloud.com/production%2Fuser_shared_resources%2Fuploading%2F10696049130629862%2Fsong_cover.32773332a6cdf36dbea226c6213a3c58.jpg\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"instrumental_path\"\r\n\r\nhttp://starmaker-sg-1256122840.cos.ap-singapore.myqcloud.com/production%2Fuser_shared_resources%2Fuploading%2F10696049130629862%2Finstrumental.ec7c64605cd6d773b9e0e242453a2aca.mp3\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"project_file\"\r\n\r\n\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"artist_name\"\r\n\r\nReWar\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"song_name\"\r\n\r\nSulfa - Pyro -ReWar\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"album_name\"\r\n\r\n\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"tags\"\r\n\r\nReWar,ReWaR\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\nen\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"email\"\r\n\r\n\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"media_path\"\r\n\r\n\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE\r\nContent-Disposition: form-data; name=\"lyric_path\"\r\n\r\nhttp://starmaker-sg-1256122840.cos.ap-singapore.myqcloud.com/production%2Fuser_shared_resources%2Fuploading%2F10696049130629862%2Flyric.beac269006647a481a5e74f6f83e9704.lrc\r\n------WebKitFormBoundaryY8K30eZH4yMr4WIE--\r\n",
  "method": "POST"
});

var response = {"code":0,"msg":"Upload success","data":null}