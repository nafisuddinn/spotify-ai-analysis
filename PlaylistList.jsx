import { useState, useEffect } from "react";


function PlaylistList({ setSelectedPlaylist, accessToken }) {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (accessToken) {
      fetch(`http://127.0.0.1:8000/get-playlists?access_token=${accessToken}`)
        .then((res) => res.json())
        .then((data) => setPlaylists(data.items || []));
    }
  }, [accessToken]);

  return (
    <div>
      <h2>Your Playlists</h2>
      {playlists.length > 0 ? (
        <ul>
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <h3>{playlist.name}</h3>
              <button onClick={() => setSelectedPlaylist(playlist)}>Select</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No playlists found</p>
      )}
    </div>
  );

  
}




export default PlaylistList;
