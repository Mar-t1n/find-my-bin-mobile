import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_PHOTO_WIDTH = 1080;

function scansDirectory() {
  return new Directory(Paths.document, 'scans');
}

// Shrinks a captured photo and moves it out of the cache into permanent
// storage. Returns the file name only: the documents path changes between
// installs on iOS, so absolute URIs must never be persisted.
export async function persistPhoto(sourceUri: string, id: string, sourceWidth?: number): Promise<string> {
  const directory = scansDirectory();
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }

  const context = ImageManipulator.manipulate(sourceUri);
  if (!sourceWidth || sourceWidth > MAX_PHOTO_WIDTH) {
    context.resize({ width: MAX_PHOTO_WIDTH });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });

  const fileName = `${id}.jpg`;
  await new File(saved.uri).move(new File(directory, fileName));
  return fileName;
}

export function photoUri(fileName: string): string {
  return new File(scansDirectory(), fileName).uri;
}

export function deletePhoto(fileName: string) {
  try {
    const file = new File(scansDirectory(), fileName);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Could not delete photo', fileName, error);
  }
}

// Removes photos that no saved scan points to, e.g. when the app was closed
// right after a delete or mid-scan.
export function deleteOrphanedPhotos(keep: Set<string>) {
  try {
    const directory = scansDirectory();
    if (!directory.exists) return;
    for (const entry of directory.list()) {
      if (entry instanceof File && !keep.has(entry.name)) entry.delete();
    }
  } catch (error) {
    console.warn('Could not clean up photos', error);
  }
}
