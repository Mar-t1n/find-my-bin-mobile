# Find My Bin (UI)

The app UI for Find My Bin, styled with a light 70s touch. It has three swipeable pages:

- **Board** (left): a cork board of every photo you've scanned, pinned as polaroids and stamped with the bin they belong in.
- **Scan** (middle, opens here): the camera, plus a photo-library fallback. After each scan, a full-screen animation develops the photo, stamps it with its bin and flies it onto the board.
- **Impact** (right): recycling rate, streaks, weekly activity, milestones, a bin guide and settings.

The scan flow runs the bundled `mira_exp011_int8.tflite` garbage detector on-device.

## Run it

```bash
npm install
npx expo start
```

Then press `i` for the iOS Simulator, or scan the QR code with Expo Go. The simulator has no real camera, so use the photo button next to the shutter.

## The on-device model

Everything goes through one function: `classifyPhoto(uri)` in `src/classifier/classifyPhoto.ts`.

The model accepts a 320 x 320 RGB image and returns 2,100 detections with five
class scores. The classifier resizes the captured image, converts it to the
model's NCHW float32 input, and uses the highest class score to select the result.
Because the TFLite export does not include label metadata, keep
`MODEL_CATEGORY_IDS` in `src/classifier/classifyPhoto.ts` aligned with the
training class order when replacing the model.

`react-native-fast-tflite` needs a development build (`npx expo run:ios`); it won't run in Expo Go.

When someone taps "Not right?" or "Yep", the correction is stored on the scan as `correctedCategory` / `confirmed`. Those labels are there if you want to export them for retraining.

## Where things live

| Path | What |
| --- | --- |
| `src/app/` | Routes: the pager (`index`), the scan detail sheet (`scan/[id]`) and onboarding (`welcome`) |
| `src/screens/` | The three pages |
| `src/components/ScanResultOverlay.tsx` | The post-scan animation and result card |
| `src/components/retro/` | Polaroid, cork, pins, tape, stamp, rainbow, sunburst |
| `src/data/categories.ts` | Materials, bins, colors and disposal tips |
| `src/store/` | Saved scans and settings (AsyncStorage; photos in the documents directory) |
| `src/theme/` | Palette, fonts and shared layout sizes |
