import Header from "./components/Header";
import Footer from "./components/Footer";
import Camera from "./components/Camera";
import "./App.css";

function App() {
  
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <main style={{ flex: 1, padding: "2rem" }}>
        <h2>Welcome to Vision AI</h2>
        <p>This is a basic demo website with camera access.</p>
        <Camera />
      </main>
      <Footer />
    </div>
  );
}

export default App;
