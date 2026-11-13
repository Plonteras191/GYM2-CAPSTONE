<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Stores and deletes member photos.
 *
 * Profile pictures live under public/profiles (shown in the dashboard).
 * Face enrollment photos are biometric data, so they live under
 * storage/app/private/faces, which the web server does not serve; only the
 * Python engine on the same machine reads them. Faces saved before this
 * change may still be in public/faces until "php artisan faces:secure" moves
 * them, so reads and deletes check both places.
 *
 * Paths saved in the database are only ever generated here, and deletes are
 * refused for anything that does not resolve to a file directly inside one
 * of those folders, so a crafted path such as "/../.env" can never be
 * removed.
 */
class MemberMediaStorage
{
    public const FACES_DIR = 'faces';
    public const PROFILES_DIR = 'profiles';

    /** Matches the data URIs the React camera enrolment sends. */
    public const FACE_DATA_URI_REGEX = '/^data:image\/(png|jpeg|webp);base64,/';

    private const MAX_FACE_BYTES = 10 * 1024 * 1024;

    private const IMAGE_EXTENSIONS = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/bmp' => 'bmp',
    ];

    /** Decode a base64 image data URI, verify it is a real image, and save it. */
    public function storeFace(string $dataUri): string
    {
        $invalid = fn () => ValidationException::withMessages([
            'enrolled_face_id' => ['The face enrollment must be a PNG, JPEG or WebP image.'],
        ]);

        if (!preg_match(self::FACE_DATA_URI_REGEX, $dataUri)) {
            throw $invalid();
        }

        $binary = base64_decode(substr($dataUri, strpos($dataUri, ',') + 1), true);
        if ($binary === false || $binary === '' || strlen($binary) > self::MAX_FACE_BYTES) {
            throw $invalid();
        }

        $info = @getimagesizefromstring($binary);
        $extension = $info ? (self::IMAGE_EXTENSIONS[$info['mime']] ?? null) : null;
        if (!$extension || $extension === 'gif' || $extension === 'bmp') {
            throw $invalid();
        }

        $filename = time() . '_face_' . Str::random(16) . '.' . $extension;
        File::ensureDirectoryExists($this->privateFacesPath(), 0755);
        File::put($this->privateFacesPath() . DIRECTORY_SEPARATOR . $filename, $binary);

        return '/' . self::FACES_DIR . '/' . $filename;
    }

    /** Folder for face photos that is not reachable from the web. */
    public function privateFacesPath(): string
    {
        return storage_path('app' . DIRECTORY_SEPARATOR . 'private' . DIRECTORY_SEPARATOR . self::FACES_DIR);
    }

    /** Where face photos were stored before they were made private. */
    public function legacyFacesPath(): string
    {
        return public_path(self::FACES_DIR);
    }

    /**
     * Move face photos out of the public folder. Returns the number moved.
     * Database paths ("/faces/<name>") stay the same.
     */
    public function moveLegacyFacesToPrivate(): int
    {
        if (!is_dir($this->legacyFacesPath())) {
            return 0;
        }

        File::ensureDirectoryExists($this->privateFacesPath(), 0755);
        $moved = 0;
        foreach (File::files($this->legacyFacesPath()) as $file) {
            $target = $this->privateFacesPath() . DIRECTORY_SEPARATOR . $file->getFilename();
            if (!file_exists($target) && File::move($file->getPathname(), $target)) {
                $moved++;
            }
        }

        return $moved;
    }

    /** Save an uploaded profile picture under a server-generated name. */
    public function storeProfilePicture(UploadedFile $file): string
    {
        $extension = self::IMAGE_EXTENSIONS[$file->getMimeType()] ?? 'jpg';
        $filename = time() . '_profile_' . Str::random(16) . '.' . $extension;

        File::ensureDirectoryExists(public_path(self::PROFILES_DIR), 0755);
        $file->move(public_path(self::PROFILES_DIR), $filename);

        return '/' . self::PROFILES_DIR . '/' . $filename;
    }

    public function deleteFace(?string $storedPath): bool
    {
        $deletedPrivate = $this->deleteInside(dirname($this->privateFacesPath()), self::FACES_DIR, $storedPath);
        $deletedLegacy = $this->deleteInside(public_path(), self::FACES_DIR, $storedPath);

        return $deletedPrivate || $deletedLegacy;
    }

    public function deleteProfilePicture(?string $storedPath): bool
    {
        return $this->deleteInside(public_path(), self::PROFILES_DIR, $storedPath);
    }

    /**
     * Delete $storedPath only if it is a regular file located directly inside
     * $root/$directory. Anything else (traversal, other folders, symlinked
     * escapes, nested paths) is ignored.
     */
    private function deleteInside(string $root, string $directory, ?string $storedPath): bool
    {
        if (!is_string($storedPath) || $storedPath === '') {
            return false;
        }

        $baseDir = realpath($root . DIRECTORY_SEPARATOR . $directory);
        $target = realpath($root . DIRECTORY_SEPARATOR . ltrim($storedPath, '/\\'));

        if ($baseDir === false || $target === false || !is_file($target)) {
            return false;
        }

        if (dirname($target) !== $baseDir) {
            return false;
        }

        return File::delete($target);
    }
}
