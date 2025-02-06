import React, { useState, useEffect } from "react";
import PlaylistList from "./components/PlaylistList";
import PlaylistAnalysis from "./components/PlaylistAnalysis";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(""); // store AI analysis

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      fetchAccessToken(code);
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);// make sure we map to the correct local host
      const response = await fetch("http://127.0.0.1:8000/login");
      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessToken = async (code) => {
    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/callback?code=${code}`);
      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        fetchUserProfile(data.access_token);
        fetchPlaylists(data.access_token);
      } else {
        setError("Authentication failed.");
      }
    } catch (err) {
      setError("Error fetching access token.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (accessToken) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      setUser(data);
    } catch {
      setError("Failed to fetch user profile.");
    }
  };

  const fetchPlaylists = async (accessToken) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await response.json();
      if (data.items) {
        setPlaylists(data.items);
        setError(null);
      } else {
        setError("No playlists found.");
      }
    } catch {
      setError("Failed to fetch playlists.");
    }
  };

  const analyzePlaylist = async () => {
    if (!selectedPlaylist) {
      setError("Please select a playlist first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAnalysis("");

      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setError("No access token found. Please log in again.");
        return;
      }

      const response = await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylist.id}/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch playlist tracks.");
      }

      const playlistData = await response.json();
      const tracks = playlistData.items
        .filter((item) => item.track)
        .map((item) => ({
          name: item.track.name,
          artist: item.track.artists[0].name,
          uri: item.track.uri,
        }));

      console.log("Sending tracks for AI analysis:", tracks);

      const aiResponse = await fetch("http://127.0.0.1:8000/analyze-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tracks),
      });

      if (!aiResponse.ok) {
        throw new Error("Failed to analyze playlist.");
      }

      const data = await aiResponse.json();
      setAnalysis(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };




  return (
    <div>
      <h1>Spotify AI App</h1>
      {user ? <p>Welcome, {user.display_name}!</p> : <button2 onClick={handleLogin}>Login with Spotify</button2>}

      <h2>Your Playlists</h2>
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      <h3>Select Playlist and Analyze Down ⬇️ Below!</h3>

      {playlists.length > 0 ? (
        <ul className="playlist-grid">
        {playlists.map((playlist) => (
          <li key={playlist.id} className="playlist-item" onClick={() => setSelectedPlaylist(playlist)}>
            <img src={playlist.images[0]?.url} alt={playlist.name} className="playlist-cover" />
            <h3>{playlist.name}</h3>
          </li>
        ))}
      </ul>
      
      ) : (
        <p>No playlists found</p>
      )}

      {selectedPlaylist && (
        <>
          <h2>Selected Playlist: {selectedPlaylist.name}</h2>
          <button onClick={analyzePlaylist}>Analyze Playlist</button>
        </>
      )}

     <PlaylistAnalysis analysis={analysis} />

   </div> 
  

  );
}

export default App;
