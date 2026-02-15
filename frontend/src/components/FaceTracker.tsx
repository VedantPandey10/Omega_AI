import { useRef, useEffect, useState } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-converter";

interface FaceTrackerProps {
    onCoords: (x: number, y: number) => void;
    onBlink: () => void;
}

export default function FaceTracker({ onCoords, onBlink }: FaceTrackerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
    const [loadingStatus, setLoadingStatus] = useState("Initializing AI...");
    const [error, setError] = useState<string | null>(null);

    const lastBlinkTime = useRef<number>(0);
    const onCoordsRef = useRef(onCoords);
    const onBlinkRef = useRef(onBlink);

    useEffect(() => {
        onCoordsRef.current = onCoords;
        onBlinkRef.current = onBlink;
    }, [onCoords, onBlink]);

    useEffect(() => {
        const init = async () => {
            try {
                setLoadingStatus("Waking up GPU...");
                await tf.setBackend('webgl');
                await tf.ready();

                setLoadingStatus("Downloading Face Mesh...");
                const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
                const detectorConfig = {
                    runtime: 'tfjs' as const,
                    refineLandmarks: true
                };


                const newDetector = await faceLandmarksDetection.createDetector(model, detectorConfig);
                setDetector(newDetector);
                setLoadingStatus("Ready!");
            } catch (e: any) {
                console.error("Init Error:", e);
                setError(`Failed to start AI: ${e.message || "Unknown error"}`);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (!detector) return;

        let animationId: number;
        let stream: MediaStream | null = null;

        const setupCamera = async () => {
            if (!videoRef.current) return;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 },
                    audio: false,
                });
                videoRef.current.srcObject = stream;
                await new Promise((resolve) => {
                    if (!videoRef.current) return;
                    videoRef.current.onloadedmetadata = () => resolve(true);
                });
                videoRef.current.play();
            } catch (e: any) {
                setError(`Camera Error: ${e.message || "Access denied"}`);
            }
        };

        const detect = async () => {
            if (!videoRef.current || !canvasRef.current || !detector) return;
            if (videoRef.current.readyState < 2) {
                animationId = requestAnimationFrame(detect);
                return;
            }

            try {
                const faces = await detector.estimateFaces(videoRef.current, { flipHorizontal: true });
                const ctx = canvasRef.current.getContext("2d");
                if (!ctx) return;

                ctx.save();
                ctx.scale(-1, 1);
                ctx.translate(-canvasRef.current.width, 0);
                ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.restore();

                if (faces.length > 0) {
                    const face = faces[0];
                    // Nose tip is index 4
                    const nose = face.keypoints[4];

                    // Normalize coordinates (0-1)
                    const normX = nose.x / videoRef.current.videoWidth;
                    const normY = nose.y / videoRef.current.videoHeight;

                    // Ergonomic Mapping: 
                    // 1. Shift vertical center down by 0.2
                    // 2. Increase vertical sensitivity by 1.5x to reduce neck movement
                    const ergonomicY = (normY - 0.5) * 1.5 + 0.5 + 0.2;

                    // Constrain to [0, 1] range
                    const finalY = Math.max(0, Math.min(1, ergonomicY));

                    onCoordsRef.current(normX, finalY);

                    // Improved Blink Detection (EAR-like check)
                    const leftUpper = face.keypoints[159];
                    const leftLower = face.keypoints[145];
                    const rightUpper = face.keypoints[386];
                    const rightLower = face.keypoints[374];

                    const leftDist = Math.sqrt(Math.pow(leftUpper.x - leftLower.x, 2) + Math.pow(leftUpper.y - leftLower.y, 2));
                    const rightDist = Math.sqrt(Math.pow(rightUpper.x - rightLower.x, 2) + Math.pow(rightUpper.y - rightLower.y, 2));

                    // If either eye is closed enough (Threshold: 6)
                    if (leftDist < 6 || rightDist < 6) {
                        const now = Date.now();
                        if (now - lastBlinkTime.current > 600) {
                            onBlinkRef.current();
                            lastBlinkTime.current = now;
                        }
                    }



                    ctx.fillStyle = "#ffffff";
                    face.keypoints.forEach((kp, idx) => {
                        if (idx === 4) ctx.fillStyle = "#764ba2"; // Highlight nose
                        else ctx.fillStyle = "#ffffff";

                        ctx.beginPath();
                        const mirroredX = canvasRef.current!.width - kp.x;
                        ctx.arc(mirroredX, kp.y, 1, 0, 2 * Math.PI);
                        ctx.fill();
                    });
                }
            } catch (e) {
                console.error("Frame detection failed", e);
            }
            animationId = requestAnimationFrame(detect);
        };

        setupCamera().then(() => detect());

        return () => {
            cancelAnimationFrame(animationId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [detector]);

    return (
        <div className="face-tracker">
            {!detector && !error && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>{loadingStatus}</p>
                </div>
            )}
            {error ? (
                <div className="error">{error}</div>
            ) : (
                <>
                    <video ref={videoRef} style={{ display: "none" }} width="640" height="480" playsInline muted />
                    <canvas ref={canvasRef} width="640" height="480" />
                </>
            )}
        </div>
    );
}
