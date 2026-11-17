import { create } from "zustand";

type RecordingState = {
  isRecording: boolean;
  setRecording: (val: boolean) => void;
};

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  setRecording: (val) => set({ isRecording: val }),
}));
