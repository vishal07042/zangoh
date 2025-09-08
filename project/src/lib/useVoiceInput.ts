import { useState, useEffect, useRef } from "react";

interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
	resultIndex: number;
}

interface SpeechRecognitionResult {
	[index: number]: SpeechRecognitionAlternative;
	length: number;
}

interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}

interface SpeechRecognitionResultList {
	[index: number]: SpeechRecognitionResult;
	length: number;
}

interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start(): void;
	stop(): void;
	abort(): void;
	addEventListener(
		type: "result",
		listener: (event: SpeechRecognitionEvent) => void
	): void;
	addEventListener(
		type: "start" | "end" | "error",
		listener: (event: Event) => void
	): void;
}

interface SpeechRecognitionStatic {
	new (): SpeechRecognition;
}

declare global {
	interface Window {
		SpeechRecognition: SpeechRecognitionStatic;
		webkitSpeechRecognition: SpeechRecognitionStatic;
	}
}

interface UseVoiceInputOptions {
	onResult: (transcript: string) => void;
	onError?: (error: string) => void;
	continuous?: boolean;
	interimResults?: boolean;
	lang?: string;
}

export const useVoiceInput = ({
	onResult,
	onError,
	continuous = false,
	interimResults = true,
	lang = "en-US",
}: UseVoiceInputOptions) => {
	const [isListening, setIsListening] = useState(false);
	const [isSupported, setIsSupported] = useState(false);
	const [transcript, setTranscript] = useState("");
	const recognitionRef = useRef<SpeechRecognition | null>(null);

	useEffect(() => {
		// Check for browser support
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (SpeechRecognition) {
			setIsSupported(true);
			recognitionRef.current = new SpeechRecognition();

			const recognition = recognitionRef.current;
			recognition.continuous = continuous;
			recognition.interimResults = interimResults;
			recognition.lang = lang;

			recognition.addEventListener(
				"result",
				(event: SpeechRecognitionEvent) => {
					let finalTranscript = "";
					let interimTranscript = "";

					for (
						let i = event.resultIndex;
						i < event.results.length;
						i++
					) {
						const result = event.results[i];
						if (result[0]) {
							if (result.isFinal) {
								finalTranscript += result[0].transcript;
							} else {
								interimTranscript += result[0].transcript;
							}
						}
					}

					const currentTranscript =
						finalTranscript || interimTranscript;
					setTranscript(currentTranscript);

					if (finalTranscript) {
						onResult(finalTranscript.trim());
						setTranscript(""); // Clear after final result
					}
				}
			);

			recognition.addEventListener("start", () => {
				setIsListening(true);
			});

			recognition.addEventListener("end", () => {
				setIsListening(false);
			});

			recognition.addEventListener("error", (event: any) => {
				console.error("Speech recognition error:", event.error);
				setIsListening(false);
				if (onError) {
					onError(event.error);
				}
			});
		} else {
			setIsSupported(false);
			if (onError) {
				onError("Speech recognition not supported in this browser");
			}
		}

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.abort();
			}
		};
	}, [onResult, onError, continuous, interimResults, lang]);

	const startListening = () => {
		if (recognitionRef.current && !isListening) {
			try {
				recognitionRef.current.start();
			} catch (error) {
				console.error("Error starting speech recognition:", error);
				if (onError) {
					onError("Failed to start speech recognition");
				}
			}
		}
	};

	const stopListening = () => {
		if (recognitionRef.current && isListening) {
			recognitionRef.current.stop();
		}
	};

	const abortListening = () => {
		if (recognitionRef.current) {
			recognitionRef.current.abort();
			setIsListening(false);
		}
	};

	return {
		isListening,
		isSupported,
		transcript,
		startListening,
		stopListening,
		abortListening,
	};
};
