import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;

  const MODEL_URL = '/models';

  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
  } catch (error) {
    console.error('Error loading models:', error);
    throw new Error('Failed to load face detection models. Please refresh the page.');
  }
}

export async function detectSingleFace(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
  if (!input) {
    throw new Error('Invalid input for face detection');
  }

  if (input instanceof HTMLVideoElement) {
    if (input.videoWidth === 0 || input.videoHeight === 0) {
      throw new Error('Video is not ready. Please wait for the camera to load.');
    }
  }

  try {
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection;
  } catch (error) {
    console.error('Face detection error:', error);
    throw new Error('Failed to detect face. Please ensure your face is clearly visible.');
  }
}

export function calculateDistance(descriptor1: Float32Array, descriptor2: number[]): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

export function areDescriptorsSimilar(descriptor1: Float32Array, descriptor2: number[], threshold = 0.6): boolean {
  const distance = calculateDistance(descriptor1, descriptor2);
  return distance < threshold;
}
