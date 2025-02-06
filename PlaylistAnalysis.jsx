import React from "react";
//for some reason, without this separated, the ai didnt work
function PlaylistAnalysis({ analysis }) {
  return (
    <div className="analysis-container"> 
      <h2>AI Analysis 🤖</h2> 
      {analysis ? <p3>{analysis}</p3> : <p>No analysis available.</p>}
    </div>
  );
}

export default PlaylistAnalysis;
