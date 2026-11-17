import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useRecordingStore } from "./recordingState";

let recording: Audio.Recording | null = null;

export const startRecordingGlobal = async () => {
  const { setRecording } = useRecordingStore.getState();

  if (recording) return;

  await Audio.requestPermissionsAsync();

  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );

  recording = rec;
  setRecording(true); // 🔥 ADD THIS
};

export const stopRecordingGlobal = async () => {
  const { setRecording } = useRecordingStore.getState();

  if (!recording) return null;

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();

  const newPath = FileSystem.documentDirectory + `recording-${Date.now()}.m4a`;

  await FileSystem.copyAsync({
    from: uri!,
    to: newPath,
  });

  recording = null;
  setRecording(false); // 🔥 ADD THIS

  return newPath;
};
