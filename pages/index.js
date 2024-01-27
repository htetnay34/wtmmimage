import { useState } from "react";
import Head from "next/head";
import Image from "next/image";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const Home = () => {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [translatedPrompt, setTranslatedPrompt] = useState("");

  const translatePrompt = async (prompt) => {
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${prompt}&langpair=my|en`);
      const data = await response.json();

      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      } else {
        throw new Error("Translation failed or empty response");
      }
    } catch (translationError) {
      console.error("Error translating prompt:", translationError);
      setError("Error translating prompt");
      return "";
    }
  };

  const pollPredictionStatus = async (predictionId) => {
    let prediction = null;

    while (!prediction || (prediction.status !== "succeeded" && prediction.status !== "failed")) {
      await sleep(1000);
      const response = await fetch("/api/predictions/" + predictionId);
      prediction = await response.json();

      if (response.status !== 200) {
        setError(prediction.detail);
        return;
      }

      console.log({ prediction });
      setPrediction(prediction);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous translated prompt, error, and prediction
    setTranslatedPrompt("");
    setError(null);
    setPrediction(null);

    try {
      // Translate the prompt from Myanmar to English using My Memory Translation
      const translated = await translatePrompt(e.target.prompt.value);

      // Ensure the translated prompt is available before making the API call
      if (!translated) {
        setError("Error translating prompt");
        return;
      }

      setTranslatedPrompt(translated);

      // Submit only the translated prompt to the prediction API...
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: translated, // Use the translated prompt
        }),
      });

      // Handle the response from the prediction API
      if (response.status === 201) {
        const predictionData = await response.json();
        setPrediction(predictionData);
        await pollPredictionStatus(predictionData.id);
      } else {
        setError("Error submitting prediction request");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    }
  };

 const handleDownload = async () => {
    // Check if there is an image URL to download
    if (prediction && prediction.output && prediction.output.length > 0) {
      try {
        // Fetch the image data
        const response = await fetch(prediction.output[prediction.output.length - 1]);
        const blob = await response.blob();

        // Create a link element
        const link = document.createElement("a");
        // Create a Blob URL for the image data
        const url = window.URL.createObjectURL(blob);
        
        // Set the href attribute to the Blob URL
        link.href = url;
        // Set the download attribute to specify the file name
        link.download = "generated_image.png";
        // Append the link to the document body
        document.body.appendChild(link);
        // Trigger a click event on the link to start the download
        link.click();
        // Remove the link from the document body
        document.body.removeChild(link);

        // Revoke the Blob URL to free up resources
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

      {/* The rest of your code for displaying predictions and images... */}
      {prediction && (
        <>
          {prediction.output && (
            <div className="image-wrapper mt-5">
              <Image
                fill
                src={prediction.output[prediction.output.length - 1]}
                alt="output"
                sizes="100vw"
              />
            </div>
          )}
          <p className="py-3 text-sm opacity-50">status: {prediction.status}</p>

          {/* Download button */}
          <button className="button mt-3" onClick={handleDownload}>
            Download Image
          </button>
        </>
      )}
    </div>
  );
};

export default Home;

