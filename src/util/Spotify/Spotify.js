const clientId = '8d6d550995f5481292effe10f99ffa3b';
const redirectURI = 'http://localhost:3000/';
let accessToken;

export const Spotify = {
  getAccessToken(){
    if (accessToken) {
      return accessToken;
    } else {
      const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
      const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
      if (accessTokenMatch && expiresInMatch) {
        accessToken = accessTokenMatch[1];
        const expiresIn = Number(expiresInMatch[1]);
        window.setTimeout(() => accessToken = '', expiresIn * 1000);
        window.history.pushState('Access Token', null, '/');
        return accessToken;
      } else {
        const accessUrl = 'https://accounts.spotify.com/authorize?client_id=' + clientId + '&response_type=token&scope=playlist-modify-public&redirect_uri=' + redirectURI;
        window.location = accessUrl;
      }
    }
  },

  searchResults(term) {
    const accessToken = Spotify.getAccessToken();
    return fetch('https://api.spotify.com/v1/search?type=track&q=' + term, {
      headers : {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(response => response.json())
    .then(jsonResponse => {
      if (jsonResponse.tracks) {
        return jsonResponse.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri
        }));
      } else {
        return [];
      }
    });
  },

  savePlaylist(playlistName, trackURIs) {
    const accessToken = Spotify.getAccessToken();
    const headers = {
      'Authorization': 'Bearer ' + accessToken
    };
    const createPlaylistSettings = {
      method: 'POST',
      headers: headers,
      'Content-type': 'application/json',
      body: JSON.stringify({name: playlistName})
    };
    const addTracksSettings = {
      method: 'POST',
      headers: headers,
      'Content-type': 'application/json',
      body: JSON.stringify({uris: trackURIs})
    };

    if (playlistName && trackURIs) {
      // GET function to retrieve the user id
      fetch(
        'https://api.spotify.com/v1/me',
        {headers: headers}
      )
      .then(response => response.json())
      .then(jsonResponse => {
        const userId = jsonResponse.id;

        // POST function to post the name of the playlist and get the playlist id
        return fetch(
          'https://api.spotify.com/v1/users/' + userId + '/playlists',
          createPlaylistSettings
        )
        .then(response => response.json())
        .then(jsonResponse => {
          const playlistId = jsonResponse.id

          // POST function to post the list of track URIs
          return fetch(
            'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks',
            addTracksSettings
          )
          .then(response => response.json());
        });
      });
    }
  }
};
