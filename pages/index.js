import { useState } from "react";
import Head from "next/head";
import Image from "next/image";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const Home = () => {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [translatedPrompt, setTranslatedPrompt] = useState("");

  // ... (other functions remain unchanged)

  const handleDownload = async () => {
    if (prediction && prediction.output && prediction.output.length > 0) {
      try {
        const response = await fetch(prediction.output[prediction.output.length - 1]);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank"; // Open in a new tab/window

        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading image:", error);
      }
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-5">
      <Head>
        <title>Infinty AI - AI Image Generator Pro</title>
        {/* Add the meta tag for Monetag */}
        <meta name="monetag" content="2d00d13657a9551eb78c7c941596d1de" />
        <script async="async" data-cfasync="false" src="//thubanoa.com/1?z=6978755"></script>
      </Head>
      <h1 className="py-6 text-center font-bold text-2xl">
        Dream something with{" "}
        <a href="https://infinityai.online">
          Infinity AI
        </a>
      </h1>

      <form className="w-full flex" onSubmit={handleSubmit}>
        <input
          type="text"
          className="flex-grow"
          name="prompt"
          placeholder="Enter a prompt in Myanmar or English"
        />
        <button className="button" type="submit">
          Go!
        </button>
      </form>

      {error && <div>{error}</div>}

      {/* Display translated prompt */}
      {translatedPrompt && (
        <p className="py-3 text-sm opacity-50">Translated prompt: {translatedPrompt}</p>
      )}

      {/* Render image and download button conditionally */}
      {prediction && prediction.output && (
        <>
          <div className="image-wrapper mt-5">
            <Image
              fill
              src={prediction.output[prediction.output.length - 1]}
              alt="output"
              sizes="100vw"
            />
          </div>
          <p className="py-3 text-sm opacity-50">status: {prediction.status}</p>

          {/* Conditionally render the download button */}
          {prediction.output.length > 0 && (
            <button className="button mt-3" onClick={handleDownload}>
              Download Image
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
