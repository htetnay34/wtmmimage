import { useState } from "react";
import Head from "next/head";
import Image from "next/image";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [translatedPrompt, setTranslatedPrompt] = useState("");

  const translatePrompt = async (prompt) => {
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${prompt}&langpair=my|en`);
      const data = await response.json();

      if (data.responseData && data.responseData.translatedText) {
        setTranslatedPrompt(data.responseData.translatedText);
        setError(null); // Reset translation error on success
      } else {
        throw new Error("Translation failed or empty response");
      }
    } catch (translationError) {
      console.error("Error translating prompt:", translationError);
      setTranslatedPrompt(""); // Clear translated prompt on error
      setError("Error translating prompt");
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
      await translatePrompt(e.target.prompt.value);

      // Ensure the translated prompt is available before making the API call
      if (!translatedPrompt) {
        setError("Error translating prompt");
        return;
      }

      // Submit only the translated prompt to the prediction API...
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: translatedPrompt, // Use the translated prompt
        }),
      });

      // Handle the response from the prediction API
      if (response.status === 201) {
        let prediction = await response.json();
        setPrediction(prediction);

        // Poll for prediction status
        while (
          prediction.status !== "succeeded" &&
          prediction.status !== "failed"
        ) {
          await sleep(1000);
          const statusResponse = await fetch("/api/predictions/" + prediction.id);
          const updatedPrediction = await statusResponse.json();
          if (statusResponse.status !== 200) {
            setError(updatedPrediction.detail);
            return;
          }

          console.log({ updatedPrediction });
          setPrediction(updatedPrediction);
        }
      } else {
        setError("Error submitting prediction request");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-5">
      <Head>
        <title>Replicate + Next.js</title>
      </Head>

      <h1 className="py-6 text-center font-bold text-2xl">
        Dream something with{" "}
        <a href="https://replicate.com/stability-ai/sdxl?utm_source=project&utm_project=getting-started">
          SDXL
        </a>
      </h1>

      <form className="w-full flex" onSubmit={handleSubmit}>
        <input
          type="text"
          className="flex-grow"
          name="prompt"
          placeholder="Enter a prompt in Myanmar"
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
        </>
      )}
    </div>
  );
}
